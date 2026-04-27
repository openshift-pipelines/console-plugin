import { Split, SplitItem, Tooltip } from '@patternfly/react-core';
import {
  getGroupVersionKindForModel,
  ResourceLink,
  Timestamp,
} from '@openshift-console/dynamic-plugin-sdk';
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
import { GetDataViewRows } from '@openshift-console/dynamic-plugin-sdk/lib/api/internal-types';
import { tableColumnInfo } from './useApprovalsColumns';
import {
  actionsCellProps,
  getNameCellProps,
} from '@openshift-console/dynamic-plugin-sdk-internal';
import { t } from '../utils/common-utils';
import { DASH } from '../../consts';

const ApprovalStatus = (statusDetailsProps) => {
  const {
    approvalTaskStatus,
    translatedApproversCount,
    approvalsReceived,
    numberOfApprovalsRequired,
  } = statusDetailsProps;
  return (
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
  );
};

export const getApprovalListPageDataViewRows: GetDataViewRows<
  ApprovalTaskKind,
  {
    pipelineRuns: PipelineRunKind[];
  }
> = (data, columns) => {
  return data.map(({ obj, rowData: { pipelineRuns } }) => {
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

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(PipelineRunModel)}
            name={pipelineRun?.metadata.name}
            namespace={namespace}
          />
        ),
        props: {
          ...getNameCellProps(`approvaltasks-list`),
          modifier: 'nowrap',
        },
      },
      [tableColumnInfo[1].id]: {
        cell: (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(ApprovalTaskModel)}
            name={name}
            namespace={namespace}
          />
        ),
        props: { modifier: 'nowrap' },
      },
      [tableColumnInfo[2].id]: {
        cell: (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(NamespaceModel)}
            name={namespace}
          />
        ),
        props: { modifier: 'nowrap' },
      },
      [tableColumnInfo[3].id]: {
        cell: (
          <ApprovalStatus
            approvalTaskStatus={approvalTaskStatus}
            translatedApproversCount={translatedApproversCount}
            approvalsReceived={approvalsReceived}
            numberOfApprovalsRequired={numberOfApprovalsRequired}
          />
        ),
        props: { modifier: 'nowrap' },
      },
      [tableColumnInfo[4].id]: {
        cell: !description ? (
          DASH
        ) : description.length > 35 ? (
          <Tooltip content={description} position="top">
            <span>{description.slice(0, 35)}...</span>
          </Tooltip>
        ) : (
          description
        ),
      },
      [tableColumnInfo[5].id]: {
        cell:
          (creationTimestamp && <Timestamp timestamp={creationTimestamp} />) ||
          DASH,
        props: { modifier: 'nowrap' },
      },
      [tableColumnInfo[6].id]: {
        cell: (
          <ApprovalTaskActionDropdown
            approvalTask={obj}
            pipelineRun={pipelineRun}
          />
        ),
        props: { ...actionsCellProps, modifier: 'nowrap' },
      },
    };

    return columns.map(({ id }) => {
      const cell = rowCells[id]?.cell;
      const props = rowCells[id]?.props;
      return {
        id,
        props,
        cell,
      };
    });
  });
};
