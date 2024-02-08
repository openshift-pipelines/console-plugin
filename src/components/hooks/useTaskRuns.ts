import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
// import { k8sListResource } from '@openshift-console/dynamic-plugin-sdk';
import { TektonResourceLabel } from '../../consts';
import { TaskRunKind } from '../../types';

export const useTaskRuns = (
  namespace: string,
  pipelineRunName?: string,
): [TaskRunKind[], boolean, unknown] => {
  const taskRunResource = pipelineRunName
    ? {
        kind: 'TaskRun',
        namespace,
        selector: {
          matchLabels: {
            [TektonResourceLabel.pipelinerun]: pipelineRunName,
          },
        },
        isList: true,
      }
    : {
        kind: 'TaskRun',
        namespace,
        isList: true,
      };
  return useK8sWatchResource<TaskRunKind[]>(taskRunResource);
};

export const getTaskRunsOfPipelineRun = (
  taskRuns: TaskRunKind[],
  pipelineRunName: string,
): TaskRunKind[] => {
  return taskRuns.filter(
    (taskRun) =>
      taskRun.metadata?.labels[TektonResourceLabel.pipelinerun] ===
      pipelineRunName,
  );
};
