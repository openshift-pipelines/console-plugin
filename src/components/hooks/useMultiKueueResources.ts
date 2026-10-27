import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { useMemo } from 'react';
import { WORKLOAD_KUEUE_UID_LABEL } from '../../consts';
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
  PipelineRunKind,
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
  pipelineRun: PipelineRunKind,
): [WorkloadKind[], boolean, unknown] => {
  const { isHub } = useMultiClusterProxyService({});

  const watchOptions = useMemo(() => {
    const workloadResource = pipelineRun?.metadata?.uid
      ? {
          isList: true,
          groupVersionKind: {
            group: WorkloadModel.apiGroup,
            kind: WorkloadModel.kind,
            version: WorkloadModel.apiVersion,
          },
          ...(namespace !== '-' ? { namespace } : {}),
          namespaced: true,
          selector: {
            matchLabels: {
              [WORKLOAD_KUEUE_UID_LABEL]: pipelineRun?.metadata?.uid,
            },
          },
        }
      : {
          isList: true,
          groupVersionKind: {
            group: WorkloadModel.apiGroup,
            kind: WorkloadModel.kind,
            version: WorkloadModel.apiVersion,
          },
          ...(namespace !== '-' ? { namespace } : {}),
          namespaced: true,
        };
    return isHub ? workloadResource : null;
  }, [isHub, namespace, pipelineRun?.metadata?.uid]);

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
