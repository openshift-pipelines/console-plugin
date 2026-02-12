import { TektonConfigModel } from '../../models';
import { TektonConfig } from '../../types';
import { useK8sGet } from './use-k8sGet-hook';

import { KUEUE_LABEL_PREFIX, PIPELINE_RUN_MANAGED_BY_KUEUE_LABEL } from "../../consts";

export type UseMultiClusterProxyOptions = {
  managedBy?: string, 
  labels?: {[key: string]: string}
}

/**
 * Hook to detect if the current cluster is a hub cluster and if the resource had executed in a Spoke Cluster
 * A hub cluster has TektonConfig.spec.role === 'hub'.
 * A resource executed on Spoke cluster has managedBy === 'kueue.x-k8s.io/multikueue' (for PLRs) or lables with prefix 'kueue.x-k8s.io' (for TRs)
 *
 * @returns { isResourceManagedByKueue } - isResourceManagedByKueue indicates if the resource had executed on a Spoke Cluster
 */
export const useMultiClusterProxyService = (options: UseMultiClusterProxyOptions): {isResourceManagedByKueue: boolean} => {
  const [tektonConfig, loaded] = useK8sGet<TektonConfig>(
    TektonConfigModel,
    'config',
  );
  const isHub = loaded && tektonConfig?.spec?.role === 'hub';
  
  const isResourceManagedByKueue = isHub && (options?.managedBy === PIPELINE_RUN_MANAGED_BY_KUEUE_LABEL || (options?.labels && Object.keys(options?.labels).some(key => key.startsWith(KUEUE_LABEL_PREFIX))));
  return { isResourceManagedByKueue }
};