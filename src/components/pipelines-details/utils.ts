import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { PIPELINE_NAMESPACE } from '../../consts';
import {
  PipelineKind,
  PipelineTask,
  ResourceModelLink,
  TektonParam,
} from '../../types';
import { getSafeTaskResourceKind } from '../utils/pipeline-augment';

type PipelineTaskLinks = {
  taskLinks: ResourceModelLink[];
  finallyTaskLinks: ResourceModelLink[];
};

export const getPipelineTaskLinks = (
  pipeline: PipelineKind,
): PipelineTaskLinks => {
  const toResourceLinkData = (tasks: PipelineTask[]): ResourceModelLink[] => {
    const { t } = useTranslation('plugin__pipelines-console-plugin');
    if (!tasks) return [];
    return tasks?.map((task) => {
      if (task.taskRef) {
        if (task.taskRef.resolver === 'cluster') {
          const nameParam = task.taskRef.params?.find(
            (param) => param.name === 'name',
          )?.value;
          return {
            resourceKind: getSafeTaskResourceKind(task.taskRef.kind),
            name: nameParam,
            qualifier: task.name,
            namespace: PIPELINE_NAMESPACE,
          };
        }
        return task.taskRef.kind === 'Task'
          ? {
              resourceKind: getSafeTaskResourceKind(task.taskRef.kind),
              name: task.taskRef.name,
              qualifier: task.name,
            }
          : {
              resourceKind: task.taskRef?.kind,
              name:
                task.taskRef?.kind === 'ApprovalTask'
                  ? t('Approval Task')
                  : t('Custom Task'),
              qualifier: task.name,
              disableLink: true,
            };
      }
      return {
        resourceKind: 'EmbeddedTask',
        name: t('Embedded task'),
        qualifier: task.name,
        disableLink: true,
      };
    });
  };
  return {
    taskLinks: toResourceLinkData(pipeline.spec.tasks),
    finallyTaskLinks: toResourceLinkData(pipeline.spec.finally),
  };
};

export const removeEmptyDefaultFromPipelineParams = (
  parameters: TektonParam[],
): TektonParam[] =>
  _.map(
    parameters,
    (parameter) =>
      _.omit(
        parameter,
        _.isEmpty(parameter.default) ? ['default'] : [],
      ) as TektonParam,
  );

export const sanitizePipelineParams = (
  parameters: TektonParam[],
): TektonParam[] => {
  const pipelineWithNoEmptyDefaultParams =
    removeEmptyDefaultFromPipelineParams(parameters);
  return pipelineWithNoEmptyDefaultParams.length > 0
    ? pipelineWithNoEmptyDefaultParams.map((parameter) => {
        if (
          parameter?.type === 'array' &&
          typeof parameter?.default === 'string'
        ) {
          return {
            ...parameter,
            default: parameter.default.split(',').map((param) => param.trim()),
          };
        }
        return parameter;
      })
    : [];
};
