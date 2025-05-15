export enum GitSecretType {
  NO_AUTH,
  BASIC_AUTH,
  SSH,
  PERSONAL_ACCESS_TOKEN,
  OAUTH,
}

export interface GitSource {
  url: string;
  secretType?: GitSecretType;
  secretContent?: any;
  ref?: string;
  contextDir?: string;
  devfilePath?: string;
  dockerfilePath?: string;
}

export enum GitProvider {
  GITHUB = 'github',
  BITBUCKET = 'bitbucket',
  GITLAB = 'gitlab',
  GITEA = 'gitea',
  UNSURE = 'other',
  INVALID = '',
}

export enum ImportStrategy {
  S2I,
  DOCKERFILE,
  DEVFILE,
  SERVERLESS_FUNCTION,
}

export type DevConsoleEndpointResponse = {
  statusCode: number;
  headers: Record<string, string[]>;
  body: string;
};
