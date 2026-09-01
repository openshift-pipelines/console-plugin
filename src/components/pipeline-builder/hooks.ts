import {
  getGroupVersionKindForModel,
  useAccessReview,
  useK8sWatchResource,
  useK8sWatchResources,
} from '@openshift-console/dynamic-plugin-sdk';
import { FormikErrors, FormikTouched, useFormikContext } from 'formik';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { PIPELINE_NAMESPACE } from '../../consts';
import { PipelineModel, ProjectModel, TaskModel } from '../../models';
import {
  K8sResourceKind,
  PipelineKind,
  PipelineTask,
  TaskKind,
} from '../../types';
import { AddNodeDirection } from '../pipeline-topology/const';
import {
  PipelineBuilderTaskNodeModel,
  PipelineMixedNodeModel,
  PipelineTaskListNodeModel,
  PipelineTaskLoadingNodeModel,
} from '../pipeline-topology/types';
import {
  createBuilderFinallyNode,
  createInvalidTaskListNode,
  createLoadingNode,
  createTaskListNode,
  getFinallyTaskHeight,
  getFinallyTaskWidth,
  getLastRegularTasks,
  handleParallelToParallelNodes,
  tasksToBuilderNodes,
} from '../pipeline-topology/utils';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { getRandomChars } from '../utils/utils';
import { UpdateOperationType } from './const';
import {
  BuilderTasksErrorGroup,
  PipelineBuilderFormikValues,
  PipelineBuilderTaskGroup,
  PipelineBuilderTaskResources,
  SelectTaskCallback,
  TaskErrors,
  TaskSearchCallback,
  UpdateOperationAddData,
  UpdateOperationConvertToFinallyTaskData,
  UpdateOperationConvertToLoadingTaskData,
  UpdateOperationConvertToTaskData,
  UpdateOperationFixInvalidTaskListData,
  UpdateTasksCallback,
} from './types';
import { findTask, getTopLevelErrorMessage } from './utils';

