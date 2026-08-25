import { TFunction, TOptions } from 'i18next';
import * as _ from 'lodash';
import * as yup from 'yup';
import {
  PipelineTask,
  PipelineTaskParam,
  PipelineTaskWorkspace,
  TektonParam,
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
export const nameValidationSchema = (
  t: (key: string, options?: TOptions) => string,
  maxLength = 263,
) =>
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
  // For embedded taskSpec, we can get params directly
  let taskParams: TektonParam[] = [];
  if (pipelineTask.taskSpec) {
    taskParams = (pipelineTask.taskSpec.params as TektonParam[]) || [];
  } else {
    // For referenced tasks, look them up
    const task = findTaskFromFormikData(formValues, pipelineTask);
    if (!task) {
      // No task, means we don't know if the param is nullable, so pass the test
      return true;
    }
    taskParams = getTaskParameters(task);
  }

  const requiredTaskParams = taskParams.filter(paramIsRequired);
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

  // For embedded taskSpec, we can get workspaces directly
  let taskSpec;
  if (pipelineTask.taskSpec) {
    taskSpec = pipelineTask.taskSpec;
  } else {
    // For referenced tasks, look them up
    const task = findTaskFromFormikData(formValues, pipelineTask);
    if (!task) {
      // No task, can't find resources
      return false;
    }
    taskSpec = task.spec;
  }
  return taskSpec.workspaces?.find(({ name }) => name === workspaceName);
};

/**
 * Check to see if this task has all the workspaces the stand-alone TaskKind requests.
 */
