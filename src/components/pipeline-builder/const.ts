import { t } from '../utils/common-utils';
import { PipelineBuilderFormValues } from './types';

export const STATUS_KEY_NAME_ERROR = 'taskError';

export enum UpdateOperationType {
  ADD_LIST_TASK,
  ADD_FINALLY_LIST_TASK,
  ADD_LOADING_TASK,
  ADD_FINALLY_LOADING_TASK,
  CONVERT_LOADING_TASK_TO_TASK,
  CONVERT_LOADING_TASK_TO_FINALLY_TASK,
  CONVERT_LIST_TO_TASK,
  CONVERT_LIST_TO_FINALLY_TASK,
  RENAME_TASK,
  REMOVE_TASK,
  DELETE_LIST_TASK,
  DELETE_FINALLY_LIST_TASK,
  FIX_INVALID_LIST_TASK,
  FIX_INVALID_FINALLY_LIST_TASK,
}

export enum TaskErrorType {
  NAME_ERROR = 'nameError',
  MISSING_REQUIRED_PARAMS = 'missingParams',
  MISSING_RESOURCES = 'missingResources',
  MISSING_WORKSPACES = 'missingWorkspaces',
  MISSING_REQUIRED_WHEN_EXPRESSIONS = 'missingWhenExpressions',
}

export const TASK_FIELD_ERROR_TYPE_MAPPING: {
  [key in TaskErrorType]: string[];
} = {
  [TaskErrorType.NAME_ERROR]: ['name'],
  [TaskErrorType.MISSING_REQUIRED_PARAMS]: ['params'],
  [TaskErrorType.MISSING_RESOURCES]: ['resources'],
  [TaskErrorType.MISSING_WORKSPACES]: ['workspaces'],
  [TaskErrorType.MISSING_REQUIRED_WHEN_EXPRESSIONS]: ['when'],
};

export const getTaskErrorString = (errorType: TaskErrorType): string => {
  switch (errorType) {
    case TaskErrorType.NAME_ERROR:
      return t('Invalid name');
    case TaskErrorType.MISSING_REQUIRED_PARAMS:
      return t('Missing parameters');
    case TaskErrorType.MISSING_RESOURCES:
      return t('Missing resources');
    case TaskErrorType.MISSING_WORKSPACES:
      return t('Missing workspaces');
    case TaskErrorType.MISSING_REQUIRED_WHEN_EXPRESSIONS:
      return t('Invalid when expressions');
    default:
      throw new Error(`Unknown errorType, ${errorType}`);
  }
};

export enum WhenExpressionOperatorType {
  in = 'in',
  notin = 'notin',
}

export const initialPipelineFormData: PipelineBuilderFormValues = {
  name: 'new-pipeline',
  params: [],
  workspaces: [],
  tasks: [],
  listTasks: [],
  finallyTasks: [],
  finallyListTasks: [],
  loadingTasks: [],
};

export const LOCAL_STORAGE_KEY_EDITOR_TYPE =
  'pipeline-console-plugin-editorType';
