import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import { TaskRunKind } from '../../types';
import { TektonResourceLabel } from '../../consts';
import PipelineResourceStatus from '../status/PipelineResourceStatus';
import { taskRunFilterTitleReducer } from '../utils/pipeline-filter-reducer';
import { TaskRunModel } from '../../models';
import StatusPopoverContent from '../status/StatusPopoverContent';
import { getTRLogSnippet } from './taskRunLogSnippet';
import { resourcePathFromModel } from '../utils/utils';
import { useMultiClusterProxyService } from '../hooks/useMultiClusterProxyService';

type TaskRunStatusProps = {
  status: string;
  taskRun: TaskRunKind;
};
const TaskRunStatus: React.FC<TaskRunStatusProps> = ({ status, taskRun }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const {isResourceManagedByKueue} = useMultiClusterProxyService({ labels: taskRun?.metadata?.labels });
  const pipelineRunName =
    taskRun.metadata?.labels?.[TektonResourceLabel.pipelinerun];

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
        isResourceManagedByKueue={isResourceManagedByKueue}
        pipelineRunName={pipelineRunName}
      />
    </PipelineResourceStatus>
  );
};

export default TaskRunStatus;
