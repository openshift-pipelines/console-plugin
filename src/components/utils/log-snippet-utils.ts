import { Condition, TaskRunStatus } from '../../types';
import { CombinedErrorDetails } from '../../types/log-snippet-types';
import { t } from './common-utils';

const joinConditions = (conditions: Condition[]) =>
  conditions.map((condition) => condition.message).join('\n') ||
  t('Unknown failure condition');

export const taskRunSnippetMessage = (
  taskName: string,
  taskRunStatus: TaskRunStatus,
  containerName: string,
): CombinedErrorDetails => {
  if (!taskRunStatus?.podName || !containerName) {
    // Not enough to go to the logs, print all the conditions messages together
    return {
      staticMessage: joinConditions(taskRunStatus.conditions),
      title: t('Failure on task {{taskName}} - check logs for details.', {
        taskName,
      }),
    };
  }
  // We don't know enough but have enough to locate the logs
  return {
    containerName,
    podName: taskRunStatus.podName,
    title: t('Failure on task {{taskName}} - check logs for details.', {
      taskName,
    }),
  };
};
