import * as yup from 'yup';
import { PipelineSpec, PipelineTask } from '../../types';
import { t } from '../utils/common-utils';
import { PipelineBuilderFormValues } from './types';
import { nameValidationSchema } from './validation-utils';

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
  scopeTasks: PipelineTask[],
  thisTask: PipelineTask,
) => {
  return yup.array().of(
    yup
      .string()
      .test(
        'tasks-matches-runAfters',
        t('Invalid runAfter'),
        function (runAfter: string) {
          if (!runAfter) return true;
          // Check if task is trying to run after itself
          if (runAfter === thisTask?.name) return false;

          const taskNames = scopeTasks.map((task) => task.name);
          const listTaskNames = (formData.listTasks ?? []).map(
            (listTask) => listTask.name,
          );
          return (
            taskNames.includes(runAfter) || listTaskNames.includes(runAfter)
          );
        },
      ),
  );
};

const taskValidationYAMLSchema = (
  formData: PipelineBuilderFormValues,
  scopeTasks: PipelineTask[],
) => {
  return yup.array().of(
    yup.lazy((taskObject) =>
      yup
        .object({
          name: nameValidationSchema(t),
          taskRef: yup
            .object({
              name: yup.string(),
              kind: yup.string(),
              resolver: yup.string(),
              params: yup
                .array()
                .of(yup.object({ name: yup.string(), value: yup.string() })),
            })
            .default(undefined),
          pipelineRef: yup
            .object({
              name: yup.string(),
              kind: yup.string(),
              resolver: yup.string(),
              params: yup
                .array()
                .of(yup.object({ name: yup.string(), value: yup.string() })),
            })
            .default(undefined),
          pipelineSpec: pipelineSpecYAMLSchema(
            formData,
            taskObject.pipelineSpec,
          ),
          taskSpec: yup.object(),
          runAfter: validRunAfter(formData, scopeTasks, taskObject),
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

const pipelineSpecYAMLSchema = (
  formData: PipelineBuilderFormValues,
  pipelineSpecValue?: PipelineSpec,
) =>
  yup.lazy(() => {
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
      tasks: taskValidationYAMLSchema(formData, scopeTasks),
      finally: taskValidationYAMLSchema(formData, scopeTasks),
    });
  });

export const pipelineBuilderYAMLSchema = (
  formData: PipelineBuilderFormValues,
) => {
  return yup.object({
    metadata: yup.object({ name: yup.string() }),
    spec: yup.lazy((specValue?: PipelineSpec) => {
      const topLevelScopeTasks = [
        ...(specValue?.tasks ?? []),
        ...(specValue?.finally ?? []),
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
        tasks: taskValidationYAMLSchema(formData, topLevelScopeTasks),
        finally: taskValidationYAMLSchema(formData, topLevelScopeTasks),
      });
    }),
  });
};
