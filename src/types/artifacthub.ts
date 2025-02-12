import { DevConsoleEndpointRequest } from './backendAPI';

export type ArtifactHubRepository = {
  name: string;
  kind: number;
  url: string;
  display_name: string;
  repository_id: string;
  organization_name: string;
  organization_display_name: string;
};

export type ArtifactHubVersion = {
  version: string;
  contains_security_update: boolean;
  prerelease: boolean;
  ts: number;
};

export type ArtifactHubTask = {
  package_id: string;
  name: string;
  description: string;
  version: string;
  display_name: string;
  repository: ArtifactHubRepository;
};

export type ArtifactHubTaskDetails = {
  package_id: string;
  name: string;
  description: string;
  display_name: string;
  keywords: string[];
  platforms: string[];
  version: ArtifactHubVersion[];
  available_versions: [];
  content_url: string;
  repository: ArtifactHubRepository;
};

export type TaskSearchRequest = {
  searchQuery?: string;
} & DevConsoleEndpointRequest;

export type TaskDetailsRequest = {
  repoName: string;
  name: string;
  version: string;
} & DevConsoleEndpointRequest;

export type TaskYAMLRequest = {
  yamlPath: string;
} & DevConsoleEndpointRequest;
