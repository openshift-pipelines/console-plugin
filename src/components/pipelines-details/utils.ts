import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { PIPELINE_NAMESPACE } from '../../consts';
import {
  PipelineKind,
  PipelineTask,
  ResourceModelLink,
  TektonParam,
} from '../../types';
import { groupVersionFor } from '../utils/k8s-utils';
import { getSafeTaskResourceKind } from '../utils/pipeline-augment';

type PipelineTaskLinks = {
  pipelineLinks: ResourceModelLink[];
  taskLinks: ResourceModelLink[];
  finallyTaskLinks: ResourceModelLink[];
};

const partition = (items: ResourceModelLink[]) => {
  const pipelines: ResourceModelLink[] = [];
  const tasks: ResourceModelLink[] = [];
  for (const item of items) {
    if (item.resourceKind === 'Pipeline') {
      pipelines.push(item);
    } else {
      /* Embedded tasks, approval tasks, custom tasks, and any unresolved kinds are pushed to tasks */
      tasks.push(item);
    }
  }
  return { pipelines, tasks };
};

export const getPipelineTaskLinks = (
  pipeline: PipelineKind,
): PipelineTaskLinks => {
  const toResourceLinkData = (tasks: PipelineTask[]): ResourceModelLink[] => {
    const { t } = useTranslation('plugin__pipelines-console-plugin');
    if (!tasks) return [];
    const { version } = groupVersionFor(pipeline.apiVersion);
    return tasks?.map((task) => {
      if (task.taskRef) {
        if (task.taskRef.resolver === 'cluster') {
          const nameParam = task.taskRef.params?.find(
            (param) => param.name === 'name',
          )?.value;
          const namespaceParam = task.taskRef.params?.find(
            (param) => param.name === 'namespace',
          )?.value;
          return {
            resourceKind: getSafeTaskResourceKind(task.taskRef.kind),
            name: nameParam,
            qualifier: task.name,
            namespace: namespaceParam ?? PIPELINE_NAMESPACE,
            resourceApiVersion: version,
          };
        }
        return task.taskRef.kind === 'Task'
          ? {
              resourceKind: getSafeTaskResourceKind(task.taskRef.kind),
              name: task.taskRef.name,
              qualifier: task.name,
              resourceApiVersion: version,
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
      } else if (task?.pipelineRef) {
        if (task.pipelineRef.resolver === 'cluster') {
          const nameParam = task.pipelineRef.params?.find(
            (param) => param.name === 'name',
          )?.value;
          const namespaceParam = task.pipelineRef.params?.find(
            (param) => param.name === 'namespace',
          )?.value;

          return {
            resourceKind: getSafeTaskResourceKind(task.pipelineRef.kind),
            name: nameParam,
            qualifier: task.name,
            namespace: namespaceParam ?? PIPELINE_NAMESPACE,
            resourceApiVersion: version,
          };
        }

        return {
          resourceKind: 'Pipeline',
          name: task.pipelineRef.name,
          qualifier: task.name,
          resourceApiVersion: version,
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

  const allTask = toResourceLinkData(pipeline.spec.tasks);
  const allFinallyTask = toResourceLinkData(pipeline.spec.finally);
  const { pipelines: taskPipelines, tasks: taskLinks } = partition(allTask);
  const { pipelines: finallyPipelines, tasks: finallyTaskLinks } =
    partition(allFinallyTask);

  return {
    pipelineLinks: [...taskPipelines, ...finallyPipelines],
    taskLinks,
    finallyTaskLinks,
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