export const useFormikFetchAndSaveTasks = (
  namespace: string,
  validateForm: () => Promise<FormikErrors<PipelineBuilderFormikValues>>,
) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { setFieldValue, setStatus, values } =
    useFormikContext<PipelineBuilderFormikValues>();

  const [canListClusterPipelines, canListClusterPipelinesLoading] =
    useAccessReview({
      group: PipelineModel.apiGroup,
      resource: PipelineModel.plural,
      verb: 'list',
      namespace: PIPELINE_NAMESPACE,
    });

  const [canListNamespacedPipelines, canListNamespacedPipelinesLoading] =
    useAccessReview({
      group: PipelineModel.apiGroup,
      resource: PipelineModel.plural,
      verb: 'list',
      namespace,
    });

  const { namespacedTasks, clusterResolverTasks } = useK8sWatchResources<{
    namespacedTasks: TaskKind[];
    clusterResolverTasks: TaskKind[];
  }>({
    namespacedTasks: {
      kind: getReferenceForModel(TaskModel),
      isList: true,
      namespace,
    },
    clusterResolverTasks: {
      kind: getReferenceForModel(TaskModel),
      isList: true,
      namespace: PIPELINE_NAMESPACE,
      optional: true,
    },
  });

  const [
    namespacedPipelinesRaw,
    namespacedPipelinesLoaded,
    namespacedPipelinesLoadError,
  ] = useK8sWatchResource<PipelineKind[]>(
    canListNamespacedPipelinesLoading || !canListNamespacedPipelines
      ? null
      : {
          kind: getReferenceForModel(PipelineModel),
          isList: true,
          namespace,
        },
  );

  const [
    clusterResolverPipelinesRaw,
    clusterResolverPipelinesLoaded,
    clusterResolverPipelinesLoadError,
  ] = useK8sWatchResource<PipelineKind[]>(
    canListClusterPipelinesLoading || !canListClusterPipelines
      ? null
      : {
          kind: getReferenceForModel(PipelineModel),
          isList: true,
          namespace: PIPELINE_NAMESPACE,
        },
  );

  const namespacedTaskData = useMemo(() => {
    return namespacedTasks.loaded ? namespacedTasks.data : null;
  }, [namespacedTasks.loaded, namespacedTasks.data]);

  const clusterResolverTaskData = useMemo(() => {
    return clusterResolverTasks.loaded ? clusterResolverTasks.data : null;
  }, [clusterResolverTasks.loaded, clusterResolverTasks.data]);

  const namespacedPipelineData = useMemo(() => {
    if (canListNamespacedPipelinesLoading) {
      return null;
    }

    if (!canListNamespacedPipelines) {
      return [];
    }

    return namespacedPipelinesLoaded ? namespacedPipelinesRaw : null;
  }, [
    canListNamespacedPipelinesLoading,
    canListNamespacedPipelines,
    namespacedPipelinesLoaded,
    namespacedPipelinesRaw,
  ]);

  const clusterResolverPipelineData = useMemo(() => {
    if (canListClusterPipelinesLoading) {
      return null;
    }

    if (!canListClusterPipelines) {
      return [];
    }

    return clusterResolverPipelinesLoaded ? clusterResolverPipelinesRaw : null;
  }, [
    canListClusterPipelinesLoading,
    canListClusterPipelines,
    clusterResolverPipelinesLoaded,
    clusterResolverPipelinesRaw,
  ]);

  useEffect(() => {
    if (namespacedTaskData) {
      setFieldValue('taskResources.namespacedTasks', namespacedTaskData, false);
    }
    if (clusterResolverTaskData) {
      const existingExternal = (
        values.taskResources?.clusterResolverTasks ?? []
      ).filter(
        (task: TaskKind) => task.metadata.namespace !== PIPELINE_NAMESPACE,
      );
      setFieldValue(
        'taskResources.clusterResolverTasks',
        [...clusterResolverTaskData, ...existingExternal],
        false,
      );
    }
    if (namespacedPipelineData !== null) {
      setFieldValue(
        'taskResources.namespacedPipelines',
        namespacedPipelineData,
        false,
      );
    }
    if (clusterResolverPipelineData !== null) {
      const existingExternal = (
        values.taskResources?.clusterResolverPipelines ?? []
      ).filter(
        (pipeline: PipelineKind) =>
          pipeline.metadata.namespace !== PIPELINE_NAMESPACE,
      );
      setFieldValue(
        'taskResources.clusterResolverPipelines',
        [...clusterResolverPipelineData, ...existingExternal],
        false,
      );
    }

    const tasksLoaded =
      !!namespacedTaskData &&
      !!clusterResolverTaskData &&
      namespacedPipelineData !== null &&
      clusterResolverPipelineData !== null;
    setFieldValue('taskResources.tasksLoaded', tasksLoaded, false);
    if (tasksLoaded) {
      setTimeout(() => {
        validateForm().catch(() => {});
      }, 0);
    }
  }, [
    setFieldValue,
    namespacedTaskData,
    clusterResolverTaskData,
    namespacedPipelineData,
    clusterResolverPipelineData,
    validateForm,
  ]);

  const error =
    namespacedTasks.loadError ||
    clusterResolverTasks.loadError ||
    (canListNamespacedPipelines ? namespacedPipelinesLoadError : undefined) ||
    (canListClusterPipelines ? clusterResolverPipelinesLoadError : undefined);
  useEffect(() => {
    if (!error) return;

    setStatus({
      taskLoadingError: t('Failed to load Tasks. {{error}}', {
        error,
      }),
    });
  }, [t, setStatus, error]);
};

