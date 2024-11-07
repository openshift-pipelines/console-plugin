import {
  FirehoseResult,
  getAPIVersionForModel,
  K8sKind,
  K8sResourceKind,
} from '@openshift-console/dynamic-plugin-sdk';
import { FormikErrors } from 'formik';
import * as _ from 'lodash';
import { ClusterTaskModel, PipelineModel, TaskModel } from '../../models';
import {
  PipelineKind,
  PipelineTask,
  PipelineTaskParam,
  TaskKind,
  TektonParam,
  TektonResource,
  TektonResourceGroup,
} from '../../types';
import { sanitizePipelineParams } from '../pipelines-details/utils';
import { t } from '../utils/common-utils';
import { getRandomChars } from '../utils/utils';
import {
  getTaskErrorString,
  STATUS_KEY_NAME_ERROR,
  TASK_FIELD_ERROR_TYPE_MAPPING,
  TaskErrorType,
} from './const';
import {
  BuilderTasksErrorGroup,
  GetErrorMessage,
  PipelineBuilderFormikStatus,
  PipelineBuilderFormValues,
  PipelineBuilderFormYamlValues,
  PipelineBuilderLoadingTask,
  PipelineBuilderTaskBase,
  PipelineBuilderTaskResources,
  Sample,
  TaskErrors,
  TaskType,
} from './types';

enum PATHS {
  alphaInputResources = 'spec.inputs.resources',
  alphaOutputResources = 'spec.outputs.resources',
  alphaParameters = 'spec.inputs.params',

  betaInputResources = 'spec.resources.inputs',
  betaOutputResources = 'spec.resources.outputs',
  betaParameters = 'spec.params',
}

const isTaskArrayErrors = (
  errors: string | string[] | TaskErrors,
): errors is TaskErrors => {
  return (
    Array.isArray(errors) && errors.some((value) => typeof value === 'object')
  );
};

export const getBuilderTasksErrorGroup = (
  formikFormErrors?: FormikErrors<PipelineBuilderFormValues>,
  status?: PipelineBuilderFormikStatus,
): BuilderTasksErrorGroup => {
  const paths = Object.keys(status?.[STATUS_KEY_NAME_ERROR] || {});
  const nameErrorString = getTaskErrorString(TaskErrorType.NAME_ERROR);
  const { formData } = paths.reduce((data, path) => {
    _.set(data, path, nameErrorString);
    return data;
  }, {} as FormikErrors<PipelineBuilderFormYamlValues>);

  const getErrorsForType = (type: TaskType): TaskErrors => {
    const formErrors = isTaskArrayErrors(formikFormErrors?.[type])
      ? formikFormErrors[type]
      : [];
    const displayNameErrors = formData?.[type];
    return _.merge([], formErrors, displayNameErrors);
  };

  return {
    tasks: getErrorsForType('tasks'),
    finally: getErrorsForType('finallyTasks'),
  };
};

export const getTopLevelErrorMessage: GetErrorMessage =
  (errors) => (taskIndex) => {
    const errorObj = errors[taskIndex] || {};
    const taskErrors = Object.values(errorObj);

    if (taskErrors.length === 0) return null;

    // Check if it's one of the known error messages
    const matchingErrorType: TaskErrorType = Object.values(TaskErrorType).find(
      (errorType: TaskErrorType) =>
        taskErrors.includes(getTaskErrorString(errorType)),
    );
    if (matchingErrorType) return getTaskErrorString(matchingErrorType);

    // Not one of the top-level known ones, is it a problem with a known area?
    const keys = Object.keys(TASK_FIELD_ERROR_TYPE_MAPPING) as TaskErrorType[];
    const mappingErrorType: TaskErrorType = keys.find((key) => {
      const properties: string[] = TASK_FIELD_ERROR_TYPE_MAPPING[key];
      return properties?.some((propertyPath) => _.get(errorObj, propertyPath));
    });
    if (!mappingErrorType) return null;

    // Problem with a known area, get the area based error for a high-level error (more specific error will be on the field)
    return getTaskErrorString(mappingErrorType);
  };

