import {
  K8sGroupVersionKind,
  K8sResourceCommon,
  Selector,
  getGroupVersionKindForModel,
  useFlag,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { differenceBy, uniqBy } from 'lodash-es';
import * as React from 'react';
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
import { useIsHubCluster } from './useIsHubCluster';
import { useMultiClusterTaskRuns } from './useMultiClusterTaskRuns';
import {
  GetNextPage,
  useTRPipelineRuns,
  useTRTaskRuns,
} from './useTektonResults';

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
        groupVersionKind: getGroupVersionKindForModel(TaskRunModel),
        namespace,
        selector: {
          matchLabels: {
            [TektonResourceLabel.pipelinerun]: pipelineRunName,
          },
        },
        isList: true,
      }
    : {
        groupVersionKind: getGroupVersionKindForModel(TaskRunModel),
        namespace,
        isList: true,
      };
  return useK8sWatchResource<TaskRunKind[]>(taskRunResource);
};

export type UseTaskRunsOptions = {
  taskName?: string;
  cacheKey?: string;
  pipelineRunUid?: string;
  pipelineRunFinished?: boolean;
};

export const useTaskRuns = (
  namespace: string,
  pipelineRunName?: string,
  options?: UseTaskRunsOptions,
): [TaskRunKind[], boolean, unknown, GetNextPage, boolean, boolean] => {
  const { taskName, cacheKey, pipelineRunUid, pipelineRunFinished } =
    options || {};
  const selector: Selector = React.useMemo(() => {
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
    loaded,
    error,
    getNextPage,
    pendingAdmission,
    proxyUnavailable,
  ] = useTaskRuns2(
    namespace,
    selector && {
      selector,
    },
    cacheKey,
    pipelineRunFinished,
  );

  const sortedTaskRuns = React.useMemo(
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
  return React.useMemo(
    () => [
      sortedTaskRuns,
      loaded,
      error,
      getNextPage,
      pendingAdmission,
      proxyUnavailable,
    ],
    [
      sortedTaskRuns,
      loaded,
      error,
      getNextPage,
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
  },
  cacheKey?: string,
  pipelineRunFinished?: boolean,
): [TaskRunKind[], boolean, unknown, GetNextPage, boolean, boolean] =>
  useRuns<TaskRunKind>(
    getGroupVersionKindForModel(TaskRunModel),
    namespace,
    options,
    cacheKey,
    pipelineRunFinished,
  );

export const useApprovalTasks = (
  namespace: string,
  pipelineRunName?: string,
): [ApprovalTaskKind[], boolean, any] => {
  const selector: Selector = React.useMemo(() => {
    if (pipelineRunName) {
      return {
        matchLabels: {
          [ApprovalLabels[ApprovalFields.PIPELINE_RUN]]: pipelineRunName,
        },
      };
    }
    return undefined;
  }, [pipelineRunName]);
  const watchedResource = React.useMemo(
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
  cacheKey?: string,
): [PipelineRunKind[], boolean, unknown, GetNextPage, boolean, boolean] =>
  useRuns<PipelineRunKind>(
    getGroupVersionKindForModel(PipelineRunModel),
    namespace,
    options,
    cacheKey,
  );

export const usePipelineRun = (
  namespace: string,
  pipelineRunName: string,
): [PipelineRunKind, boolean, string] => {
  const result = usePipelineRuns(
    namespace,
    React.useMemo(
      () => ({
        name: pipelineRunName,
        limit: 1,
      }),
      [pipelineRunName],
    ),
  ) as unknown as [PipelineRunKind[], boolean, string];

  return React.useMemo(
    () => [result[0]?.[0], result[1], result[0]?.[0] ? undefined : result[2]],
    [result],
  );
};

export const useRuns = <Kind extends K8sResourceCommon>(
  groupVersionKind: K8sGroupVersionKind,
  namespace: string,
  options?: {
    selector?: Selector;
    limit?: number;
    name?: string;
  },
  cacheKey?: string,
  pipelineRunFinished?: boolean,
): [Kind[], boolean, unknown, GetNextPage, boolean, boolean] => {
  const etcdRunsRef = React.useRef<Kind[]>([]);
  const optionsMemo = useDeepCompareMemoize(options);
  const isTektonResultEnabled = useFlag(FLAG_PIPELINE_TEKTON_RESULT_INSTALLED);
  const isList = !optionsMemo?.name;
  const limit = optionsMemo?.limit;

  // Hub cluster detection
  const [isHub] = useIsHubCluster();
  const isTaskRunQuery =
    groupVersionKind?.kind === getGroupVersionKindForModel(TaskRunModel)?.kind;

  // Extract pipelineRunName from selector for multi-cluster API
  const pipelineRunName =
    optionsMemo?.selector?.matchLabels?.[TektonResourceLabel.pipelinerun];

  // Use multi-cluster hook for hub clusters fetching TaskRuns
  const shouldUseMultiCluster = isTaskRunQuery && !!pipelineRunName;
  const [
    mcTaskRuns,
    mcLoaded,
    mcError,
    mcPendingAdmission,
    mcProxyUnavailable,
  ] = useMultiClusterTaskRuns<Kind>(
    shouldUseMultiCluster ? namespace : null,
    shouldUseMultiCluster ? pipelineRunName : null,
    isHub,
    pipelineRunFinished,
  );

  // Skip k8s watch for TaskRuns on hub clusters (they don't exist locally)
  const shouldSkipK8s = isHub && isTaskRunQuery && !!pipelineRunName;

  // do not include the limit when querying etcd because result order is not sorted
  const watchOptions = React.useMemo(() => {
    // reset cached runs as the options have changed
    etcdRunsRef.current = [];
    return shouldSkipK8s
      ? null
      : {
          groupVersionKind,
          namespace: namespace && namespace !== '-' ? namespace : undefined,
          isList,
          selector: optionsMemo?.selector,
          name: optionsMemo?.name,
        };
  }, [groupVersionKind, namespace, optionsMemo, isList, shouldSkipK8s]);
  const [resources, loaded, error] = useK8sWatchResource(watchOptions);

  // Use multi-cluster results for hub TaskRuns, otherwise use k8s results
  const etcdRuns = React.useMemo(() => {
    if (shouldSkipK8s) {
      if (!mcLoaded) return [];
      // If fetching a specific TaskRun by name, filter from multi-cluster results
      if (optionsMemo?.name) {
        return mcTaskRuns.filter(
          (tr) => tr.metadata?.name === optionsMemo.name,
        );
      }
      return mcTaskRuns;
    }
    if (!loaded || error) {
      return [];
    }
    const resourcesArray = (isList ? resources : [resources]) as Kind[];

    return resourcesArray;
  }, [
    shouldSkipK8s,
    mcLoaded,
    mcTaskRuns,
    optionsMemo?.name,
    isList,
    resources,
    loaded,
    error,
  ]);

  const effectiveLoaded = shouldSkipK8s ? mcLoaded : loaded;
  const effectiveError = shouldSkipK8s ? mcError : error;

  const runs = React.useMemo(() => {
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
    if (limit && limit < value.length) {
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
        ((runs && effectiveLoaded && optionsMemo.limit > runs.length) ||
          effectiveError)));

  const trOptions: typeof optionsMemo = React.useMemo(() => {
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

  const [trResources, trLoaded, trError, trGetNextPage] = isTektonResultEnabled
    ? ((groupVersionKind?.kind ===
        getGroupVersionKindForModel(PipelineRunModel)?.kind
        ? useTRPipelineRuns
        : useTRTaskRuns)(queryTr ? namespace : null, trOptions, cacheKey) as [
        [],
        boolean,
        unknown,
        GetNextPage,
      ])
    : [[], true, undefined, undefined];

  return React.useMemo(() => {
    const rResources =
      runs && trResources
        ? uniqBy([...runs, ...trResources], (r) => r.metadata.uid)
        : runs || trResources;
    return [
      rResources,
      !!(rResources?.[0] || (effectiveLoaded && (trLoaded || trError))),
      namespace
        ? queryTr
          ? isList
            ? trError && effectiveError
            : // when searching by name, return an error if we have no result
              trError &&
              (trLoaded && !trResources.length ? effectiveError : undefined)
          : effectiveError
        : effectiveError
        ? effectiveError
        : undefined,
      trGetNextPage,
      // 5th element: pendingAdmission (true when 409 error from multi-cluster API)
      shouldSkipK8s ? mcPendingAdmission : false,
      // 6th element: proxyUnavailable (true when multi-cluster proxy is not available)
      shouldSkipK8s ? mcProxyUnavailable : false,
    ];
  }, [
    runs,
    trResources,
    trLoaded,
    namespace,
    queryTr,
    isList,
    trError,
    effectiveError,
    effectiveLoaded,
    trGetNextPage,
    shouldSkipK8s,
    mcPendingAdmission,
    mcProxyUnavailable,
  ]);
};

export const useTaskRun = (
  namespace: string,
  taskRunName: string,
  pipelineRunName?: string,
): [TaskRunKind, boolean, string] => {
  const result = useTaskRuns2(
    namespace,
    React.useMemo(
      () => ({
        name: taskRunName,
        limit: 1,
        // Include pipelineRunName in selector for multi-cluster API fetch
        ...(pipelineRunName && {
          selector: {
            matchLabels: {
              [TektonResourceLabel.pipelinerun]: pipelineRunName,
            },
          },
        }),
      }),
      [taskRunName, pipelineRunName],
    ),
  ) as unknown as [TaskRunKind[], boolean, string];

  return React.useMemo(
    () => [result[0]?.[0], result[1], result[0]?.[0] ? undefined : result[2]],
    [result],
  );
};
