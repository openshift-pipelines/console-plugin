/* eslint-disable @typescript-eslint/no-explicit-any */
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';

export type Project = K8sResourceCommon;

export type K8sResourceKind = K8sResourceCommon & {
  spec?: {
    [key: string]: any;
  };
  status?: { [key: string]: any };
  data?: { [key: string]: any };
};

export type UpdateHistory = {
  state: 'Completed' | 'Partial';
  startedTime: string;
  completionTime: string;
  version: string;
  image: string;
  verified: boolean;
};

export type Release = {
  version: string;
  image: string;
  url?: string;
  channels?: string[];
};
type ClusterVersionStatus = {
  desired: Release;
  history: UpdateHistory[];
};

type ClusterVersionSpec = {
  channel: string;
  clusterID: string;
  desiredUpdate?: Release;
  upstream?: string;
};

export type ClusterVersionKind = {
  spec: ClusterVersionSpec;
  status: ClusterVersionStatus;
} & K8sResourceCommon;
