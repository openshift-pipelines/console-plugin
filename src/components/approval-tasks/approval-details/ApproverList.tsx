import * as React from 'react';
import cx from 'classnames';
import { useTranslation } from 'react-i18next';
import { Label, LabelGroup } from '@patternfly/react-core';
import {
  ApprovalTaskKind,
  ApproverInput,
  ApprovalStatus,
} from '../../../types';
import { ApprovalStatusIcon } from '../../pipeline-topology/StatusIcons';

import './ApproverList.scss';
import { Approver } from '../../../types/approver';

export interface ApproverListProps {
  obj: ApprovalTaskKind;
}

export interface ApproverBadgeProps {
  approver: Approver;
  status: ApproverInput;
}

const ApproverBadge: React.FC<ApproverBadgeProps> = ({ approver, status }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const badgeClass = cx({
    'pipelines-approval-approver__wait': status === ApprovalStatus.RequestSent,
    'pipelines-approval-approver__approved':
      status !== ApprovalStatus.RequestSent,
  });

  const color =
    status === ApprovalStatus.RequestSent
      ? 'orange'
      : status === ApprovalStatus.Accepted
      ? 'green'
      : 'red';

  return (
    <Label
      className="pipelines-approval-status-badge"
      color={color}
      icon={
        <div className={badgeClass}>
          <svg width={30} height={30} viewBox="-12 -5 30 30">
            <ApprovalStatusIcon status={status} />
          </svg>
        </div>
      }
    >
      {approver.type === 'Group'
        ? t('Group') + ': ' + approver.name.replace('group:', '')
        : t('User') + ': ' + approver.name}
    </Label>
  );
};

const ApproverListSection: React.FC<ApproverListProps> = ({ obj }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const {
    spec: { approvers },
  } = obj;
  if (!approvers || approvers?.length === 0) {
    return <p>{t('No approvers')}</p>;
  }

  return (
    <LabelGroup
      defaultIsOpen
      numLabels={10}
      className="pipelines-approval-approver-list"
    >
      {approvers?.map((approver, idx) => (
        <ApproverBadge
          approver={approver}
          status={approver.input}
          key={`approver-${idx.toString()}`}
        />
      ))}
    </LabelGroup>
  );
};

export default ApproverListSection;