const useConnectFinally = (
  namespace,
  nodes,
  taskGroup: PipelineBuilderTaskGroup,
  onTaskSelection: SelectTaskCallback,
  onUpdateTasks: UpdateTasksCallback,
  onTaskSearch: TaskSearchCallback,
  taskResources: PipelineBuilderTaskResources,
  tasksInError: TaskErrors,
): PipelineMixedNodeModel => {
  const {
    clusterResolverTasks,
    namespacedTasks,
    clusterResolverPipelines,
    namespacedPipelines,
  } = taskResources;
  const taskGroupRef = useRef(taskGroup);
  taskGroupRef.current = taskGroup;
  const addNewFinallyListNode = () => {
    const data: UpdateOperationConvertToFinallyTaskData = {
      listTaskName: `finally-list-${getRandomChars(6)}`,
    };
    onUpdateTasks(taskGroupRef.current, {
      type: UpdateOperationType.ADD_FINALLY_LIST_TASK,
      data,
    });
  };

  const onNewInstallingTask = (
    resource: TaskKind,
    name: string,
    isFinallyTask: boolean,
    runAfter?: string[],
  ) => {
    const data: UpdateOperationConvertToLoadingTaskData = {
      resource,
      name,
      runAfter,
      isFinallyTask,
    };
    onUpdateTasks(taskGroupRef.current, {
      type: UpdateOperationType.ADD_LOADING_TASK,
      data,
    });
  };

  const convertListToFinallyTask = (resource: TaskKind, name: string) => {
    const data: UpdateOperationConvertToTaskData = { resource, name };
    onUpdateTasks(taskGroupRef.current, {
      type: UpdateOperationType.CONVERT_LIST_TO_FINALLY_TASK,
      data,
    });
  };
  const convertInvalidListToFinallyTask = (
    resource: TaskKind,
    name: string,
  ) => {
    const data: UpdateOperationFixInvalidTaskListData = {
      existingName: name,
      resource,
      runAfter: [],
    };

    onUpdateTasks(taskGroupRef.current, {
      type: UpdateOperationType.FIX_INVALID_FINALLY_LIST_TASK,
      data,
    });
  };

  const finallyLoadingTasks = taskGroup.loadingTasks.filter(
    (lt) => lt.isFinallyTask,
  );
  const finallyValidTasks = taskGroup.finallyTasks.filter(
    (task) => !!findTask(taskResources, task),
  );
  const finallyInvalidTasks = taskGroup.finallyTasks.filter(
    (task) => !findTask(taskResources, task),
  );

  const allTasksLength =
    taskGroup.finallyTasks.length +
    taskGroup.finallyListTasks.length +
    finallyLoadingTasks.length;
  const finallyNodeName = `finally-node-${taskGroup.finallyTasks.length}-${taskGroup.finallyListTasks.length}`;
  const regularRunAfters = getLastRegularTasks(nodes);

  const getInvalidFinallyListTaskData = (task) => ({
    ...task,
    convertList: (resource: TaskKind) =>
      resource.kind
        ? convertInvalidListToFinallyTask(resource, task.name)
        : onNewInstallingTask(resource, task.name, true, regularRunAfters),
    onRemoveTask: () => {
      onUpdateTasks(taskGroupRef.current, {
        type: UpdateOperationType.REMOVE_TASK,
        data: { taskName: task.name },
      });
    },
  });

  const getFinallyListTaskData = (task) => ({
    ...task,
    convertList: (resource: TaskKind) =>
      resource.kind
        ? convertListToFinallyTask(resource, task.name)
        : onNewInstallingTask(resource, task.name, true, regularRunAfters),
    onRemoveTask: () => {
      onUpdateTasks(taskGroupRef.current, {
        type: UpdateOperationType.DELETE_LIST_TASK,
        data: { listTaskName: task.name },
      });
    },
  });

  return createBuilderFinallyNode(
    getFinallyTaskHeight(allTasksLength, false),
    getFinallyTaskWidth(allTasksLength),
  )(finallyNodeName, {
    isFinallyTask: true,
    namespace,
    namespaceTaskList: namespacedTasks,
    clusterResolverTaskList: clusterResolverTasks,
    clusterResolverPipelineList: clusterResolverPipelines,
    namespacedPipelineList: namespacedPipelines,
    task: {
      isFinallyTask: true,
      name: finallyNodeName,
      runAfter: regularRunAfters,
      addNewFinallyListNode,
      onTaskSearch,
      finallyTasks: finallyValidTasks.map((ft, idx) => ({
        ...ft,
        onTaskSelection: () =>
          onTaskSelection(ft, findTask(taskResources, ft), true),
        error: getTopLevelErrorMessage(tasksInError)(idx),
        selected: taskGroup.highlightedIds.includes(ft.name),
        disableTooltip: true,
      })),
      finallyLoadingTasks,
      finallyInvalidListTasks: finallyInvalidTasks.map((ivlt) =>
        getInvalidFinallyListTaskData(ivlt),
      ),
      finallyListTasks: taskGroup.finallyListTasks.map((flt) =>
        getFinallyListTaskData(flt),
      ),
    },
  });
};

