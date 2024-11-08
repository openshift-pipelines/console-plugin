import { getAPIVersionForModel } from '@openshift-console/dynamic-plugin-sdk';
import * as _ from 'lodash';
import { TaskModel } from '../../models';
import {
  PipelineBuilderTaskResources,
  PipelineTask,
  TaskKind,
  TektonParam,
  TektonWorkspace,
} from '../../types';
import { t } from '../utils/common-utils';

export const paramToAutoComplete = (param: TektonParam): string =>
  `params.${param.name}`;

export const workspaceToAutoComplete = (workspace: TektonWorkspace): string =>
  `workspaces.${workspace.name}.bound`;

export const taskToStatus = (task: PipelineTask): string =>
  `tasks.${task.name}.status`;

export const findTask = (
  resourceTasks: PipelineBuilderTaskResources,
  task: PipelineTask,
): TaskKind => {
  const getTaskName = (task: PipelineTask): string | null => {
    if (!task?.taskRef) return null;

    const { taskRef } = task;

    if (taskRef.resolver === 'cluster') {
      const nameParam = taskRef.params?.find((param) => param.name === 'name');
      return nameParam ? nameParam.value : null;
    }
    return taskRef.name;
  };
  if (task?.taskRef) {
    if (
      !resourceTasks?.tasksLoaded ||
      !resourceTasks.clusterResolverTasks ||
      !resourceTasks.namespacedTasks
    ) {
      return null;
    }

    const taskName = getTaskName(task);

    const matchingName = (taskResource: TaskKind) =>
      taskResource.metadata.name === taskName;

    return (
      resourceTasks.namespacedTasks.find(matchingName) ||
      resourceTasks.clusterResolverTasks.find(matchingName)
    );
  }

  if (task?.taskSpec) {
    return {
      apiVersion: getAPIVersionForModel(TaskModel),
      kind: 'EmbeddedTask',
      metadata: {
        name: t('Embedded task'),
      },
      spec: task.taskSpec,
    };
  }

  return null;
};

export const taskToResult =
  (resources: PipelineBuilderTaskResources) =>
  (task: PipelineTask): string[] | null => {
    const taskResource = findTask(resources, task);
    if (!taskResource?.spec.results) return null;

    const {
      spec: { results },
    } = taskResource;
    return results.map((result) => `tasks.${task.name}.results.${result.name}`);
  };

export const findTasksThatRunAfter = (
  tasks: PipelineTask[],
  taskName: string,
): string[] => {
  const runAfterTasks = tasks.filter((task) =>
    task.runAfter?.includes(taskName),
  );

  let runAfterNames = runAfterTasks.map((task) => task.name);
  if (runAfterTasks.some((task) => task.runAfter)) {
    runAfterNames = [
      ...runAfterNames,
      ...runAfterTasks
        .map((task) => findTasksThatRunAfter(tasks, task.name))
        .flat(),
    ];
  }

  return _.uniq([taskName, ...runAfterNames]);
};

export const computeAvailableResultACs = (
  tasks: PipelineTask[],
  taskResources: PipelineBuilderTaskResources,
  taskIndex: number,
): string[] => {
  const thisTask: PipelineTask = tasks[taskIndex];
  const invalidTasks: string[] = thisTask
    ? findTasksThatRunAfter(tasks, thisTask.name)
    : [];
  return tasks
    .filter((task: PipelineTask) => !invalidTasks.includes(task.name))
    .map(taskToResult(taskResources))
    .flat()
    .filter((v) => !!v);
};

export type CursorPosition = [number, number];
export const insertIntoValue = (
  value: string,
  position: CursorPosition,
  insertText = '',
) => {
  const [startPos, endPos] = position;
  return `${value.substring(0, startPos)}${insertText}${value.substring(
    endPos,
  )}`;
};
