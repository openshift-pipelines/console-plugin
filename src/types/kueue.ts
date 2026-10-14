import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import { Condition } from './pipelineRun';

export type MultiKueueClusterKind = K8sResourceCommon & {
  spec?: {
    clusterSource?: {
      kubeConfig?: {
        location?: string;
        locationType?: string;
      };
    };
  };
  status?: {
    conditions?: (Condition & { observedGeneration?: number })[];
  };
};

export type WorkloadPodSet = {
  count?: number;
  name?: string;
  template?: {
    metadata?: { [key: string]: unknown };
    spec?: {
      containers?: {
        image?: string;
        name?: string;
        resources?: {
          requests?: { [key: string]: string };
        };
      }[];
    };
  };
};

export type WorkloadAdmissionCheck = {
  lastTransitionTime?: string;
  message?: string;
  name?: string;
  state?: string;
};

export type WorkloadPodSetAssignment = {
  count?: number;
  flavors?: { [key: string]: string };
  name?: string;
  resourceUsage?: { [key: string]: string };
};

export type WorkloadKind = K8sResourceCommon & {
  spec?: {
    active?: boolean;
    podSets?: WorkloadPodSet[];
    priority?: number;
    queueName?: string;
  };
  status?: {
    admission?: {
      clusterQueue?: string;
      podSetAssignments?: WorkloadPodSetAssignment[];
    };
    admissionChecks?: WorkloadAdmissionCheck[];
    clusterName?: string;
    conditions?: (Condition & { observedGeneration?: number })[];
  };
};
