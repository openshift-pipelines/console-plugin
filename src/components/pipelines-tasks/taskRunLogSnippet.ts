import { useTranslation } from 'react-i18next';
import { Condition, PLRTaskRunStep, TaskRunKind } from '../../types';
import { CombinedErrorDetails } from '../../types/log-snippet-types';
import { taskRunSnippetMessage } from '../utils/log-snippet-utils';
import { taskRunFilterReducer } from '../utils/pipeline-filter-reducer';

export const getTRLogSnippet = (taskRun: TaskRunKind): CombinedErrorDetails => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  if (!taskRun?.status) {
    // Lack information to pull from the Pipeline Run
    return null;
  }
  if (taskRunFilterReducer(taskRun) !== 'Failed') {
    // Not in a failed state, no need to get the log snippet
    return null;
  }

  const succeededCondition = taskRun.status.conditions?.find(
    (condition: Condition) => condition.type === 'Succeeded',
  );

  if (succeededCondition?.status !== 'False') {
    // Not in error / lack information
    return null;
  }
  const isKnownReason = (reason: string): boolean => {
    // known reasons https://tekton.dev/vault/pipelines-v0.21.0/taskruns/#monitoring-execution-status
    return [
      'TaskRunCancelled',
      'TaskRunTimeout',
      'TaskRunImagePullFailed',
    ].includes(reason);
  };

  if (isKnownReason(succeededCondition?.reason)) {
    // No specific task run failure information, just print task run status
    return {
      staticMessage:
        succeededCondition.message || t('Unknown failure condition'),
      title: t('Failure on task {{taskName}} - check logs for details.', {
        taskName: taskRun.metadata.name,
      }),
    };
  }

  const containerName = taskRun.status.steps?.find(
    (step: PLRTaskRunStep) => step.terminated?.exitCode !== 0,
  )?.container;

  return taskRunSnippetMessage(
    taskRun.metadata.name,
    taskRun.status,
    containerName,
  );
};
