import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import { ApproverInput, ApproverResponse, CustomRunStatus } from './approvals';
import { TektonTaskSpec } from './coreTekton';

export type TaskKind = K8sResourceCommon & {
  spec: TektonTaskSpec;
};

export type CustomRunKind = K8sResourceCommon & {
  spec: {
    customRef: {
      apiVersion: string;
      kind: string;
    };
    serviceAccountName?: string;
    status?: CustomRunStatus;
    statusMessage?: string;
  };
};

export type ApprovalTaskKind = K8sResourceCommon & {
  spec?: {
    approvers: {
      input: ApproverInput;
      message?: string;
      name: string;
    }[];
    numberOfApprovalsRequired: number;
    description?: string;
  };
  status?: {
    state: ApproverResponse;
    approvers: string[];
    approversResponse: {
      name: string;
      response: ApproverResponse;
    }[];
  };
};
