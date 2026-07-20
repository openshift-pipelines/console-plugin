import {
  getGroupVersionKindForModel,
  K8sGroupVersionKind,
  K8sResourceKind,
  Selector,
  useFlag,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { uniqBy } from 'lodash-es';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ApprovalFields,
  ApprovalLabels,
  FLAG_PIPELINE_TEKTON_RESULT_INSTALLED,
  TektonResourceLabel,
} from '../../consts';
import {
  ApprovalTaskModel,
  PipelineRunModel,
  TaskRunModel,
} from '../../models';
import { ApprovalTaskKind, PipelineRunKind, TaskRunKind } from '../../types';
import { useDeepCompareMemoize } from '../utils/common-utils';
import { AND, EQ } from '../utils/tekton-results';
import { useMultiClusterProxyService } from './useMultiClusterProxyService';
import { useMultiClusterTaskRuns } from './useMultiClusterTaskRuns';
import { useTRRuns } from './useTektonResults';

const PIPELINE_RUN_GVK = getGroupVersionKindForModel(PipelineRunModel);
const TASK_RUN_GVK = getGroupVersionKindForModel(TaskRunModel);

export const getTaskRunsOfPipelineRun = (
  taskRuns: TaskRunKind[],
  pipelineRunName: string,
): TaskRunKind[] => {
  return taskRuns.filter(
    (taskRun) =>
      taskRun.metadata?.labels[TektonResourceLabel.pipelinerun] ===
      pipelineRunName,
  );
};

export const useTaskRunsK8s = (
  namespace: string,
  pipelineRunName?: string,
): [TaskRunKind[], boolean, unknown] => {
  const taskRunResource = pipelineRunName
    ? {
        groupVersionKind: TASK_RUN_GVK,
        namespace,
        selector: {
          matchLabels: {
            [TektonResourceLabel.pipelinerun]: pipelineRunName,
          },
        },
        isList: true,
      }
    : {
        groupVersionKind: TASK_RUN_GVK,
        namespace,
        isList: true,
      };
  return useK8sWatchResource<TaskRunKind[]>(taskRunResource);
};

export type UseTaskRunsOptions = {
  taskName?: string;
  pipelineRunUid?: string;
  pipelineRunFinished?: boolean;
  pipelineRunManagedBy?: string;
  skipFetch?: boolean;
  name?: string /* used for fetching a single task run by metadata.name */;
  limit?: number /* used for fetching a limited number of task runs */;
  dateRangeFilter?: string;
};

export const useTaskRuns = (
  namespace: string,
  pipelineRunName?: string,
  taskName?: string,
  pipelineRunUid?: string,
  options?: UseTaskRunsOptions,
): [TaskRunKind[], boolean, boolean, Error | undefined, boolean, boolean] => {
  const {
    pipelineRunFinished,
    pipelineRunManagedBy,
    skipFetch,
    name,
    limit,
    dateRangeFilter,
  } = options || {};
  const selector: Selector = useMemo(() => {
    if (pipelineRunName && pipelineRunUid) {
      return {
        matchLabels: {
          [TektonResourceLabel.pipelinerun]: pipelineRunName,
          [TektonResourceLabel.pipelineRunUid]: pipelineRunUid,
        },
      };
    }
    if (pipelineRunName) {
      return {
        matchLabels: { [TektonResourceLabel.pipelinerun]: pipelineRunName },
      };
    }
    if (taskName) {
      return { matchLabels: { [TektonResourceLabel.pipelineTask]: taskName } };
    }
    return undefined;
  }, [taskName, pipelineRunName, pipelineRunUid]);
  const [
    taskRuns,
    k8sLoaded,
    trLoaded,
    error,
    pendingAdmission,
    proxyUnavailable,
  ] = useRuns<TaskRunKind>(
    TASK_RUN_GVK,
    namespace,
    { selector, skipFetch, name, limit, filter: dateRangeFilter },
    pipelineRunFinished,
    pipelineRunManagedBy,
  );

  const sortedTaskRuns = useMemo(
    () =>
      taskRuns?.sort((a, b) => {
        if (a?.status?.completionTime) {
          return b?.status?.completionTime &&
            new Date(a?.status?.completionTime) >
              new Date(b?.status?.completionTime)
            ? 1
            : -1;
        }
        return b?.status?.startTime ||
          new Date(a?.status?.startTime) > new Date(b?.status?.startTime)
          ? 1
          : -1;
      }),
    [taskRuns],
  );
  return useMemo(
    () => [
      sortedTaskRuns,
      k8sLoaded,
      trLoaded,
      error,
      pendingAdmission,
      proxyUnavailable,
    ],
    [
      sortedTaskRuns,
      k8sLoaded,
      trLoaded,
      error,
      pendingAdmission,
      proxyUnavailable,
    ],
  );
};