export const findTask = (
  resourceTasks: PipelineBuilderTaskResources,
  task: PipelineTask,
): TaskKind => {
  if (task?.taskRef) {
    if (
      !resourceTasks?.tasksLoaded ||
      !resourceTasks.clusterTasks ||
      !resourceTasks.namespacedTasks
    ) {
      return null;
    }
    const {
      taskRef: { kind, name },
    } = task;
    const matchingName = (taskResource: TaskKind) =>
      taskResource.metadata.name === name;

    if (kind === ClusterTaskModel.kind) {
      return resourceTasks.clusterTasks.find(matchingName);
    }
    return resourceTasks.namespacedTasks.find(matchingName);
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

export const findTaskFromFormikData = (
  formikData: PipelineBuilderFormYamlValues,
  task: PipelineTask,
): TaskKind => {
  const { taskResources } = formikData;
  return findTask(taskResources, task);
};

/**
 * Swaps one runAfter (relatedTaskName) for another (taskName).
 */
export const mapReplaceRelatedInOthers = <
  TaskType extends PipelineBuilderTaskBase,
>(
  taskName: string,
  relatedTaskName: string,
  iterationTask: TaskType,
): TaskType => {
  if (!iterationTask?.runAfter?.includes(relatedTaskName)) {
    return iterationTask;
  }

  const remainingRunAfters = iterationTask.runAfter.filter(
    (runAfterName) => runAfterName !== relatedTaskName,
  );

  return {
    ...iterationTask,
    runAfter: [...remainingRunAfters, taskName],
  };
};

/**
 * Finds and removes a related runAfter (taskName).
 */
export const mapRemoveRelatedInOthers = <
  TaskType extends PipelineBuilderTaskBase,
>(
  taskName: string,
  iterationTask: TaskType,
): TaskType => {
  if (!iterationTask?.runAfter?.includes(taskName)) {
    return iterationTask;
  }

  return {
    ...iterationTask,
    runAfter: iterationTask.runAfter.filter(
      (runAfterName) => runAfterName !== taskName,
    ),
  };
};

/**
 * Removes reference of a task (removalTask) in the other task (iterationTask) & combines the task
 * (removalTask) runAfters in the other task (iterationTask).
 */
export const mapStitchReplaceInOthers = <
  TaskType extends PipelineBuilderTaskBase,
>(
  removalTask: PipelineBuilderTaskBase,
  iterationTask: TaskType,
): TaskType => {
  if (!removalTask?.name) {
    return iterationTask;
  }
  if (!removalTask?.runAfter) {
    return mapRemoveRelatedInOthers<TaskType>(removalTask.name, iterationTask);
  }
  if (!iterationTask?.runAfter?.includes(removalTask.name)) {
    return iterationTask;
  }

  const updatedIterationTask = mapRemoveRelatedInOthers(
    removalTask.name,
    iterationTask,
  );
  let newRunAfter: string[] = removalTask.runAfter;
  if (updatedIterationTask.runAfter.length > 0) {
    newRunAfter = [...updatedIterationTask.runAfter, ...newRunAfter];
  }

  return {
    ...updatedIterationTask,
    runAfter: _.uniq(newRunAfter),
  };
};

/**
 * Simply add a runAfter (of newTaskName) to a task (iterationTask) on matching names (relatedTaskName).
 */
export const mapBeRelated = <TaskType extends PipelineBuilderTaskBase>(
  newTaskName: string,
  relatedTaskName: string,
  iterationTask: TaskType,
): TaskType => {
  if (iterationTask?.name !== relatedTaskName) {
    return iterationTask;
  }

  return {
    ...iterationTask,
    runAfter: [newTaskName],
  };
};

/**
 * Adds a task (taskName) to an existing runAfter (iterationTask.runAfter) if a related name
 * (relatedTaskName) is already part of the runAfter.
 */
export const mapAddRelatedToOthers = <TaskType extends PipelineBuilderTaskBase>(
  taskName: string,
  relatedTaskName: string,
  iterationTask: TaskType,
): TaskType => {
  if (!iterationTask?.runAfter?.includes(relatedTaskName)) {
    return iterationTask;
  }

  return {
    ...iterationTask,
    runAfter: [...iterationTask.runAfter, taskName],
  };
};

export const safeName = (
  reservedNames: string[],
  desiredName: string,
): string => {
  if (reservedNames.includes(desiredName)) {
    const newName = `${desiredName}-${getRandomChars(3)}`;
    if (reservedNames.includes(newName)) {
      return safeName(reservedNames, desiredName);
    }
    return newName;
  }
  return desiredName;
};

export const convertResourceToLoadingTask = (
  usedNames: string[],
  resource: TaskKind,
  isFinallyTask: boolean,
  runAfter?: string[],
): PipelineBuilderLoadingTask => {
  const kind = resource.kind ?? TaskModel.kind;
  return {
    name: safeName(usedNames, resource.metadata.name),
    runAfter: isFinallyTask ? [] : runAfter,
    taskRef: {
      kind,
      name: resource.metadata.name,
    },
    resource,
    isFinallyTask,
  };
};

export const getTaskParameters = (taskResource: TaskKind): TektonParam[] => {
  return (
    _.get(taskResource, PATHS.alphaParameters) ||
    _.get(taskResource, PATHS.betaParameters) ||
    []
  );
};

export const convertResourceToTask = (
  usedNames: string[],
  resource: TaskKind,
  runAfter?: string[],
): PipelineTask => {
  const kind = resource.kind ?? TaskModel.kind;
  return {
    name: safeName(usedNames, resource.metadata.name),
    runAfter,
    taskRef: {
      kind,
      name: resource.metadata.name,
    },
    params: getTaskParameters(resource).map(
      (param: TektonParam): PipelineTaskParam => ({
        name: param.name,
        value: param.default,
      }),
    ),
  };
};

const removeListRunAfters = (
  task: PipelineTask,
  listIds: string[],
): PipelineTask => {
  if (task?.runAfter && listIds.length > 0) {
    // Trim out any runAfters pointing at list nodes
    const runAfter = (task.runAfter || []).filter(
      (runAfterName) => !listIds.includes(runAfterName),
    );

    return {
      ...task,
      runAfter,
    };
  }

  return task;
};

export const removeEmptyFormFields = (task: PipelineTask): PipelineTask => {
  let trimmedTask = task;
  // Since we can submit, this param has a default; check for empty values and remove
  if (task.params?.length > 0) {
    const params = task.params?.filter((param) => !!param.value);
    trimmedTask = { ...trimmedTask, params };
  }
  // Drop input/output resources which are not linked to an (optional) resource.
  if (
    task.resources?.inputs?.length > 0 ||
    task.resources?.outputs?.length > 0
  ) {
    const inputs = task.resources?.inputs?.filter(
      (resource) => resource.resource,
    );
    const outputs = task.resources?.outputs?.filter(
      (resource) => resource.resource,
    );
    trimmedTask = {
      ...trimmedTask,
      resources: { ...trimmedTask.resources, inputs, outputs },
    };
  }
  // Drop workspaces which are not linked to an (optional) workspace.
  if (task.workspaces?.length > 0) {
    const workspaces = task.workspaces?.filter(
      (workspace) => workspace.workspace,
    );
    trimmedTask = { ...trimmedTask, workspaces };
  }
  return trimmedTask;
};

export const convertBuilderFormToPipeline = (
  formValues: PipelineBuilderFormValues,
  namespace: string,
  existingPipeline?: PipelineKind,
): PipelineKind => {
  const {
    name,
    params,
    workspaces,
    tasks,
    listTasks,
    finallyTasks,
    ...others
  } = formValues;
  const listIds = listTasks.map((listTask) => listTask.name);
  // Strip remaining builder-only properties
  const unhandledSpec = _.omit(others, 'finallyListTasks', 'loadingTasks');
  const pipelineYAML = {
    ...existingPipeline,
    apiVersion: getAPIVersionForModel(PipelineModel),
    kind: PipelineModel.kind,
    metadata: {
      ...existingPipeline?.metadata,
      name: existingPipeline?.metadata?.name
        ? existingPipeline?.metadata?.name
        : name,
      namespace,
    },
    spec: {
      ...existingPipeline?.spec,
      ...unhandledSpec,
      params: sanitizePipelineParams(
        params.length > 0 ? params : existingPipeline?.spec?.params ?? [],
      ),
      workspaces:
        workspaces.length > 0
          ? workspaces
          : existingPipeline?.spec?.workspaces ?? [],
      tasks:
        tasks.length > 0
          ? tasks
          : existingPipeline?.spec?.tasks ??
            [].map(
              (task) =>
                task &&
                removeEmptyFormFields(removeListRunAfters(task, listIds)),
            ),
      finally: finallyTasks,
    },
  };
  console.log(pipelineYAML, '####', formValues);
  return pipelineYAML;
};

export const convertPipelineToBuilderForm = (
  pipeline: PipelineKind,
): PipelineBuilderFormValues => {
  if (!pipeline) return null;

  const {
    metadata: { name },
    spec: {
      params = [],
      workspaces = [],
      tasks = [],
      finally: finallyTasks = [],
    },
  } = pipeline;

  return {
    name,
    params,
    workspaces: workspaces.map((workspace) => ({
      ...workspace,
      optional: !!workspace.optional, // Formik fails to understand "undefined boolean" checkbox values
    })),
    tasks,
    listTasks: [],
    loadingTasks: [],
    finallyTasks,
    finallyListTasks: [],
  };
};

export const hasEmptyString = (arr: string[]) => _.find(arr, _.isEmpty) === '';

export const isFieldValid = (
  value: string | string[],
  dirty: boolean,
  emptyIsInvalid: boolean,
) =>
  dirty && emptyIsInvalid
    ? _.isArray(value)
      ? !hasEmptyString(value)
      : !_.isEmpty(value)
    : true;

export const getTaskResources = (
  taskResource: TaskKind,
): TektonResourceGroup<TektonResource> => {
  const inputs =
    _.get(taskResource, PATHS.alphaInputResources) ||
    _.get(taskResource, PATHS.betaInputResources);
  const outputs =
    _.get(taskResource, PATHS.alphaOutputResources) ||
    _.get(taskResource, PATHS.betaOutputResources);

  if (inputs || outputs) {
    return {
      inputs,
      outputs,
    };
  }

  return {};
};

export const getResourceSidebarSamples = (
  kindObj: K8sKind,
  yamlSamplesList: FirehoseResult,
) => {
  const yamlSamplesData = !_.isEmpty(yamlSamplesList)
    ? _.filter(
        yamlSamplesList.data,
        (sample: K8sResourceKind) =>
          sample.spec.targetResource.apiVersion ===
            getAPIVersionForModel(kindObj) &&
          sample.spec.targetResource.kind === kindObj.kind,
      )
    : [];
  const existingSamples = [];
  const extensionSamples = !_.isEmpty(yamlSamplesData)
    ? yamlSamplesData.map((sample: K8sResourceKind) => {
        return {
          id: sample.metadata.uid,
          ...sample.spec,
        };
      })
    : [];

  const allSamples = [...existingSamples, ...extensionSamples];

  // For the time being, `snippets` are a superset of `samples`
  const snippets = allSamples.filter((sample: Sample) => sample.snippet);
  const samples = allSamples.filter((sample: Sample) => !sample.snippet);

  return { snippets, samples };
};
