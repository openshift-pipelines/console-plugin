import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { useMemo } from 'react';
import {
  ClusterQueueModel,
  LocalQueueModel,
  MultiKueueClusterModel,
  WorkloadModel,
} from '../../models';
import {
  ClusterQueueKind,
  LocalQueueKind,
  MultiKueueClusterKind,
  WorkloadKind,
} from '../../types';
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

export const useClusterQueues = (): [ClusterQueueKind[], boolean, unknown] => {
  const { isHub } = useMultiClusterProxyService({});

  const watchOptions = useMemo(
    () =>
      isHub
        ? {
            isList: true,
            groupVersionKind: {
              group: ClusterQueueModel.apiGroup,
              kind: ClusterQueueModel.kind,
              version: ClusterQueueModel.apiVersion,
            },
          }
        : null,
    [isHub],
  );

  return useK8sWatchResource<ClusterQueueKind[]>(watchOptions);
};

export const useLocalQueues = (
  namespace: string,
): [LocalQueueKind[], boolean, unknown] => {
  const { isHub } = useMultiClusterProxyService({});

  const watchOptions = useMemo(
    () =>
      isHub && namespace
        ? {
            isList: true,
            groupVersionKind: {
              group: LocalQueueModel.apiGroup,
              kind: LocalQueueModel.kind,
              version: LocalQueueModel.apiVersion,
            },
            ...(namespace !== '-' ? { namespace } : {}),
            namespaced: true,
          }
        : null,
    [isHub, namespace],
  );

  return useK8sWatchResource<LocalQueueKind[]>(watchOptions);
};
