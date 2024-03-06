import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { TaskRunKind } from '../../types';
import PipelineResourceStatus from '../status/PipelineResourceStatus';
import { taskRunFilterTitleReducer } from '../utils/pipeline-filter-reducer';
import { TaskRunModel } from '../../models';
import { resourcePathFromModel } from '../utils/pipelines-utils';
import StatusPopoverContent from '../status/StatusPopoverContent';
import { getTRLogSnippet } from './taskRunLogSnippet';

type TaskRunStatusProps = {
  status: string;
  taskRun: TaskRunKind;
};
const TaskRunStatus: React.FC<TaskRunStatusProps> = ({ status, taskRun }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  return (
    <PipelineResourceStatus
      status={status}
      title={taskRunFilterTitleReducer(taskRun)}
    >
      <StatusPopoverContent
        logDetails={getTRLogSnippet(taskRun)}
        namespace={taskRun.metadata.namespace}
        link={
          <Link
            to={`${resourcePathFromModel(
              TaskRunModel,
              taskRun.metadata.name,
              taskRun.metadata.namespace,
            )}/logs`}
          >
            {t('View logs')}
          </Link>
        }
      />
    </PipelineResourceStatus>
  );
};

export default TaskRunStatus;
