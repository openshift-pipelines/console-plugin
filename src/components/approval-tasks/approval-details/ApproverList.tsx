import * as React from 'react';
import cx from 'classnames';
import { useTranslation } from 'react-i18next';
import { Label, LabelGroup } from '@patternfly/react-core';
import {
  ApprovalTaskKind,
  ApproverResponse,
  ApproverStatusResponse,
} from '../../../types';
import { ApprovalStatusIcon } from '../../pipeline-topology/StatusIcons';

import './ApproverList.scss';

export interface ApproverListProps {
  obj: ApprovalTaskKind;
}

export interface ApproverBadgeProps {
  approver: string;
  status: ApproverResponse;
}

const ApproverBadge: React.FC<ApproverBadgeProps> = ({ approver, status }) => {
  const badgeClass = cx({
    'odc-pl-approval-approver__wait': status === ApproverStatusResponse.Pending,
    'odc-pl-approval-approver__approved':
      status !== ApproverStatusResponse.Pending,
  });

  const color =
    status === ApproverStatusResponse.Pending
      ? 'orange'
      : status === ApproverStatusResponse.Accepted
      ? 'green'
      : 'red';

  return (
    <Label
      className="odc-pl-approval-status-badge"
      color={color}
      icon={
        <div className={badgeClass}>
          <svg width={30} height={30} viewBox="-12 -5 30 30">
            <ApprovalStatusIcon status={status} />
          </svg>
        </div>
      }
    >
      {approver}
    </Label>
  );
};

const ApproverListSection: React.FC<ApproverListProps> = ({ obj }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const {
    status: { approvers, approversResponse },
  } = obj;
  if (!approvers || approvers?.length === 0) {
    return <p>{t('No approvers')}</p>;
  }

  const getApprovalStatusforApprovers = (
    approver: string,
  ): ApproverResponse => {
    return (
      approversResponse?.find(
        (approvalStatus) => approvalStatus.name === approver,
      )?.response ?? ApproverStatusResponse.Pending
    );
  };

  return (
    <LabelGroup
      defaultIsOpen
      numLabels={10}
      className="odc-pl-approval-approver-list"
    >
      {approvers?.map((approver, idx) => (
        <ApproverBadge
          approver={approver}
          status={getApprovalStatusforApprovers(approver)}
          key={`approver-${idx.toString()}`}
        />
      ))}
    </LabelGroup>
  );
};

export default ApproverListSection;