const hasRequiredWorkspaces = (
  formValues: PipelineBuilderFormYamlValues,
  pipelineTask: PipelineTask,
  taskWorkspaces: PipelineTaskWorkspace[],
) => {
  // For embedded taskSpec, we can get workspaces directly
  let taskSpec;
  if (pipelineTask.taskSpec) {
    taskSpec = pipelineTask.taskSpec;
  } else {
    // For referenced tasks, look them up
    const task = findTaskFromFormikData(formValues, pipelineTask);
    if (!task) {
      // No matching task, can't verify if workspaces are needed
      return true;
    }
    taskSpec = task.spec;
  }

  const requiredWorkspaces =
    taskSpec.workspaces?.filter(({ optional }) => !optional) || [];
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
const validRunAfter = (
  formData: PipelineBuilderFormValues,
  scopeTasks: PipelineTask[],
  t: TFunction,
) => {
  return yup
    .array()
    .of(yup.string())
    .test(
      'tasks-matches-runAfters',
      t('Invalid runAfter'),
      function (runAfter: string[]) {
        return runAfterMatches(
          { ...formData, tasks: scopeTasks },
          runAfter,
          this.parent.name,
        );
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
  isAlphaEnabled: boolean,
  scopeTasks: PipelineTask[] = formValues.formData.tasks,
) => {
  const {
    formData: { workspaces },
  } = formValues;

  return yup.array().of(
    yup
      .object({
        name: yup.string().required(t('Required')),
        taskRef: yup
          .object({
            name: yup.string().when('resolver', ([resolver]) => {
              return !resolver
                ? yup.string().required(t('Required'))
                : yup.string().notRequired();
            }),
            kind: yup.string(),
            resolver: yup.string().oneOf(['cluster']).notRequired(),
            params: yup
              .array()
              .of(
                yup.object({
                  name: yup.string().required(t('Required')),
                  value: yup.string().required(t('Required')),
                }),
              )
              .when('resolver', ([resolver]) => {
                return resolver
                  ? yup.array().min(1, t('Required'))
                  : yup.array().notRequired();
              }),
          })
          .default(undefined),
        pipelineRef: yup
          .object({
            name: yup.string().when('resolver', ([resolver]) => {
              return !resolver
                ? yup.string().required(t('Required'))
                : yup.string().notRequired();
            }),
            kind: yup.string(),
            resolver: yup.string().oneOf(['cluster']).notRequired(),
            params: yup
              .array()
              .of(
                yup.object({
                  name: yup.string().required(t('Required')),
                  value: yup.string().required(t('Required')),
                }),
              )
              .when('resolver', ([resolver]) => {
                return resolver
                  ? yup.array().min(1, t('Required'))
                  : yup.array().notRequired();
              }),
          })
          .default(undefined)
          .test(
            'pipelineRef-requires-alpha',
            t(
              'Referencing a Pipeline requires the alpha API fields to be enabled.',
            ),
            (pipelineRef) => !pipelineRef || isAlphaEnabled,
          )
          .default(undefined),
        taskSpec: yup.object(),
        pipelineSpec: yup.lazy((pipelineSpecValue) => {
          if (!pipelineSpecValue) {
            return yup.mixed().notRequired();
          }
          const nestedScopeTasks = pipelineSpecValue.tasks ?? [];
          return yup
            .object({
              tasks: taskValidation(
                formValues,
                'tasks',
                t,
                isAlphaEnabled,
                nestedScopeTasks,
              ),
              finally: taskValidation(
                formValues,
                'finallyTasks',
                t,
                isAlphaEnabled,
                nestedScopeTasks,
              ),
            })
            .test(
              'pipelineSpec-requires-alpha',
              t(
                'Embedding a Pipeline requires the alpha API fields to be enabled.',
              ),
              () => isAlphaEnabled,
            );
        }),
        runAfter: validRunAfter(formValues.formData, scopeTasks, t),
        params: yup
          .array()
          .of(
            yup.object({
              name: yup.string().required(t('Required')),
              value: yup.lazy((value) => {
                if (Array.isArray(value)) {
                  return yup.array().of(yup.string());
                }
                return yup.string();
              }),
              type: yup.string().oneOf(['string', 'array']),
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
              input: yup.string().required(t('Required')),
              operator: yup.string().required(t('Required')),
              values: yup.array().of(yup.string().required(t('Required'))),
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
              name: yup.string().required(t('Required')),
              workspace: yup
                .string()
                .test(
                  'is-workspace-is-required',
                  t('Required'),
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
                  t('No workspaces available. Add pipeline workspaces.'),
                  () => workspaces?.length > 0,
                )
                .test(
                  'is-workspace-link-broken',
                  t('Workspace name has changed; reselect.'),
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
        'taskRef-or-taskSpec-or-pipelineRef-or-pipelineSpec',
        t('TaskSpec, TaskRef, PipelineRef, or PipelineSpec must be provided.'),
        function (task) {
          // Check if taskRef is properly defined
          const hasTaskRef = !!(
            task.taskRef &&
            (task.taskRef.name ||
              (task.taskRef.resolver &&
                task.taskRef.params &&
                task.taskRef.params.length > 0))
          );
          // Check if pipelineRef is properly defined
          const hasPipelineRef = !!(
            task.pipelineRef &&
            (task.pipelineRef.name ||
              (task.pipelineRef.resolver &&
                task.pipelineRef.params &&
                task.pipelineRef.params.length > 0))
          );
          // Check if taskSpec is defined (can be empty object)
          const hasTaskSpec = !!task.taskSpec;
          // Check if pipelineSpec is properly defined
          const hasPipelineSpec = !!(
            task.pipelineSpec &&
            (task.pipelineSpec.tasks?.length > 0 ||
              task.pipelineSpec.finally?.length > 0)
          );

          return hasTaskRef || hasPipelineRef || hasTaskSpec || hasPipelineSpec;
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
  isAlphaEnabled: boolean,
) => {
  return yup.object({
    name: nameValidationSchema(t).required(t('Required')),
    params: yup.array().of(
      yup.object({
        name: yup.string().required(t('Required')),
        description: yup.string(),
        default: yup.string(),
      }),
    ),
    workspaces: yup.array().of(
      yup.object({
        name: yup.string().required(t('Required')),
      }),
    ),
    tasks: taskValidation(formValues, 'tasks', t, isAlphaEnabled)
      .min(1, t('Must define at least one task.'))
      .required(t('Required')),
    finallyTasks: taskValidation(formValues, 'finallyTasks', t, isAlphaEnabled),
    listTasks: yup.array().of(
      yup.object({
        name: yup.string().required(t('Required')),
        runAfter: validRunAfter(
          formValues.formData,
          formValues.formData.tasks,
          t,
        ),
      }),
    ),
    finallyListTasks: yup.array().of(
      yup.object({
        name: yup.string().required(t('Required')),
      }),
    ),
  });
};

export const validationSchema = (t: TFunction, isAlphaEnabled: boolean) =>
  yup.mixed().test({
    test(formValues: PipelineBuilderFormYamlValues) {
      const formYamlDefinition: any = yup.object({
        editorType: yup.string().oneOf(Object.values(EditorType)),
        yamlData: yup.string(),
        formData: yup.mixed().when('editorType', ([editorType]) => {
          if (editorType === EditorType.Form) {
            return pipelineBuilderFormSchema(formValues, t, isAlphaEnabled);
          }

          return yup.mixed().notRequired();
        }),
      });

      return formYamlDefinition.validateSync(formValues, { abortEarly: false });
    },
  });
