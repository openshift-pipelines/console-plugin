import { SecretKind, SecretType } from '../../types';
import { BaseService } from './base-service';
import { BitbucketService } from './bitbucket-service';
import { GiteaService } from './gitea-service';
import { GithubService } from './github-service';
import { GitlabService } from './gitlab-service';
import { GitProvider, GitSecretType, GitSource } from './types';

export function getGitService(
  repository: string,
  gitProvider: GitProvider,
  ref?: string,
  contextDir?: string,
  secret?: SecretKind,
  devfilePath?: string,
  dockerfilePath?: string,
): BaseService {
  let secretType: GitSecretType;
  let secretContent: any;
  switch (secret?.type) {
    case SecretType.basicAuth:
      secretType = GitSecretType.BASIC_AUTH;
      secretContent = secret.data;
      break;
    case SecretType.sshAuth:
      secretType = GitSecretType.SSH;
      secretContent = secret['ssh-privatekey'];
      break;
    default:
      secretType = GitSecretType.NO_AUTH;
  }
  const gitSource: GitSource = {
    url: repository,
    ref,
    contextDir,
    secretType,
    secretContent,
    devfilePath,
    dockerfilePath,
  };

  switch (gitProvider) {
    case GitProvider.GITHUB:
      return new GithubService(gitSource);
    case GitProvider.BITBUCKET:
      return new BitbucketService(gitSource);
    case GitProvider.GITLAB:
      return new GitlabService(gitSource);
    case GitProvider.GITEA:
      return new GiteaService(gitSource);
    default:
      return null;
  }
}
