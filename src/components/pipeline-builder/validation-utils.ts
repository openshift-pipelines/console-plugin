import { TFunction } from 'i18next';
import * as _ from 'lodash';
import * as yup from 'yup';
import {
  PipelineTask,
  PipelineTaskParam,
  PipelineTaskWorkspace,
  TektonWorkspace,
  WhenExpression,
} from '../../types';
import { paramIsRequired } from '../start-pipeline/validation-utils';
import { getTaskErrorString, TaskErrorType } from './const';
import {
  EditorType,
  PipelineBuilderFormValues,
  PipelineBuilderFormYamlValues,
  TaskType,
} from './types';
import { findTaskFromFormikData, getTaskParameters } from './utils';

export const nameRegex = /^[a-z]([a-z0-9]-?)*[a-z0-9]$/;
export const nameValidationSchema = (t: TFunction, maxLength = 263) =>
  yup
    .string()
    .matches(nameRegex, {
      message: t(
        'plugin__pipelines-console-plugin~Name must consist of lower-case letters, numbers and hyphens. It must start with a letter and end with a letter or number.',
      ),
      excludeEmptyString: true,
    })
    .max(
      maxLength,
      // see https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names
      t(
        'plugin__pipelines-console-plugin~Cannot be longer than {{characterCount}} characters.',
        {
          characterCount: maxLength,
        },
      ),
    )
    .required(t('plugin__pipelines-console-plugin~Required'));

/**
 * Checks to see if the params without a default have a value
 */
const areRequiredParamsAdded = (
  formValues: PipelineBuilderFormYamlValues,
  pipelineTask: PipelineTask,
  params: PipelineTaskParam[] = [],
): boolean => {
  const task = findTaskFromFormikData(formValues, pipelineTask);
  if (!task) {
    // No task, means we don't know if the param is nullable, so pass the test
    return true;
  }

  const requiredTaskParams = getTaskParameters(task).filter(paramIsRequired);
  if (requiredTaskParams.length === 0) {
    // No required params, no issue
    return true;
  }

  return !requiredTaskParams.some((requiredParam) => {
    const matchingParam = params.find(
      ({ name }) => name === requiredParam.name,
    );
    return !matchingParam || !matchingParam.value;
  });
};

const areRequiredWhenExpressionsAdded = (when: WhenExpression[] = []) => {
  if (when.length === 0) {
    return true;
  }
  const invalidValues = (values: string[]) =>
    (values || []).length === 0 || values.some((v) => v?.length === 0);
  return !when?.some(
    (w) =>
      w?.input?.length === 0 ||
      w?.operator?.length === 0 ||
      invalidValues(w?.values),
  );
};

/**
 * Finds the workspace tied to the workspaceName.
 */
const findWorkspace = (
  formValues: PipelineBuilderFormYamlValues,
  path: string,
  workspaceName: string,
): TektonWorkspace | false => {
  // Search the taskPath which is parent of the given path.
  // If an path like formData.finallyTasks[0].workspaces[0].workspace is given
  // it returns the path formData.finallyTasks[0]
  const taskPath = path.split('.').slice(0, 2).join('.');
  const pipelineTask: PipelineTask = _.get(formValues, taskPath);

  // Find the task based on the ref
  const task = findTaskFromFormikData(formValues, pipelineTask);
  if (!task) {
    // No task, can't find resources
    return false;
  }
  return task.spec.workspaces?.find(({ name }) => name === workspaceName);
};

/**
 * Check to see if this task has all the workspaces the stand-alone TaskKind requests.
 */
const hasRequiredWorkspaces = (
  formValues: PipelineBuilderFormYamlValues,
  pipelineTask: PipelineTask,
  taskWorkspaces: PipelineTaskWorkspace[],
) => {
  const task = findTaskFromFormikData(formValues, pipelineTask);
  if (!task) {
    // No matching task, can't verify if workspaces are needed
    return true;
  }

  const requiredWorkspaces =
    task.spec.workspaces?.filter(({ optional }) => !optional) || [];
  const noWorkspaces = !taskWorkspaces || taskWorkspaces.length === 0;
  const needWorkspaces = requiredWorkspaces?.length > 0;
  if (noWorkspaces) {
    // If we have no workspaces, we are done; if we need workspaces we fail
    return !needWorkspaces;
  }
  const workspaceNames = taskWorkspaces.map(({ name }) => name);
  return !requiredWorkspaces.some(({ name }) => !workspaceNames.includes(name));
};

/**
 * Checks to make sure all runAfter values are task/listTask names.
 */
export const runAfterMatches = (
  formData: PipelineBuilderFormValues,
  runAfter: string[],
  thisTaskName: string,
): boolean => {
  if (!runAfter || runAfter.length === 0) {
    // No failure case if we don't have a run after
    return true;
  }
  if (runAfter.includes(thisTaskName)) {
    // Fails if it includes itself (can't run after yourself)
    return false;
  }

  const { tasks, listTasks } = formData;
  const taskNames = tasks
    .map((t) => t.name)
    .concat(listTasks.map((t) => t.name));
  return !runAfter.some((name) => !taskNames.includes(name));
};

/**
 * Validates a runAfter to have valid values.
 *
 * Note: Expects to be in an object of { name: string(), runAfter: thisFunction(...), ... }
 */
const validRunAfter = (formData: PipelineBuilderFormValues, t: TFunction) => {
  return yup
    .array()
    .of(yup.string())
    .test(
      'tasks-matches-runAfters',
      t('pipelines-plugin~Invalid runAfter'),
      function (runAfter: string[]) {
        return runAfterMatches(formData, runAfter, this.parent.name);
      },
    );
};

