import * as React from 'react';
import { useTranslation } from 'react-i18next';

import {
  taskRunFilterReducer,
  taskRunFilterTitleReducer,
} from '../../utils/pipeline-filter-reducer';
import { TaskRunKind } from '../../../types';
import { TektonResourceLabel } from '../../../consts';
import { ResourceLink, Timestamp } from '@openshift-console/dynamic-plugin-sdk';
import { getReferenceForModel } from '../../pipelines-overview/utils';
import { PipelineRunModel, PodModel } from '../../../models';
import { pipelineRunDuration } from '../../../components/utils/pipeline-utils';
import RunDetailsErrorLog from '../../../components/logs/RunDetailsErrorLog';
import { getTRLogSnippet } from '../taskRunLogSnippet';
import Status from '../../status/Status';
import WorkspaceResourceLinkList from '../../workspaces/WorkspaceResourceLinkList';

export interface TaskRunDetailsStatusProps {
  taskRun: TaskRunKind;
}

const TaskRunDetailsStatus: React.FC<TaskRunDetailsStatusProps> = ({
  taskRun,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  return (
    <>
      <dl>
        <dt>{t('Status')}</dt>
        <dd>
          <Status
            status={taskRunFilterReducer(taskRun)}
            title={taskRunFilterTitleReducer(taskRun)}
          />
        </dd>
      </dl>
      {taskRun.metadata?.labels?.[TektonResourceLabel.pipelinerun] && (
        <dl data-test="pipelineRun">
          <dt>{t('PipelineRun')}</dt>
          <dd>
            <ResourceLink
              kind={getReferenceForModel(PipelineRunModel)}
              name={taskRun.metadata.labels[TektonResourceLabel.pipelinerun]}
              namespace={taskRun.metadata.namespace}
            />
          </dd>
        </dl>
      )}
      <dl>
        <dt>{t('Started')}</dt>
        <dd>
          <Timestamp timestamp={taskRun?.status?.startTime} />
        </dd>
      </dl>
      <dl>
        <dt>{t('Duration')}</dt>
        <dd>{pipelineRunDuration(taskRun)}</dd>
      </dl>
      <RunDetailsErrorLog
        logDetails={getTRLogSnippet(taskRun)}
        namespace={taskRun.metadata?.namespace}
      />
      {taskRun?.status?.podName && (
        <dl data-test="pod">
          <dt>{t('Pod')}</dt>
          <dd>
            <ResourceLink
              kind={PodModel.kind}
              name={taskRun.status.podName}
              namespace={taskRun.metadata.namespace}
            />
          </dd>
        </dl>
      )}
      <WorkspaceResourceLinkList
        workspaces={taskRun.spec.workspaces}
        namespace={taskRun.metadata.namespace}
        ownerResourceName={taskRun.metadata.name}
        ownerResourceKind={taskRun.kind}
      />
    </>
  );
};

export default TaskRunDetailsStatus;
