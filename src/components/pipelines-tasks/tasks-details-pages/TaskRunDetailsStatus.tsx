import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
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
import { useMultiClusterProxyService } from '../../hooks/useMultiClusterProxyService';

export interface TaskRunDetailsStatusProps {
  taskRun: TaskRunKind;
}

const TaskRunDetailsStatus: React.FC<TaskRunDetailsStatusProps> = ({
  taskRun,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const {isResourceManagedByKueue} = useMultiClusterProxyService({ labels: taskRun?.metadata?.labels });
  const pipelineRunName =
    taskRun.metadata?.labels?.[TektonResourceLabel.pipelinerun];

  return (
    <DescriptionList>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('Status')}</DescriptionListTerm>
        <DescriptionListDescription>
          <Status
            status={taskRunFilterReducer(taskRun)}
            title={taskRunFilterTitleReducer(taskRun)}
          />
        </DescriptionListDescription>
      </DescriptionListGroup>
      {taskRun.metadata?.labels?.[TektonResourceLabel.pipelinerun] && (
        <DescriptionListGroup data-test="pipelineRun">
          <DescriptionListTerm>{t('PipelineRun')}</DescriptionListTerm>
          <DescriptionListDescription>
            <ResourceLink
              kind={getReferenceForModel(PipelineRunModel)}
              name={taskRun.metadata.labels[TektonResourceLabel.pipelinerun]}
              namespace={taskRun.metadata.namespace}
            />
          </DescriptionListDescription>
        </DescriptionListGroup>
      )}
      <DescriptionListGroup>
        <DescriptionListTerm>{t('Started')}</DescriptionListTerm>
        <DescriptionListDescription>
          <Timestamp timestamp={taskRun?.status?.startTime} />
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('Duration')}</DescriptionListTerm>
        <DescriptionListDescription>
          {pipelineRunDuration(taskRun)}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <RunDetailsErrorLog
        logDetails={getTRLogSnippet(taskRun)}
        namespace={taskRun.metadata?.namespace}
        isResourceManagedByKueue={isResourceManagedByKueue}
        pipelineRunName={pipelineRunName}
      />
      {taskRun?.status?.podName && (
        <DescriptionListGroup data-test="pod">
          <DescriptionListTerm>{t('Pod')}</DescriptionListTerm>
          <DescriptionListDescription>
            <ResourceLink
              kind={PodModel.kind}
              name={taskRun.status.podName}
              namespace={taskRun.metadata.namespace}
            />
          </DescriptionListDescription>
        </DescriptionListGroup>
      )}
      <WorkspaceResourceLinkList
        workspaces={taskRun.spec.workspaces}
        namespace={taskRun.metadata.namespace}
        ownerResourceName={taskRun.metadata.name}
        ownerResourceKind={taskRun.kind}
      />
    </DescriptionList>
  );
};

export default TaskRunDetailsStatus;