/**
 * Validates Tasks or Finally Tasks for valid structure
 */
const taskValidation = (
  formValues: PipelineBuilderFormYamlValues,
  taskType: TaskType,
  t: TFunction,
) => {
  const {
    formData: { workspaces },
  } = formValues;

  return yup.array().of(
    yup
      .object({
        // `name` is properly validated in TaskSidebarName
        name: yup.string().required(t('pipelines-plugin~Required')),
        taskRef: yup
          .object({
            name: yup.string().required(t('pipelines-plugin~Required')),
            kind: yup.string(),
          })
          .default(undefined),
        taskSpec: yup.object(),
        runAfter: validRunAfter(formValues.formData, t),
        params: yup
          .array()
          .of(
            yup.object({
              name: yup.string().required(t('pipelines-plugin~Required')),
              value: yup.lazy((value) => {
                if (Array.isArray(value)) {
                  return yup
                    .array()
                    .of(yup.string().required(t('pipelines-plugin~Required')));
                }
                return yup.string();
              }),
            }),
          )
          .test(
            'is-param-optional',
            getTaskErrorString(TaskErrorType.MISSING_REQUIRED_PARAMS),
            function (params?: PipelineTaskParam[]) {
              return areRequiredParamsAdded(formValues, this.parent, params);
            },
          ),
        when: yup
          .array()
          .of(
            yup.object({
              input: yup.string().required(t('pipelines-plugin~Required')),
              operator: yup.string().required(t('pipelines-plugin~Required')),
              values: yup
                .array()
                .of(yup.string().required(t('pipelines-plugin~Required'))),
            }),
          )
          .test(
            'is-when-expression-required',
            getTaskErrorString(TaskErrorType.MISSING_REQUIRED_WHEN_EXPRESSIONS),
            function (when?: WhenExpression[]) {
              return areRequiredWhenExpressionsAdded(when);
            },
          ),

        workspaces: yup
          .array()
          .of(
            yup.object({
              name: yup.string().required(t('pipelines-plugin~Required')),
              workspace: yup
                .string()
                .test(
                  'is-workspace-is-required',
                  t('pipelines-plugin~Required'),
                  function (workspaceValue?: string): any {
                    const workspace = findWorkspace(
                      formValues,
                      this.path,
                      this.parent.name,
                    );
                    return !workspace || workspace.optional || workspaceValue;
                  },
                )
                .test(
                  'are-workspaces-available',
                  t(
                    'pipelines-plugin~No workspaces available. Add pipeline workspaces.',
                  ),
                  () => workspaces?.length > 0,
                )
                .test(
                  'is-workspace-link-broken',
                  t('pipelines-plugin~Workspace name has changed; reselect.'),
                  (workspaceValue?: string) =>
                    !workspaceValue ||
                    !!workspaces.find(({ name }) => name === workspaceValue),
                ),
            }),
          )
          .test(
            'is-workspaces-required',
            getTaskErrorString(TaskErrorType.MISSING_WORKSPACES),
            function (workspaceList?: PipelineTaskWorkspace[]) {
              return hasRequiredWorkspaces(
                formValues,
                this.parent,
                workspaceList,
              );
            },
          ),
      })
      .test(
        'taskRef-or-taskSpec',
        t('pipelines-plugin~TaskSpec or TaskRef must be provided.'),
        function (task) {
          return !!task.taskRef || !!task.taskSpec;
        },
      ),
  );
};

/**
 * Validates the Form side of the Form/YAML switcher
 */
const pipelineBuilderFormSchema = (
  formValues: PipelineBuilderFormYamlValues,
  t: TFunction,
) => {
  return yup.object({
    name: nameValidationSchema((tKey) => t(tKey)).required(
      t('pipelines-plugin~Required'),
    ),
    params: yup.array().of(
      yup.object({
        name: yup.string().required(t('pipelines-plugin~Required')),
        description: yup.string(),
        default: yup.string(), // TODO: should include string[]
        // TODO: should have type (string | string[])
      }),
    ),
    workspaces: yup.array().of(
      yup.object({
        name: yup.string().required(t('pipelines-plugin~Required')),
        // TODO: should include optional flag
      }),
    ),
    tasks: taskValidation(formValues, 'tasks', t)
      .min(1, t('pipelines-plugin~Must define at least one task.'))
      .required(t('pipelines-plugin~Required')),
    finallyTasks: taskValidation(formValues, 'finallyTasks', t),
    listTasks: yup.array().of(
      yup.object({
        name: yup.string().required(t('pipelines-plugin~Required')),
        runAfter: validRunAfter(formValues.formData, t),
      }),
    ),
    finallyListTasks: yup.array().of(
      yup.object({
        name: yup.string().required(t('pipelines-plugin~Required')),
      }),
    ),
  });
};

export const validationSchema = (t: TFunction) =>
  yup.mixed().test({
    test(formValues: PipelineBuilderFormYamlValues) {
      const formYamlDefinition: any = yup.object({
        editorType: yup.string().oneOf(Object.values(EditorType)),
        yamlData: yup.string(),
        formData: yup.mixed().when('editorType', {
          is: EditorType.Form,
          then: pipelineBuilderFormSchema(formValues, t),
        }),
      });

      return formYamlDefinition.validate(formValues, { abortEarly: false });
    },
  });