export const useNodes = (
  onTaskSelection: SelectTaskCallback,
  onUpdateTasks: UpdateTasksCallback,
  onTaskSearch: TaskSearchCallback,
  taskGroup: PipelineBuilderTaskGroup,
  taskResources: PipelineBuilderTaskResources,
  tasksInError: BuilderTasksErrorGroup,
): PipelineMixedNodeModel[] => {
  const {
    clusterResolverTasks,
    namespacedTasks,
    clusterResolverPipelines,
    namespacedPipelines,
  } = taskResources;

  const taskGroupRef = useRef(taskGroup);
  taskGroupRef.current = taskGroup;

  const onNewListNode = (task: PipelineTask, direction: AddNodeDirection) => {
    const data: UpdateOperationAddData = { direction, relatedTask: task };
    onUpdateTasks(taskGroupRef.current, {
      type: UpdateOperationType.ADD_LIST_TASK,
      data,
    });
  };
  const onNewTask = (resource: TaskKind, name: string, runAfter?: string[]) => {
    const data: UpdateOperationConvertToTaskData = { resource, name, runAfter };
    onUpdateTasks(taskGroupRef.current, {
      type: UpdateOperationType.CONVERT_LIST_TO_TASK,
      data,
    });
  };

  const onNewInstallingTask = (
    resource: TaskKind,
    name: string,
    runAfter?: string[],
  ) => {
    const data: UpdateOperationConvertToLoadingTaskData = {
      resource,
      name,
      runAfter,
      isFinallyTask: false,
    };
    onUpdateTasks(taskGroupRef.current, {
      type: UpdateOperationType.ADD_LOADING_TASK,
      data,
    });
  };

  const newListNode = (
    name: string,
    runAfter?: string[],
    firstTask?: boolean,
  ): PipelineTaskListNodeModel =>
    createTaskListNode(name, {
      namespaceTaskList: namespacedTasks,
      clusterResolverTaskList: clusterResolverTasks,
      clusterResolverPipelineList: clusterResolverPipelines,
      namespacedPipelineList: namespacedPipelines,
      onNewTask: (resource: TaskKind) => {
        resource.kind
          ? onNewTask(resource, name, runAfter)
          : onNewInstallingTask(resource, name, runAfter);
      },
      onTaskSearch,
      onRemoveTask: firstTask
        ? null
        : () => {
            onUpdateTasks(taskGroupRef.current, {
              type: UpdateOperationType.DELETE_LIST_TASK,
              data: { listTaskName: name },
            });
          },
      task: {
        name,
        runAfter: runAfter || [],
      },
    });
  const soloTask = (name = 'initial-node') =>
    newListNode(name, undefined, true);
  const newInvalidListNode = (
    name: string,
    runAfter?: string[],
  ): PipelineTaskListNodeModel =>
    createInvalidTaskListNode(name, {
      namespaceTaskList: namespacedTasks,
      clusterResolverTaskList: clusterResolverTasks,
      clusterResolverPipelineList: clusterResolverPipelines,
      namespacedPipelineList: namespacedPipelines,
      onNewTask: (resource: TaskKind) => {
        const data: UpdateOperationFixInvalidTaskListData = {
          existingName: name,
          resource,
          runAfter,
        };
        resource.kind
          ? onUpdateTasks(taskGroupRef.current, {
              type: UpdateOperationType.FIX_INVALID_LIST_TASK,
              data,
            })
          : onNewInstallingTask(resource, name, runAfter);
      },
      onTaskSearch,
      onRemoveTask: () => {
        onUpdateTasks(taskGroupRef.current, {
          type: UpdateOperationType.REMOVE_TASK,
          data: { taskName: name },
        });
      },
      task: {
        name,
        runAfter: runAfter || [],
      },
    });
  const newLoadingNode = (
    name: string,
    runAfter?: string[],
  ): PipelineTaskLoadingNodeModel =>
    createLoadingNode(name, {
      isFinallyTask: false,
      task: {
        name,
        runAfter: runAfter || [],
      },
    });

  const invalidTaskList = taskGroup.tasks.filter(
    (task) => !findTask(taskResources, task),
  );
  const validTaskList = taskGroup.tasks.filter(
    (task) => !!findTask(taskResources, task),
  );

  const invalidTaskListNodes: PipelineTaskListNodeModel[] = invalidTaskList.map(
    (task) => newInvalidListNode(task.name, task.runAfter),
  );
  const loadingTasks = taskGroup.loadingTasks.filter((lt) => !lt.isFinallyTask);
  const loadingNodes: PipelineTaskListNodeModel[] = loadingTasks.map((task) =>
    newLoadingNode(task.name, task.runAfter),
  );
  const taskNodes: PipelineBuilderTaskNodeModel[] =
    validTaskList.length > 0
      ? tasksToBuilderNodes(
          validTaskList,
          onNewListNode,
          (task) => onTaskSelection(task, findTask(taskResources, task), false),
          getTopLevelErrorMessage(tasksInError.tasks),
          taskGroup.highlightedIds,
        )
      : [];
  const taskListNodes: PipelineTaskListNodeModel[] =
    taskGroup.tasks.length === 0 &&
    taskGroup.listTasks.length <= 1 &&
    loadingTasks.length === 0
      ? [soloTask(taskGroup.listTasks[0]?.name)]
      : taskGroup.listTasks.map((listTask) =>
          newListNode(listTask.name, listTask.runAfter),
        );

  const nodes: PipelineMixedNodeModel[] = handleParallelToParallelNodes([
    ...taskNodes,
    ...taskListNodes,
    ...invalidTaskListNodes,
    ...loadingNodes,
  ]);

  const finallyNode = useConnectFinally(
    'namespace', // why is this needed?
    nodes,
    taskGroup,
    onTaskSelection,
    onUpdateTasks,
    onTaskSearch,
    taskResources,
    tasksInError.finally,
  );

  return [...nodes, finallyNode];
};

