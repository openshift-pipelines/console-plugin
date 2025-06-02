import { Octokit } from '@octokit/core';
import { Base64 } from 'js-base64';

import { consoleFetchJSON } from '@openshift-console/dynamic-plugin-sdk';
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

type GHWebhookBody = {
  name: string;
  active: boolean;
  config: {
    url: string;
    content_type: string;
    insecure_ssl: string;
    secret: string;
  };
  events: string[];
};

type GithubWebhookRequest = {
  headers: Headers;
  hostName: string;
  owner: string;
  repoName: string;
  body: GHWebhookBody;
};

export const GITHUB_WEBHOOK_BACKEND_URL = '/api/dev-console/webhooks/github';

export class GithubService extends BaseService {
  private readonly client: Octokit;

  private readonly metadata: RepoMetadata;

  constructor(gitsource: GitSource) {
    super(gitsource);
    const authOpts = this.getAuthProvider();
    this.metadata = this.getRepoMetadata();
    const baseUrl =
      this.metadata.host === 'github.com'
        ? undefined
        : `https://${this.metadata.host}/api/v3`;

    this.client = new Octokit({ auth: authOpts?.auth, baseUrl });
  }

  protected getAuthProvider = (): { auth: string } | null => {
    switch (this.gitsource.secretType) {
      case GitSecretType.PERSONAL_ACCESS_TOKEN:
      case GitSecretType.BASIC_AUTH:
      case GitSecretType.OAUTH:
        return { auth: Base64.decode(this.gitsource.secretContent.password) };
      default:
        return null;
    }
  };

  protected getRepoMetadata = (): RepoMetadata => {
    const { name, owner, source } = parseGitUrl(this.gitsource.url);
    const contextDir = this.gitsource.contextDir?.replace(/\/$/, '') || '';
    return {
      repoName: name,
      owner,
      host: source,
      defaultBranch: this.gitsource.ref,
      contextDir,
      devfilePath: this.gitsource.devfilePath,
      dockerfilePath: this.gitsource.dockerfilePath,
    };
  };

  isRepoReachable = async (): Promise<RepoStatus> => {
    try {
      const resp = await this.client.request('GET /repos/{owner}/{repo}', {
        owner: this.metadata.owner,
        repo: this.metadata.repoName,
      });
      return resp.status === 200
        ? RepoStatus.Reachable
        : RepoStatus.Unreachable;
    } catch (e: any) {
      switch (e.status) {
        case 403:
          return RepoStatus.RateLimitExceeded;
        case 404:
          return RepoStatus.PrivateRepo;
        case 422:
          return RepoStatus.InvalidGitTypeSelected;
        default:
          return RepoStatus.Unreachable;
      }
    }
  };

  getRepoBranchList = async (): Promise<BranchList> => {
    try {
      const resp = await this.client.request(
        'GET /repos/{owner}/{repo}/branches',
        {
          owner: this.metadata.owner,
          repo: this.metadata.repoName,
        },
      );
      return { branches: resp.data.map((b: any) => b.name) };
    } catch {
      return { branches: [] };
    }
  };

  getRepoFileList = async (params?: {
    specificPath?: string;
  }): Promise<RepoFileList> => {
    try {
      const path = params?.specificPath
        ? `${this.metadata.contextDir}/${params.specificPath}`
        : this.metadata.contextDir;

      const resp = await this.client.request(
        'GET /repos/{owner}/{repo}/contents/{path}',
        {
          owner: this.metadata.owner,
          repo: this.metadata.repoName,
          path,
          ref: this.metadata.defaultBranch,
        },
      );

      if (Array.isArray(resp.data)) {
        return { files: resp.data.map((item: any) => item.name) };
      }
      return { files: [] };
    } catch {
      return { files: [] };
    }
  };

  getRepoLanguageList = async (): Promise<RepoLanguageList> => {
    try {
      const resp = await this.client.request(
        'GET /repos/{owner}/{repo}/languages',
        {
          owner: this.metadata.owner,
          repo: this.metadata.repoName,
        },
      );
      return { languages: Object.keys(resp.data) };
    } catch {
      return { languages: [] };
    }
  };

  createRepoWebhook = async (
    token: string,
    webhookURL: string,
    sslVerification: boolean,
    webhookSecret: string,
  ): Promise<boolean> => {
    const headers = new Headers({
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    });

    const body: GHWebhookBody = {
      name: 'web',
      active: true,
      config: {
        url: webhookURL,
        content_type: 'json',
        insecure_ssl: sslVerification ? '0' : '1',
        secret: webhookSecret,
      },
      events: ['push', 'pull_request'],
    };

    const AddWebhookBaseURL =
      this.metadata.host === 'github.com'
        ? 'https://api.github.com'
        : `https://${this.metadata.host}/api/v3`;

    const webhookRequestBody: GithubWebhookRequest = {
      headers,
      hostName: AddWebhookBaseURL,
      owner: this.metadata.owner,
      repoName: this.metadata.repoName,
      body,
    };

    const webhookResponse: DevConsoleEndpointResponse =
      await consoleFetchJSON.post(
        GITHUB_WEBHOOK_BACKEND_URL,
        webhookRequestBody,
      );

    if (!webhookResponse.statusCode) {
      throw new Error('Unexpected proxy response: Status code is missing!');
    }

    return webhookResponse.statusCode === 201;
  };

  isFilePresent = async (path: string): Promise<boolean> => {
    try {
      const resp = await this.client.request(
        'GET /repos/{owner}/{repo}/contents/{path}',
        {
          owner: this.metadata.owner,
          repo: this.metadata.repoName,
          path,
          ref: this.metadata.defaultBranch,
        },
      );
      return resp.status === 200;
    } catch {
      return false;
    }
  };

  getFileContent = async (path: string): Promise<string | null> => {
    try {
      const resp = await this.client.request(
        'GET /repos/{owner}/{repo}/contents/{path}',
        {
          owner: this.metadata.owner,
          repo: this.metadata.repoName,
          path,
          ref: this.metadata.defaultBranch,
        },
      );

      if (resp.status === 200 && 'content' in resp.data) {
        return Buffer.from(resp.data.content, 'base64').toString();
      }
      return null;
    } catch {
      return null;
    }
  };

  isDockerfilePresent = () =>
    this.isFilePresent(
      `${this.metadata.contextDir}/${this.metadata.dockerfilePath}`,
    );

  isTektonFolderPresent = () =>
    this.isFilePresent(`${this.metadata.contextDir}/.tekton`);

  getDockerfileContent = () =>
    this.getFileContent(
      `${this.metadata.contextDir}/${this.metadata.dockerfilePath}`,
    );

  isFuncYamlPresent = () =>
    this.isFilePresent(`${this.metadata.contextDir}/func.yaml`) ||
    this.isFilePresent(`${this.metadata.contextDir}/func.yml`);

  getFuncYamlContent = () =>
    this.getFileContent(`${this.metadata.contextDir}/func.yaml`) ||
    this.getFileContent(`${this.metadata.contextDir}/func.yml`);

  isDevfilePresent = () =>
    this.isFilePresent(
      `${this.metadata.contextDir}/${this.metadata.devfilePath}`,
    );

  getDevfileContent = () =>
    this.getFileContent(
      `${this.metadata.contextDir}/${this.metadata.devfilePath}`,
    );

  getPackageJsonContent = () =>
    this.getFileContent(`${this.metadata.contextDir}/package.json`);
}
