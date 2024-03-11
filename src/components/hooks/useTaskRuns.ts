import {
  K8sGroupVersionKind,
  K8sResourceCommon,
  Selector,
  getGroupVersionKindForModel,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { differenceBy, uniqBy } from 'lodash-es';
import * as React from 'react';
import { TektonResourceLabel } from '../../consts';
import { PipelineRunModel, TaskRunModel } from '../../models';
import { TaskRunKind } from '../../types';
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
): [TaskRunKind[], boolean, unknown, GetNextPage] =>
  useRuns<TaskRunKind>(
    getGroupVersionKindForModel(TaskRunModel),
    namespace,
    options,
  );

const useRuns = <Kind extends K8sResourceCommon>(
  groupVersionKind: K8sGroupVersionKind,
  namespace: string,
  options?: {
    selector?: Selector;
    limit?: number;
    name?: string;
  },
): [Kind[], boolean, unknown, GetNextPage] => {
  const etcdRunsRef = React.useRef<Kind[]>([]);
  const optionsMemo = useDeepCompareMemoize(options);
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
    !limit ||
    (namespace &&
      ((runs && loaded && optionsMemo.limit > runs.length) || error));

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
  const [trResources, trLoaded, trError, trGetNextPage] = (
    groupVersionKind === getGroupVersionKindForModel(PipelineRunModel)
      ? useTRPipelineRuns
      : useTRTaskRuns
  )(queryTr ? namespace : null, trOptions) as [
    [],
    boolean,
    unknown,
    GetNextPage,
  ];

  return React.useMemo(() => {
    const rResources =
      runs && trResources
        ? uniqBy([...runs, ...trResources], (r) => r.metadata.uid)
        : runs || trResources;
    return [
      rResources,
      !!rResources?.[0],
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
