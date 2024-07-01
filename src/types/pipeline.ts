import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import { RunStatus } from '@patternfly/react-topology';
import {
  TektonParam,
  TektonResource,
  TektonResourceGroup,
  TektonTaskSpec,
  TektonWorkspace,
} from './coreTekton';
import { TaskKind } from './task';

export type PipelineTaskRef = {
  kind?: string;
  name?: string;
};

export type PipelineTaskWorkspace = {
  name: string;
  workspace: string;
  optional?: boolean;
};

export type PipelineTaskResource = {
  name: string;
  resource?: string;
  from?: string[];
};

export type PipelineTaskParam = {
  name: string;
  value: any;
};

export type WhenExpression = {
  input: string;
  operator: string;
  values: string[];
};

export type PipelineResult = {
  name: string;
  value: string;
  description?: string;
};

export type PipelineTask = {
  name: string;
  params?: PipelineTaskParam[];
  resources?: TektonResourceGroup<PipelineTaskResource>;
  runAfter?: string[];
  taskRef?: PipelineTaskRef;
  taskSpec?: TektonTaskSpec;
  when?: WhenExpression[];
  workspaces?: PipelineTaskWorkspace[];
};

export type PipelineTaskWithStatus = PipelineTask & {
  status: {
    reason: RunStatus;
  };
};

export type PipelineSpec = {
  params?: TektonParam[];
  resources?: TektonResource[];
  serviceAccountName?: string;
  tasks: PipelineTask[];
  workspaces?: TektonWorkspace[];
  finally?: PipelineTask[];
  results?: PipelineResult[];
};

export type PipelineKind = K8sResourceCommon & {
  spec: PipelineSpec;
};

export enum SecretType {
  basicAuth = 'kubernetes.io/basic-auth',
  dockercfg = 'kubernetes.io/dockercfg',
  dockerconfigjson = 'kubernetes.io/dockerconfigjson',
  opaque = 'Opaque',
  serviceAccountToken = 'kubernetes.io/service-account-token',
  sshAuth = 'kubernetes.io/ssh-auth',
  tls = 'kubernetes.io/tls',
}

export type PipelineBuilderTaskResources = {
  namespacedTasks: TaskKind[];
  clusterTasks: TaskKind[];
  tasksLoaded: boolean;
};