export const useApprovalTasks = (
  namespace: string,
  pipelineRunName?: string,
): [ApprovalTaskKind[], boolean, any] => {
  const selector: Selector = useMemo(() => {
    if (pipelineRunName) {
      return {
        matchLabels: {
          [ApprovalLabels[ApprovalFields.PIPELINE_RUN]]: pipelineRunName,
        },
      };
    }
    return undefined;
  }, [pipelineRunName]);
  const watchedResource = useMemo(
    () => ({
      isList: true,
      groupVersionKind: {
        group: ApprovalTaskModel.apiGroup,
        kind: ApprovalTaskModel.kind,
        version: ApprovalTaskModel.apiVersion,
      },
      namespace,
      namespaced: true,
      ...(selector && { selector }),
    }),
    [namespace],
  );

  return useK8sWatchResource<ApprovalTaskKind[]>(watchedResource);
};

export const usePipelineRuns = (
  namespace: string,
  options?: {
    selector?: Selector;
    limit?: number;
    name?: string;
    filter?: string;
    skipFetch?: boolean;
  },
): [PipelineRunKind[], boolean, boolean, Error | undefined, boolean, boolean] =>
  useRuns<PipelineRunKind>(PIPELINE_RUN_GVK, namespace, {
    selector: options?.selector,
    limit: options?.limit /* similar to one present in UseTaskRunsOptions */,
    name: options?.name /* similar to one present in UseTaskRunsOptions */,
    filter: options?.filter,
    skipFetch:
      options?.skipFetch /* similar to one present in UseTaskRunsOptions */,
  });

