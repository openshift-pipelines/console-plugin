import * as React from 'react';
import { Split, SplitItem, Tooltip } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import {
  getGroupVersionKindForModel,
  RowProps,
  ResourceLink,
  TableData,
  Timestamp,
  UserInfo,
} from '@openshift-console/dynamic-plugin-sdk';
import { tableColumnClasses } from './approval-table';
import './ApprovalRow.scss';
import { ApprovalTaskKind } from '../../types';
import { ApprovalTaskModel, PipelineRunModel } from '../../models';
import {
  getApprovalStatus,
  getApprovalStatusInfo,
  getPipelineRunOfApprovalTask,
} from '../utils/pipeline-approval-utils';
import { ApprovalStatusIcon } from '../pipeline-topology/StatusIcons';
import { CustomRunKind, PipelineRunKind } from '../../types';
import ApprovalTasksKebab from './ApprovalTasksKebab';
import { SDKStoreState } from '@openshift-console/dynamic-plugin-sdk/lib/app/redux-types';

const ApprovalRow: React.FC<
  RowProps<
    ApprovalTaskKind,
    {
      pipelineRuns: PipelineRunKind[];
      customRuns: CustomRunKind[];
    }
  >
> = ({ obj, activeColumnIDs, rowData: { pipelineRuns, customRuns } }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const {
    metadata: { name, namespace, creationTimestamp },
    spec: { description, numberOfApprovalsRequired },
    status: { approvers, approversResponse },
  } = obj;

  const [user, setUser] = React.useState<UserInfo>(
    useSelector((state: SDKStoreState) => state.sdkCore.user),
  );
  if (user.username === 'kube:admin') {
    setUser({ ...user, username: 'kubernetes-admin' });
  }

  const translatedDescription = t('{{description}}', {
    description,
  });
  const translatedApproversCount = t('{{assignees}} Assigned', {
    assignees: approvers?.length || 0,
  });
  const pipelineRun = getPipelineRunOfApprovalTask(pipelineRuns, obj);
  const customRun = customRuns?.find((cr) => cr?.metadata?.name === name);

  const approvalTaskStatus = getApprovalStatus(obj, customRun, pipelineRun);

  return (
    <>
      <TableData
        className={tableColumnClasses.plrName}
        id="plrName"
        activeColumnIDs={activeColumnIDs}
      >
        <ResourceLink
          groupVersionKind={getGroupVersionKindForModel(PipelineRunModel)}
          name={pipelineRun?.metadata.name}
          namespace={namespace}
        />
      </TableData>
      <TableData
        className={tableColumnClasses.taskRunName}
        id="taskRunName"
        activeColumnIDs={activeColumnIDs}
      >
        <ResourceLink
          groupVersionKind={getGroupVersionKindForModel(ApprovalTaskModel)}
          name={name}
          namespace={namespace}
        />
      </TableData>
      <TableData
        className={tableColumnClasses.status}
        id="status"
        activeColumnIDs={activeColumnIDs}
      >
        <Split className="odc-pl-approval-status-icon">
          <SplitItem>
            <svg
              width={30}
              height={30}
              viewBox="-10 -2 30 30"
              style={{
                color: getApprovalStatusInfo(approvalTaskStatus).pftoken.value,
              }}
            >
              <ApprovalStatusIcon status={approvalTaskStatus} />
            </svg>
          </SplitItem>
          <SplitItem isFilled className="co-resource-item">
            {getApprovalStatusInfo(approvalTaskStatus).message}{' '}
            <Tooltip content={translatedApproversCount} position="right">
              <span className="odc-pl-approval-status-info">{`(${
                approversResponse?.length || 0
              }/${numberOfApprovalsRequired || 0})`}</span>
            </Tooltip>
          </SplitItem>
        </Split>
      </TableData>
      <TableData
        className={tableColumnClasses.description}
        id="description"
        activeColumnIDs={activeColumnIDs}
      >
        {!description ? (
          '-'
        ) : description.length > 35 ? (
          <Tooltip content={translatedDescription}>
            <span>{translatedDescription.slice(0, 35)}...</span>
          </Tooltip>
        ) : (
          translatedDescription
        )}
      </TableData>
      <TableData
        className={tableColumnClasses.startTime}
        id="startTime"
        activeColumnIDs={activeColumnIDs}
      >
        {(creationTimestamp && <Timestamp timestamp={creationTimestamp} />) ||
          '-'}
      </TableData>
      <TableData
        className={tableColumnClasses.actions}
        id="kebab-menu"
        activeColumnIDs={activeColumnIDs}
      >
        <ApprovalTasksKebab
          obj={obj}
          pipelineRun={pipelineRun}
          username={user.username}
        />
      </TableData>
    </>
  );
};

export default ApprovalRow;
