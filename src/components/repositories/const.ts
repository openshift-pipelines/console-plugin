import { GitProvider } from '../utils/repository-utils';
import { RepositoryFormValues } from './types';

export const defaultRepositoryFormValues: RepositoryFormValues = {
  gitUrl: '',
  githubAppAvailable: false,
  gitProvider: GitProvider.INVALID,
  name: '',
  method: 'github',
  showOverviewPage: false,
  yamlData: ``,
  webhook: {
    token: '',
    method: 'token',
    secret: '',
    url: '',
    user: '',
    autoAttach: false,
  },
};

export const bitBucketUserNameRegex = /^[a-z]([a-z0-9_]-?)*[a-z0-9]$/;
export const gitProviderTypesHosts = [
  'github.com',
  'bitbucket.org',
  'gitlab.com',
];

export enum RepositoryRuntimes {
  golang = 'go',
  nodejs = 'nodejs',
  python = 'python',
  java = 'java',
}

export const WebhookDocLinks = {
  [GitProvider.GITHUB]:
    'https://docs.github.com/en/developers/webhooks-and-events/webhooks/creating-webhooks',
  [GitProvider.GITLAB]:
    'https://docs.gitlab.com/ee/user/project/integrations/webhooks.html#configure-a-webhook-in-gitlab',
  [GitProvider.BITBUCKET]:
    'https://support.atlassian.com/bitbucket-cloud/docs/manage-webhooks/',
};

export const AccessTokenDocLinks = {
  [GitProvider.GITHUB]:
    'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token',
  [GitProvider.GITLAB]:
    'https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html',
  [GitProvider.BITBUCKET]:
    'https://support.atlassian.com/bitbucket-cloud/docs/app-passwords/',
};
