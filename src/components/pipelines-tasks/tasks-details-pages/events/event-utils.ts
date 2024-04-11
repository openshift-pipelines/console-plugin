import {
  K8sResourceKind,
  WatchK8sResources,
  WatchK8sResults,
  useK8sWatchResources,
} from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import { TektonResourceLabel } from '../../../../consts';
import { PipelineRunModel, PodModel, TaskRunModel } from '../../../../models';
import { PipelineRunKind, TaskRunKind } from '../../../../types';
import { EventInvolvedObject } from '../../../../types/events';
import { getReferenceForModel } from '../../../pipelines-overview/utils';

export type EventFilter = (eventObj: EventInvolvedObject) => boolean;
type ResourcesType = { [key: string]: K8sResourceKind[] };
/**
 * Returns the pod resource for watchK8sResource
 * @param namespace
 * @param labels metadata lables to query
 */
export const getPodsByLabels = (
  namespace: string,
  labels: { [label: string]: string },
) => {
  return {
    kind: PodModel.kind,
    selector: {
      matchLabels: labels,
    },
    namespace,
    isList: true,
    optional: true,
  };
};
/**
 * Get associated taskruns and pods for a given namespace.
 * @param namespace
 */
export const usePipelineRunRelatedResources = (
  namespace: string,
  pipelineRunName: string,
): WatchK8sResults<ResourcesType> => {
  const plrRelatedResources: WatchK8sResources<ResourcesType> =
    React.useMemo(() => {
      return {
        taskruns: {
          kind: getReferenceForModel(TaskRunModel),
          namespace,
          selector: {
            matchLabels: { [TektonResourceLabel.pipelinerun]: pipelineRunName },
          },
          isList: true,
          optional: true,
        },
        pods: getPodsByLabels(namespace, {
          [TektonResourceLabel.pipelinerun]: pipelineRunName,
        }),
      };
    }, [namespace, pipelineRunName]);
  return useK8sWatchResources<ResourcesType>(plrRelatedResources);
};
/**
 * Returns the pods associated with the taskRuns
 * @param namespace
 * @param taskRunName
 */
export const useTaskRunRelatedResources = (
  namespace: string,
  taskRunName: string,
): WatchK8sResults<ResourcesType> => {
  const tsrRelatedResources: WatchK8sResources<ResourcesType> =
    React.useMemo(() => {
      return {
        pods: getPodsByLabels(namespace, {
          [TektonResourceLabel.taskrun]: taskRunName,
        }),
      };
    }, [namespace, taskRunName]);
  return useK8sWatchResources<ResourcesType>(tsrRelatedResources);
};

const isPodMatched =
  (pods): EventFilter =>
  (pod: EventInvolvedObject): boolean =>
    pod.kind === PodModel.kind &&
    pods.data.find((p) => p.metadata.uid === pod.uid);

/**
 * Custom hook to return the list of event filters to find the taskrun related resources.
 * @param namespace
 * @param taskRun
 */
export const useTaskRunFilters = (
  namespace: string,
  taskRun: TaskRunKind,
): EventFilter[] => {
  const { pods } = useTaskRunRelatedResources(
    namespace,
    taskRun?.metadata?.name,
  );

  const isTaskRun: EventFilter = (tRun: EventInvolvedObject): boolean => {
    return (
      tRun?.kind === TaskRunModel.kind && tRun?.uid === taskRun?.metadata?.uid
    );
  };
  return [isTaskRun, isPodMatched(pods)];
};

const isTaskRunMatched =
  (taskruns): EventFilter =>
  (taskRun: EventInvolvedObject): boolean =>
    taskRun.kind === TaskRunModel.kind &&
    taskruns.data.find((t) => t.metadata.uid === taskRun.uid);

/**
 * Custom hook to return the list of event filters to find the pipelinerun related resources.
 * @param namespace
 * @param pipelineRun
 */
export const usePipelineRunFilters = (
  namespace: string,
  pipelineRun: PipelineRunKind,
): EventFilter[] => {
  const { taskruns, pods } = usePipelineRunRelatedResources(
    namespace,
    pipelineRun.metadata.name,
  );
  const isPipelineRunMatched: EventFilter = (
    plr: EventInvolvedObject,
  ): boolean => {
    return (
      plr.kind === PipelineRunModel.kind && plr.uid === pipelineRun.metadata.uid
    );
  };
  return [isPipelineRunMatched, isTaskRunMatched(taskruns), isPodMatched(pods)];
};
