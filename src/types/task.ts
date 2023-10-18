import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import { TektonTaskSpec } from './coreTekton';

export type TaskKind = K8sResourceCommon & {
  spec: TektonTaskSpec;
};
