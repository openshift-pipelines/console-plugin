import * as React from 'react';
import { Split, SplitItem, Tooltip } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import {
  getGroupVersionKindForModel,
  RowProps,
  ResourceLink,
  TableData,
  Timestamp,
} from '@openshift-console/dynamic-plugin-sdk';
import { tableColumnClasses } from './approval-table';
import { ApprovalTaskKind } from '../../types';
import {
  ApprovalTaskModel,
  NamespaceModel,
  PipelineRunModel,
} from '../../models';
import {
  getApprovalStatus,
  getApprovalStatusInfo,
  getPipelineRunOfApprovalTask,
} from '../utils/pipeline-approval-utils';
import { ApprovalStatusIcon } from '../pipeline-topology/StatusIcons';
import { PipelineRunKind } from '../../types';
import ApprovalTaskActionDropdown from './ApprovalTaskActionDropdown';

import './ApprovalRow.scss';

const ApprovalRow: React.FC<
  RowProps<
    ApprovalTaskKind,
    {
      pipelineRuns: PipelineRunKind[];
    }
  >
> = ({ obj, activeColumnIDs, rowData: { pipelineRuns } }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const {
    metadata: { name, namespace, creationTimestamp },
    spec: { description, numberOfApprovalsRequired },
    status: { approvers, approvalsReceived },
  } = obj;

  const translatedApproversCount = t('{{assignees}} Assigned', {
    assignees: approvers?.length || 0,
  });
  const pipelineRun = getPipelineRunOfApprovalTask(pipelineRuns, obj);

  const approvalTaskStatus = getApprovalStatus(obj, pipelineRun);

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
        className={tableColumnClasses.namespace}
        id="namespace"
        activeColumnIDs={activeColumnIDs}
      >
        <ResourceLink
          groupVersionKind={getGroupVersionKindForModel(NamespaceModel)}
          name={namespace}
        />
      </TableData>
      <TableData
        className={tableColumnClasses.status}
        id="status"
        activeColumnIDs={activeColumnIDs}
      >
        <Split className="pipelines-approval-status-icon">
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
              <span className="pipelines-approval-status-info">{`(${
                approvalsReceived || 0
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
          <Tooltip content={description} position="top">
            <span>{description.slice(0, 35)}...</span>
          </Tooltip>
        ) : (
          description
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
        <ApprovalTaskActionDropdown
          approvalTask={obj}
          pipelineRun={pipelineRun}
        />
      </TableData>
    </>
  );
};

export default ApprovalRow;
