import _ from 'lodash';
import { useTranslation } from 'react-i18next';
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
    return tasks?.map((task) =>
      task.taskRef
        ? task.taskRef.kind === 'ClusterTask' || task.taskRef.kind === 'Task'
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
            }
        : {
            resourceKind: 'EmbeddedTask',
            name: t('Embedded task'),
            qualifier: task.name,
            disableLink: true,
          },
    );
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
