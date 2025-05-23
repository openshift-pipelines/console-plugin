import {
  K8sResourceCommon,
  K8sResourceKind,
} from '@openshift-console/dynamic-plugin-sdk';
import { Condition, SecretKind } from '../../types';
import { GitProvider } from '../utils/repository-utils';

export type RepositoryStatus = {
  completionTime?: string;
  conditions?: Condition[];
  logurl?: string;
  pipelineRunName: string;
  sha?: string;
  startTime?: string;
  title?: string;
  event_type?: string;
  target_branch?: string;
};

export type RepositoryKind = K8sResourceKind & {
  spec?: {
    url: string;
    branch?: string;
    namespace?: string;
  };
  pipelinerun_status?: RepositoryStatus[];
};

export type RepositoryFormValues = {
  name: string;
  gitProvider: GitProvider;
  gitUrl: string;
  githubAppAvailable: boolean;
  method: string;
  yamlData: string;
  showOverviewPage: boolean;
  webhook: {
    method: string;
    token: string;
    secret: string;
    url: string;
    secretObj?: SecretKind;
    user?: string;
    autoAttach?: boolean;
  };
  isSubmittingForm?: boolean;
};

export type ConfigMapKind = {
  data?: { [key: string]: string };
  binaryData?: { [key: string]: string };
} & K8sResourceCommon;

export interface ImageTag {
  name: string;
  annotations: {
    [key: string]: string;
  };
  generation: number;
  [key: string]: any;
}
export interface BuilderImage {
  obj: K8sResourceKind;
  name: string;
  displayName: string;
  description: string;
  title: string;
  iconUrl?: string;
  tags: ImageTag[];
  recentTag: ImageTag;
  imageStreamNamespace: string;
}

export interface NormalizedBuilderImages {
  [builderImageName: string]: BuilderImage;
}

export enum PacConfigurationTypes {
  GITHUB = 'github',
  WEBHOOK = 'webhook',
}

export enum PipelineType {
  PAC = 'pac',
  PIPELINE = 'pipeline',
}
