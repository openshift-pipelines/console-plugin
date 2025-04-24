import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import { PipelineRunKind, TaskRunKind } from '../../../types';
import { PipelineBars, PipelineBarsForTaskRunsStatus } from './PipelineBars';
import { LoadingInline } from '../../Loading';
import { PipelineRunModel } from '../../../models';
import { getReferenceForModel } from '../../pipelines-overview/utils';
import { TaskStatus } from '../../utils/pipeline-augment';

export interface LinkedPipelineRunTaskStatusProps {
  pipelineRun: PipelineRunKind;
  taskRuns: TaskRunKind[];
  taskRunsLoaded: boolean;
  taskRunStatusObj?: TaskStatus;
}

/**
 * Will attempt to render a link to the log file associated with the pipelineRun if it has the data.
 * If it does not, it'll just render the pipeline status.
 */
const LinkedPipelineRunTaskStatus: React.FC<
  LinkedPipelineRunTaskStatusProps
> = ({ pipelineRun, taskRuns, taskRunsLoaded, taskRunStatusObj }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const pipelineStatus =
    taskRunStatusObj &&
    Object.values(taskRunStatusObj)?.every((value) => value === 0) ? (
      <>{'-'}</>
    ) : taskRunStatusObj ? (
      <PipelineBarsForTaskRunsStatus taskRunStatusObj={taskRunStatusObj} />
    ) : taskRunsLoaded && taskRuns?.length > 0 ? (
      <PipelineBars
        key={pipelineRun.metadata?.name}
        pipelinerun={pipelineRun}
        taskRuns={taskRuns}
      />
    ) : taskRunsLoaded && taskRuns?.length === 0 && !taskRunStatusObj ? (
      <>{'-'}</>
    ) : (
      <LoadingInline />
    );

  if (pipelineRun.metadata?.name && pipelineRun.metadata?.namespace) {
    return (
      <Link
        to={`/k8s/ns/${pipelineRun.metadata.namespace}/${getReferenceForModel(
          PipelineRunModel,
        )}/${pipelineRun.metadata.name}/logs`}
        role="button"
        aria-label={t('View logs')}
      >
        {pipelineStatus}
      </Link>
    );
  }

  return pipelineStatus;
};

export default LinkedPipelineRunTaskStatus;
