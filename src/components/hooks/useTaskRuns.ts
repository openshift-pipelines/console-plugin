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

export const useTaskRuns = (
  namespace: string,
  pipelineRunName?: string,
  taskName?: string,
  cacheKey?: string,
): [TaskRunKind[], boolean, unknown, GetNextPage] => {
  const selector: Selector = React.useMemo(() => {
    if (pipelineRunName) {
      return {
        matchLabels: { [TektonResourceLabel.pipelinerun]: pipelineRunName },
      };
    }
    if (taskName) {
      return { matchLabels: { [TektonResourceLabel.pipelineTask]: taskName } };
    }
    return undefined;
  }, [taskName, pipelineRunName]);
  const [taskRuns, loaded, error, getNextPage] = useTaskRuns2(
    namespace,
    selector && {
      selector,
    },
    cacheKey,
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
    () => [sortedTaskRuns, loaded, error, getNextPage],
    [sortedTaskRuns, loaded, error, getNextPage],
  );
};

export const useTaskRuns2 = (
  namespace: string,
  options?: {
    selector?: Selector;
    limit?: number;
  },
  cacheKey?: string,
): [TaskRunKind[], boolean, unknown, GetNextPage] =>
  useRuns<TaskRunKind>(
    getGroupVersionKindForModel(TaskRunModel),
    namespace,
    options,
    cacheKey,
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
): [PipelineRunKind[], boolean, unknown, GetNextPage] =>
  useRuns<PipelineRunKind>(
    getGroupVersionKindForModel(PipelineRunModel),
    namespace,
    options,
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
): [Kind[], boolean, unknown, GetNextPage] => {
  const etcdRunsRef = React.useRef<Kind[]>([]);
  const optionsMemo = useDeepCompareMemoize(options);
  const isTektonResultEnabled = useFlag(FLAG_PIPELINE_TEKTON_RESULT_INSTALLED);
  const isList = !optionsMemo?.name;
  const limit = optionsMemo?.limit;
  // do not include the limit when querying etcd because result order is not sorted
  const watchOptions = React.useMemo(() => {
    // reset cached runs as the options have changed
    etcdRunsRef.current = [];
    return {
      groupVersionKind,
      namespace: namespace && namespace !== '-' ? namespace : undefined,
      isList,
      selector: optionsMemo?.selector,
      name: optionsMemo?.name,
    };
  }, [groupVersionKind, namespace, optionsMemo, isList]);
  const [resources, loaded, error] = useK8sWatchResource(watchOptions);

  // if a pipeline run was removed from etcd, we want to still include it in the return value without re-querying tekton-results
  const etcdRuns = React.useMemo(() => {
    if (!loaded || error) {
      return [];
    }
    const resourcesArray = (isList ? resources : [resources]) as Kind[];

    return resourcesArray;
  }, [isList, resources, loaded, error]);

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
        ((runs && loaded && optionsMemo.limit > runs.length) || error)));

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
      !!rResources?.[0] || (loaded && trLoaded),
      namespace
        ? queryTr
          ? isList
            ? trError && error
            : // when searching by name, return an error if we have no result
              trError && (trLoaded && !trResources.length ? error : undefined)
          : error
        : undefined,
      trGetNextPage,
    ];
  }, [
    runs,
    trResources,
    trLoaded,
    namespace,
    queryTr,
    isList,
    trError,
    error,
    trGetNextPage,
  ]);
};

export const useTaskRun = (
  namespace: string,
  taskRunName: string,
): [TaskRunKind, boolean, string] => {
  const result = useTaskRuns2(
    namespace,
    React.useMemo(
      () => ({
        name: taskRunName,
        limit: 1,
      }),
      [taskRunName],
    ),
  ) as unknown as [TaskRunKind[], boolean, string];

  return React.useMemo(
    () => [result[0]?.[0], result[1], result[0]?.[0] ? undefined : result[2]],
    [result],
  );
};
