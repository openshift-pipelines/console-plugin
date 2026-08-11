import * as yup from 'yup';
import { PipelineSpec, PipelineTask } from '../../types';
import { t } from '../utils/common-utils';
import { PipelineBuilderFormValues } from './types';
import {
  nameValidationSchema,
  runAfterMatches,
  runAfterMatchesInScope,
} from './validation-utils';

const TASK_DEFINITION_MESSAGE =
  'TaskSpec, TaskRef, PipelineRef, or PipelineSpec must be provided.';

const hasTaskDefinition = (task?: PipelineTask): boolean => {
  if (task?.taskRef || task?.taskSpec || task?.pipelineRef) {
    return true;
  }
  const pipelineSpec = task?.pipelineSpec;
  return !!(pipelineSpec?.tasks?.length || pipelineSpec?.finally?.length);
};

const resourceDefinitionYAML = () => {
  return yup.array().of(
    yup.object({
      name: yup.string().required(),
      resource: yup.string(),
    }),
  );
};

export const validRunAfter = (
  formData: PipelineBuilderFormValues,
  thisTask: PipelineTask,
) => {
  return yup.array().of(
    yup
      .string()
      .test(
        'tasks-matches-runAfters',
        t('Invalid runAfter'),
        function (runAfter: string) {
          return runAfterMatches(formData, [runAfter], thisTask.name);
        },
      ),
  );
};

const validRunAfterInScope = (
  scopeTaskNames: string[],
  thisTask: PipelineTask,
) => {
  return yup.array().of(
    yup
      .string()
      .test(
        'tasks-matches-runAfters',
        t('Invalid runAfter'),
        function (runAfter: string) {
          return runAfterMatchesInScope(
            scopeTaskNames,
            [runAfter],
            thisTask.name,
          );
        },
      ),
  );
};

const pipelineSpecYAMLSchema = (formData: PipelineBuilderFormValues) =>
  yup.lazy((pipelineSpecValue?: PipelineSpec) => {
    if (!pipelineSpecValue) {
      return yup.mixed().notRequired();
    }
    const scopeTasks = [
      ...(pipelineSpecValue?.tasks ?? []),
      ...(pipelineSpecValue?.finally ?? []),
    ];
    return yup.object({
      params: yup.array().of(
        yup.object({
          name: yup.string(),
          description: yup.string(),
          default: yup.lazy((val) =>
            Array.isArray(val) ? yup.array() : yup.string(),
          ),
        }),
      ),
      workspaces: yup.array().of(
        yup.object({
          name: yup.string(),
        }),
      ),
      tasks: buildTaskValidationYAMLSchema(formData, scopeTasks),
      finally: buildTaskValidationYAMLSchema(formData, scopeTasks),
    });
  });

const buildTaskValidationYAMLSchema = (
  formData: PipelineBuilderFormValues,
  scopeTasks?: PipelineTask[],
) => {
  return yup.array().of(
    yup.lazy((taskObject: PipelineTask) =>
      yup
        .object({
          name: nameValidationSchema(t),
          taskRef: yup
            .object({
              name: yup.string(),
              kind: yup.string(),
            })
            .default(undefined),
          pipelineRef: yup
            .object({
              name: yup.string(),
              kind: yup.string(),
            })
            .default(undefined),
          pipelineSpec: pipelineSpecYAMLSchema(formData),
          taskSpec: yup.object(),
          runAfter: scopeTasks
            ? validRunAfterInScope(
                scopeTasks.map((task) => task.name),
                taskObject,
              )
            : validRunAfter(formData, taskObject),
          params: yup.array().of(
            yup.object({
              name: yup.string().required(),
              value: yup.lazy((value) => {
                if (Array.isArray(value)) {
                  return yup.array().of(yup.string());
                }
                return yup.string();
              }),
            }),
          ),
          resources: yup.object({
            inputs: resourceDefinitionYAML(),
            outputs: resourceDefinitionYAML(),
          }),
          when: yup.array().of(
            yup.object({
              input: yup.string(),
              operator: yup.string(),
              values: yup.array().of(yup.string()),
            }),
          ),
          workspaces: yup.array().of(
            yup.object({
              name: yup.string().required(),
              workspace: yup.string(),
            }),
          ),
        })
        .test(
          'task-definition',
          t(TASK_DEFINITION_MESSAGE),
          (task?: PipelineTask) => hasTaskDefinition(task),
        ),
    ),
  );
};

const taskValidationYAMLSchema = (formData: PipelineBuilderFormValues) =>
  buildTaskValidationYAMLSchema(formData);

export const pipelineBuilderYAMLSchema = (
  formData: PipelineBuilderFormValues,
) => {
  return yup.object({
    metadata: yup.object({ name: yup.string() }),
    spec: yup.object({
      params: yup.array().of(
        yup.object({
          name: yup.string(),
          description: yup.string(),
          default: yup.lazy((val) =>
            Array.isArray(val) ? yup.array() : yup.string(),
          ),
        }),
      ),
      resources: yup.array().of(
        yup.object({
          name: yup.string(),
          type: yup.string(),
        }),
      ),
      workspaces: yup.array().of(
        yup.object({
          name: yup.string(),
        }),
      ),
      tasks: taskValidationYAMLSchema(formData),
      finally: taskValidationYAMLSchema(formData),
    }),
  });
};
