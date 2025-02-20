import * as yup from 'yup';
import { PipelineTask } from '../../types';
import { t } from '../utils/common-utils';
import { PipelineBuilderFormValues } from './types';
import { nameValidationSchema, runAfterMatches } from './validation-utils';

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

const taskValidationYAMLSchema = (formData: PipelineBuilderFormValues) => {
  return yup.array().of(
    yup.lazy((taskObject) =>
      yup
        .object({
          name: nameValidationSchema((tKey) => t(tKey)),
          taskRef: yup
            .object({
              name: yup.string(),
              kind: yup.string(),
            })
            .default(undefined),
          taskSpec: yup.object(),
          runAfter: validRunAfter(formData, taskObject),
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
          'taskRef-or-taskSpec',
          t('TaskSpec or TaskRef must be provided.'),
          function (task) {
            return !!task.taskRef || !!task.taskSpec;
          },
        ),
    ) as any,
  );
};

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