const touchTaskWorkspaces = (
  task: PipelineTask,
): FormikTouched<PipelineTask> => ({
  workspaces: task.workspaces?.map(() => ({ workspace: true })),
});

const touchTaskResources = (
  task: PipelineTask,
): FormikTouched<PipelineTask> => ({
  resources: {
    inputs: task.resources?.inputs?.map(() => ({ resource: true })),
    outputs: task.resources?.outputs?.map(() => ({ resource: true })),
  },
});

export const useExplicitPipelineTaskTouch = () => {
  const { setTouched, touched, values } =
    useFormikContext<PipelineBuilderFormikValues>();
  const workspacesTouched = !!touched.formData?.workspaces;
  const resourcesTouched = !!touched.formData?.resources;

  useEffect(() => {
    if (workspacesTouched) {
      setTouched({
        formData: {
          tasks: values.formData?.tasks?.map(touchTaskWorkspaces),
          finallyTasks: values.formData?.finallyTasks?.map(touchTaskWorkspaces),
        },
      });
    }
    if (resourcesTouched) {
      setTouched({
        formData: {
          tasks: values.formData?.tasks?.map(touchTaskResources),
          finallyTasks: values.formData?.finallyTasks?.map(touchTaskResources),
        },
      });
    }
  }, [workspacesTouched, resourcesTouched]);
};