export const useRuns = <Kind extends K8sResourceKind>(
  groupVersionKind: K8sGroupVersionKind,
  namespace: string,
  options?: {
    selector?: Selector;
    limit?: number;
    name?: string;
    skipFetch?: boolean;
    filter?: string; // CEL expression sent to Tekton Results to retrieve PRs within the date range
  },
  pipelineRunFinished?: boolean,
  pipelineRunManagedBy?: string,
): [Kind[], boolean, boolean, Error | undefined, boolean, boolean] => {
  const optionsMemo = useDeepCompareMemoize(options);
  const isTektonResultEnabled = useFlag(FLAG_PIPELINE_TEKTON_RESULT_INSTALLED);
  const isList = !optionsMemo?.name;
  const limit = optionsMemo?.limit;
  const prevEtcdLengthRef = useRef(0);

  // Hub cluster detection
  const { isResourceManagedByKueue } = useMultiClusterProxyService({
    managedBy: pipelineRunManagedBy,
  });
  const isTaskRunQuery = groupVersionKind?.kind === TASK_RUN_GVK.kind;

  // Extract pipelineRunName from selector for multi-cluster API
  const pipelineRunName =
    optionsMemo?.selector?.matchLabels?.[TektonResourceLabel.pipelinerun];

  // Use multi-cluster hook for hub clusters fetching TaskRuns
  const shouldUseMultiCluster =
    isResourceManagedByKueue && isTaskRunQuery && !!pipelineRunName;
  const [
    mcTaskRuns,
    mcLoaded,
    mcError,
    mcPendingAdmission,
    mcProxyUnavailable,
  ] = useMultiClusterTaskRuns<Kind>(
    shouldUseMultiCluster ? namespace : null,
    shouldUseMultiCluster ? pipelineRunName : null,
    isResourceManagedByKueue,
    pipelineRunFinished,
  );

  // do not include the limit when querying etcd because result order is not sorted
  const watchOptions = useMemo(() => {
    if (optionsMemo?.skipFetch) {
      return null;
    }
    prevEtcdLengthRef.current = 0; // we need to reset the previous length when options change to prevent unnecessary refetches - unfortunately this is an antipattern and should be avoided when possible
    return shouldUseMultiCluster
      ? null
      : {
          groupVersionKind,
          namespace: namespace && namespace !== '-' ? namespace : undefined,
          isList,
          selector: optionsMemo?.selector,
          name: optionsMemo?.name,
        };
  }, [groupVersionKind, namespace, optionsMemo, isList, shouldUseMultiCluster]);
  const [resources, loaded, error] = useK8sWatchResource(watchOptions);

  // Use multi-cluster results for hub TaskRuns, otherwise use k8s results
  const etcdRuns = useMemo(() => {
    if (shouldUseMultiCluster) {
      if (!mcLoaded || mcError) return [];
      return mcTaskRuns;
    }

    if (!loaded || error) {
      return [];
    }
    const resourcesArray = (isList ? resources : [resources]) as Kind[];

    return resourcesArray;
  }, [
    shouldUseMultiCluster,
    mcLoaded,
    mcError,
    mcTaskRuns,
    isList,
    resources,
    loaded,
    error,
  ]);

  const effectiveLoaded = shouldUseMultiCluster ? mcLoaded : loaded;
  const effectiveError = shouldUseMultiCluster ? mcError : error;

  // Detect deletions/pruning: if etcd returned fewer runs than before, re-fetch TR
  const [trRefetchKey, setTrRefetchKey] = useState(0);

  useEffect(() => {
    const prevLength = prevEtcdLengthRef.current;
    prevEtcdLengthRef.current = etcdRuns?.length ?? 0;
    if (
      effectiveLoaded &&
      !effectiveError &&
      prevLength > 0 &&
      etcdRuns?.length < prevLength
    ) {
      setTrRefetchKey((k) => k + 1);
    }
  }, [etcdRuns?.length, effectiveLoaded, effectiveError]);

  // Lists: always query TR. Details (limit + name): query TR only when etcd
  // returned fewer items than limit (resource pruned/deleted) or etcd errored.
  const queryTr =
    isTektonResultEnabled &&
    (!limit ||
      (namespace &&
        effectiveLoaded &&
        (limit > (etcdRuns?.length ?? 0) || !!effectiveError)));

  const trOptions: typeof optionsMemo = useMemo(() => {
    if (optionsMemo?.name) {
      const { name, filter, ...rest } = optionsMemo;
      return {
        ...rest,
        filter: AND(EQ('data.metadata.name', name), filter),
      };
    }
    return optionsMemo;
  }, [optionsMemo]);

  // tekton-results includes items in etcd, therefore options must use the same limit
  // these duplicates will later be de-duped
  const trNamespace = isTektonResultEnabled && queryTr ? namespace : null;

  const [trResources, trLoaded, trError] = useTRRuns<Kind>(
    trNamespace,
    groupVersionKind,
    trOptions,
    isTektonResultEnabled,
    optionsMemo?.skipFetch,
    trRefetchKey,
  );

  // dedupe PLR by name since UIDs differ between hub and spoke clusters; for other cases(TR) dedupe by UID
  const rResources: Kind[] = useMemo(() => {
    const merged =
      etcdRuns && trResources
        ? !isTaskRunQuery
          ? uniqBy([...etcdRuns, ...trResources], (r) => r.metadata.name)
          : uniqBy([...etcdRuns, ...trResources], (r) => r.metadata.uid)
        : etcdRuns || trResources;
    return merged?.sort((a, b) =>
      b.metadata.creationTimestamp.localeCompare(a.metadata.creationTimestamp),
    ); // added the sort here, technically this was not necessary but did not want to risk breaking anything
  }, [etcdRuns, trResources, isTaskRunQuery]);

  /* Refactored error */
  let resolvedError: Error | undefined = undefined;

  if (namespace) {
    if (queryTr) {
      if (isList) {
        resolvedError = trError && effectiveError; // if TR is disabled and we use || instead of && then we won't be able to show the data from etcd if we propagate it as an error
      } else {
        // when searching by name, return an error if we have no result
        if (trError && trLoaded && !trResources?.length) {
          resolvedError = effectiveError;
        }
      }
    } else {
      resolvedError = effectiveError;
    }
  } else if (effectiveError) {
    resolvedError = effectiveError;
  }

  const pendingAdmission = shouldUseMultiCluster ? mcPendingAdmission : false;
  const proxyUnavailable = shouldUseMultiCluster ? mcProxyUnavailable : false;

  const isTrLoaded = trLoaded || !!trError;
  return [
    rResources,
    effectiveLoaded,
    isTrLoaded,
    resolvedError,
    pendingAdmission,
    proxyUnavailable,
  ];
};
