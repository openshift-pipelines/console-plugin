import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { useMemo } from 'react';
import { MultiKueueClusterModel, WorkloadModel } from '../../models';
import { MultiKueueClusterKind, WorkloadKind } from '../../types';
import { useMultiClusterProxyService } from './useMultiClusterProxyService';

/**
 * Watch MultiKueueClusters (cluster-scoped). Gated to hub clusters via TektonConfig.
 */
export const useMultiKueueClusters = (): [
  MultiKueueClusterKind[],
  boolean,
  unknown,
] => {
  const { isHub } = useMultiClusterProxyService({});

  const watchOptions = useMemo(
    () =>
      isHub
        ? {
            isList: true,
            groupVersionKind: {
              group: MultiKueueClusterModel.apiGroup,
              kind: MultiKueueClusterModel.kind,
              version: MultiKueueClusterModel.apiVersion,
            },
          }
        : null,
    [isHub],
  );

  return useK8sWatchResource<MultiKueueClusterKind[]>(watchOptions);
};

/**
 * Watch Workloads in a namespace. Gated to hub clusters via TektonConfig.
 */
export const useWorkloads = (
  namespace: string,
): [WorkloadKind[], boolean, unknown] => {
  const { isHub } = useMultiClusterProxyService({});

  const watchOptions = useMemo(
    () =>
      isHub && namespace && namespace !== '-'
        ? {
            isList: true,
            groupVersionKind: {
              group: WorkloadModel.apiGroup,
              kind: WorkloadModel.kind,
              version: WorkloadModel.apiVersion,
            },
            namespace,
            namespaced: true,
          }
        : null,
    [isHub, namespace],
  );

  return useK8sWatchResource<WorkloadKind[]>(watchOptions);
};