export const useLoadingTaskCleanup = (
  onUpdateTasks: UpdateTasksCallback,
  taskGroup: PipelineBuilderTaskGroup,
) => {
  const { values } = useFormikContext<PipelineBuilderFormikValues>();

  useEffect(() => {
    const { loadingTasks } = values.formData;
    loadingTasks.forEach((task) => {
      const installedTask = values.taskResources.namespacedTasks.find(
        (nt) => nt.metadata.name === task?.taskRef.name,
      );
      if (installedTask) {
        const data: UpdateOperationConvertToTaskData = {
          resource: installedTask,
          name: task.name,
          runAfter: task.runAfter,
        };
        const updateOperationType = task.isFinallyTask
          ? UpdateOperationType.CONVERT_LOADING_TASK_TO_FINALLY_TASK
          : UpdateOperationType.CONVERT_LOADING_TASK_TO_TASK;
        onUpdateTasks(taskGroup, {
          type: updateOperationType,
          data,
        });
      }
    });
  }, [values, onUpdateTasks, taskGroup]);
};

export const useCleanupOnFailure = (
  failedTasks: string[],
  onUpdateTasks: UpdateTasksCallback,
  taskGroup: PipelineBuilderTaskGroup,
) => {
  const { values } = useFormikContext<PipelineBuilderFormikValues>();
  useEffect(() => {
    const { loadingTasks } = values.formData;
    loadingTasks.forEach((task) => {
      if (failedTasks.includes(task?.taskRef.name)) {
        const data: UpdateOperationConvertToTaskData = {
          resource: task.resource,
          name: task.name,
          runAfter: task.runAfter,
        };
        const updateOperationType = task.isFinallyTask
          ? UpdateOperationType.CONVERT_LOADING_TASK_TO_FINALLY_TASK
          : UpdateOperationType.CONVERT_LOADING_TASK_TO_TASK;
        onUpdateTasks(taskGroup, {
          type: updateOperationType,
          data,
        });
      }
    });
  }, [values, onUpdateTasks, taskGroup, failedTasks]);
};

export const useAccessibleNamespaces = (): {
  namespaces: string[];
  loaded: boolean;
  loadError: unknown;
} => {
  const { projects } = useK8sWatchResources<{
    projects: K8sResourceKind[];
  }>({
    projects: {
      isList: true,
      groupVersionKind: getGroupVersionKindForModel(ProjectModel),
      optional: true,
    },
  });

  const { data, loaded, loadError } = projects;

  const namespaces = useMemo(
    () =>
      loaded
        ? data
            .map((p) => p.metadata.name)
            .filter((name): name is string => !!name)
            .sort((a, b) => a.localeCompare(b))
        : [],
    [data, loaded],
  );

  return { namespaces, loaded, loadError };
};

export const useNamespaceClusterResources = (
  namespace: string | null,
): {
  tasks: TaskKind[];
  pipelines: PipelineKind[];
  loaded: boolean;
  loadError: unknown;
} => {
  const [tasks, tasksLoaded, tasksLoadError] = useK8sWatchResource<TaskKind[]>(
    namespace
      ? {
          isList: true,
          groupVersionKind: getGroupVersionKindForModel(TaskModel),
          namespace,
        }
      : null,
  );

  const [pipelines, pipelinesLoaded, pipelinesLoadError] = useK8sWatchResource<
    PipelineKind[]
  >(
    namespace
      ? {
          isList: true,
          groupVersionKind: getGroupVersionKindForModel(PipelineModel),
          namespace,
        }
      : null,
  );

  if (!namespace) {
    return { tasks: [], pipelines: [], loaded: false, loadError: null };
  }

  return {
    tasks: tasks ?? [],
    pipelines: pipelines ?? [],
    loaded: tasksLoaded && pipelinesLoaded,
    loadError: tasksLoadError || pipelinesLoadError,
  };
};
