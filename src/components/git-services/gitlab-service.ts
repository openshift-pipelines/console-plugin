import { consoleFetchJSON } from '@openshift-console/dynamic-plugin-sdk';
import { Gitlab } from 'gitlab';
import i18n from 'i18next';
import { Base64 } from 'js-base64';
import { BaseService } from './base-service';
import {
  BranchList,
  DevConsoleEndpointResponse,
  GitSecretType,
  GitSource,
  RepoFileList,
  RepoLanguageList,
  RepoMetadata,
  RepoStatus,
} from './types';
import { parseGitUrl } from './utils/common';

type GitlabRepo = {
  id: number;
  path_with_namespace: string;
};

type GLWebhookBody = {
  url: string;
  push_events: boolean;
  merge_requests_events: boolean;
  enable_ssl_verification: boolean;
  token: string;
};

type GitlabWebhookRequest = {
  headers: Headers;
  hostName: string;
  projectID: string;
  body: GLWebhookBody;
};

export const GITLAB_WEBHOOK_BACKEND_URL = '/api/dev-console/webhooks/gitlab';

const removeLeadingSlash = (str: string) => str?.replace(/^\//, '') || '';

export class GitlabService extends BaseService {
  private readonly client: any;

  private readonly metadata: RepoMetadata;

  private repo: GitlabRepo;

  constructor(gitsource: GitSource) {
    super(gitsource);
    this.metadata = this.getRepoMetadata();
    const token = this.getAuthProvider();
    this.client = new Gitlab({
      host: this.metadata.host,
      token,
    });
    this.repo = null;
  }

  private getRepo = async (): Promise<GitlabRepo> => {
    if (this.repo) {
      return Promise.resolve(this.repo);
    }
    const repo: GitlabRepo = await this.client.Projects.show(
      this.metadata.fullName,
    );
    if (!repo) {
      throw new Error(i18n.t('Unable to find repository'));
    } else if (repo.path_with_namespace !== this.metadata.fullName) {
      throw new Error(
        i18n.t(
          'Repository path {{path}} does not match expected name {{name}}',
          {
            path: repo.path_with_namespace,
            name: this.metadata.fullName,
          },
        ),
      );
    }

    this.repo = repo;
    return Promise.resolve(this.repo);
  };

  getRepoMetadata(): RepoMetadata {
    const {
      name,
      owner,
      source: resource,
      fullName,
    } = parseGitUrl(this.gitsource.url);

    const contextDir = removeLeadingSlash(this.gitsource.contextDir);
    const host = `https://${resource}`;
    return {
      repoName: name,
      owner,
      host,
      defaultBranch: this.gitsource.ref,
      fullName,
      contextDir,
      devfilePath: this.gitsource.devfilePath,
      dockerfilePath: this.gitsource.dockerfilePath,
    };
  }

  getAuthProvider = (): any => {
    switch (this.gitsource.secretType) {
      case GitSecretType.PERSONAL_ACCESS_TOKEN:
      case GitSecretType.OAUTH:
      case GitSecretType.BASIC_AUTH:
        return Base64.decode(this.gitsource.secretContent.password);
      default:
        return null;
    }
  };

  getProjectId = async (): Promise<any> => {
    const repo = await this.getRepo();
    return repo.id;
  };

  isRepoReachable = async (): Promise<RepoStatus> => {
    try {
      await this.getRepo();
      return RepoStatus.Reachable;
    } catch (e) {
      switch (e.status) {
        case 429: {
          return RepoStatus.RateLimitExceeded;
        }
        case 403: {
          return RepoStatus.PrivateRepo;
        }
        case 404: {
          return RepoStatus.ResourceNotFound;
        }
        case 422: {
          return RepoStatus.InvalidGitTypeSelected;
        }
        default: {
          return RepoStatus.Unreachable;
        }
      }
    }
  };

  getRepoBranchList = async (): Promise<BranchList> => {
    try {
      const projectID = await this.getProjectId();
      const resp = await this.client.Branches.all(projectID);
      const list = resp.map((b) => b.name);
      return { branches: list };
    } catch (e) {
      return { branches: [] };
    }
  };

  getRepoFileList = async (params?: {
    specificPath?: string;
    includeFolder?: boolean;
  }): Promise<RepoFileList> => {
    try {
      const projectID = await this.getProjectId();
      const resp = await this.client.Repositories.tree(projectID, {
        ...(params?.specificPath
          ? { path: this.filePath(params.specificPath) }
          : { path: this.metadata.contextDir }),
      });
      const files = resp.reduce((acc, file) => {
        if (
          file.type === 'blob' ||
          (params?.includeFolder && file.type === 'tree')
        )
          acc.push(file.path);
        return acc;
      }, []);
      return { files };
    } catch (e) {
      return { files: [] };
    }
  };

  getRepoLanguageList = async (): Promise<RepoLanguageList> => {
    try {
      const projectID = await this.getProjectId();
      const resp = await this.client.Projects.languages(projectID);
      return { languages: Object.keys(resp) };
    } catch (e) {
      return { languages: [] };
    }
  };

  createRepoWebhook = async (
    token: string,
    webhookURL: string,
    sslVerification: boolean,
    webhookSecret: string,
  ): Promise<boolean> => {
    const projectID = await this.getProjectId();
    const headers = new Headers({
      'Content-Type': 'application/json',
      'PRIVATE-TOKEN': token,
    });
    const body: GLWebhookBody = {
      url: webhookURL,
      push_events: true,
      merge_requests_events: true,
      enable_ssl_verification: sslVerification,
      token: webhookSecret,
    };

    const webhookRequestBody: GitlabWebhookRequest = {
      headers,
      hostName: this.metadata.host,
      projectID: projectID.toString(),
      body,
    };

    const webhookResponse: DevConsoleEndpointResponse =
      await consoleFetchJSON.post(
        GITLAB_WEBHOOK_BACKEND_URL,
        webhookRequestBody,
      );
    if (!webhookResponse.statusCode) {
      throw new Error('Unexpected proxy response: Status code is missing!');
    }
    return webhookResponse.statusCode === 201;
  };

  isFilePresent = async (path: string): Promise<boolean> => {
    try {
      const projectID = await this.getProjectId();
      const ref =
        this.metadata.defaultBranch || (this.repo as any)?.default_branch;
      await this.client.RepositoryFiles.showRaw(projectID, path, ref);
      return true;
    } catch (e) {
      return false;
    }
  };

  getFileContent = async (path: string): Promise<string | null> => {
    try {
      const projectID = await this.getProjectId();
      const ref =
        this.metadata.defaultBranch || (this.repo as any)?.default_branch;
      const filePath = path.replace(/^\/+/, '');
      return await this.client.RepositoryFiles.showRaw(
        projectID,
        filePath,
        ref,
      );
    } catch (e) {
      return null;
    }
  };

  filePath = (file: string): string => {
    return this.metadata.contextDir
      ? `${this.metadata.contextDir}/${file}`
      : file;
  };

  isDockerfilePresent = () =>
    this.isFilePresent(this.filePath(`${this.metadata.dockerfilePath}`));

  isTektonFolderPresent = async (): Promise<boolean> => {
    try {
      const projectID = await this.getProjectId();
      const resp = await this.client.Repositories.tree(projectID, {
        path: this.metadata.contextDir,
      });
      const tektonFolderPresent = resp.find(
        (file) => file.type === 'tree' && file.name === '.tekton',
      );
      return !!tektonFolderPresent;
    } catch (e) {
      return false;
    }
  };

  getDockerfileContent = () =>
    this.getFileContent(this.filePath(`${this.metadata.dockerfilePath}`));

  isFuncYamlPresent = () =>
    this.isFilePresent(this.filePath('func.yaml')) ||
    this.isFilePresent(this.filePath('func.yml'));

  getFuncYamlContent = () =>
    this.getFileContent(this.filePath('func.yaml')) ||
    this.getFileContent(this.filePath('func.yml'));

  isDevfilePresent = () =>
    this.isFilePresent(this.filePath(`${this.metadata.devfilePath}`));

  getDevfileContent = () =>
    this.getFileContent(this.filePath(`${this.metadata.devfilePath}`));

  getPackageJsonContent = () =>
    this.getFileContent(this.filePath('package.json'));
}
