import {
  getGroupVersionKindForModel,
  K8sGroupVersionKind,
  K8sResourceKind,
  Selector,
  useFlag,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { differenceBy, uniqBy } from 'lodash-es';
import { useMemo, useRef } from 'react';
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
import { EQ } from '../utils/tekton-results';
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
};

export const useTaskRuns = (
  namespace: string,
  pipelineRunName?: string,
  taskName?: string,
  pipelineRunUid?: string,
  options?: UseTaskRunsOptions,
): [TaskRunKind[], boolean, boolean, Error | undefined, boolean, boolean] => {
  const { pipelineRunFinished, pipelineRunManagedBy, skipFetch } =
    options || {};
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
  ] = useTaskRuns2(
    namespace,
    { selector, skipFetch },
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

export const useTaskRuns2 = (
  namespace: string,
  options?: {
    selector?: Selector;
    limit?: number;
    skipFetch?: boolean;
  },
  pipelineRunFinished?: boolean,
  pipelineRunManagedBy?: string,
): [TaskRunKind[], boolean, boolean, Error | undefined, boolean, boolean] =>
  useRuns<TaskRunKind>(
    TASK_RUN_GVK,
    namespace,
    options,
    pipelineRunFinished,
    pipelineRunManagedBy,
  );

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
  },
): [PipelineRunKind[], boolean, boolean, Error | undefined, boolean, boolean] =>
  useRuns<PipelineRunKind>(PIPELINE_RUN_GVK, namespace, options);

export const usePipelineRun = (
  namespace: string,
  pipelineRunName: string,
): [PipelineRunKind, boolean, boolean, Error | undefined] => {
  const result = usePipelineRuns(
    namespace,
    useMemo(
      () => ({
        name: pipelineRunName,
        limit: 1,
      }),
      [pipelineRunName],
    ),
  ) as unknown as [PipelineRunKind[], boolean, boolean, Error | undefined];

  return [
    result[0]?.[0],
    result[1],
    result[2],
    result[0]?.[0] ? undefined : result[3],
  ];
};

export const useRuns = <Kind extends K8sResourceKind>(
  groupVersionKind: K8sGroupVersionKind,
  namespace: string,
  options?: {
    selector?: Selector;
    limit?: number;
    name?: string;
    skipFetch?: boolean;
  },
  pipelineRunFinished?: boolean,
  pipelineRunManagedBy?: string,
): [Kind[], boolean, boolean, Error | undefined, boolean, boolean] => {
  const etcdRunsRef = useRef<Kind[]>([]);
  const optionsMemo = useDeepCompareMemoize(options);
  const isTektonResultEnabled = useFlag(FLAG_PIPELINE_TEKTON_RESULT_INSTALLED);
  const isList = !optionsMemo?.name;
  const limit = optionsMemo?.limit;

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
    // reset cached runs as the options have changed
    etcdRunsRef.current = [];
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

  const runs = useMemo(() => {
    if (!etcdRuns) {
      return etcdRuns;
    }
    let value = etcdRunsRef.current
      ? [
          ...etcdRuns,
          // identify the runs that were removed
          ...differenceBy(
            etcdRunsRef.current,
            etcdRuns,
            (plr) => plr.metadata.name,
          ),
        ]
      : [...etcdRuns];
    value.sort((a, b) =>
      b.metadata.creationTimestamp.localeCompare(a.metadata.creationTimestamp),
    );
    if (limit && limit < value?.length) {
      value = value.slice(0, limit);
    }
    return value;
  }, [etcdRuns, limit]);

  // cache the last set to identify removed runs
  etcdRunsRef.current = runs;

  // Query tekton results if there's no limit or we received less items from etcd than the current limit
  const queryTr =
    isTektonResultEnabled &&
    (!limit ||
      (namespace &&
        ((runs && effectiveLoaded && optionsMemo.limit > runs?.length) ||
          effectiveError)));

  const trOptions: typeof optionsMemo = useMemo(() => {
    if (optionsMemo?.name) {
      const { name, ...rest } = optionsMemo;
      return {
        ...rest,
        filter: EQ('data.metadata.name', name),
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
  );

  return useMemo(() => {
    // dedupe PLR by name since UIDs differ between hub and spoke clusters; for other cases(TR) dedupe by UID

    const rResources: Kind[] =
      runs && trResources
        ? !isTaskRunQuery
          ? uniqBy([...runs, ...trResources], (r) => r.metadata.name)
          : uniqBy([...runs, ...trResources], (r) => r.metadata.uid)
        : runs || trResources;

    /* Refactoring the nesting as it is causing cognitive damage */
    let resolvedError: Error | undefined = undefined;

    if (namespace) {
      if (queryTr) {
        if (isList) {
          resolvedError = trError && effectiveError;
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
  }, [
    runs,
    trResources,
    loaded,
    trLoaded,
    isTektonResultEnabled,
    namespace,
    queryTr,
    isList,
    trError,
    error,
  ]);
};

export const useTaskRun = (
  namespace: string,
  taskRunName: string,
): [TaskRunKind, boolean, boolean, string] => {
  const result = useTaskRuns2(
    namespace,
    useMemo(
      () => ({
        name: taskRunName,
        limit: 1,
      }),
      [taskRunName],
    ),
  ) as unknown as [TaskRunKind[], boolean, boolean, string];

  return useMemo(
    () => [
      result[0]?.[0],
      result[1],
      result[2],
      result[0]?.[0] ? undefined : result[3],
    ],
    [result],
  );
};
