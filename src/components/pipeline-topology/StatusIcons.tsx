import * as React from 'react';
import * as cx from 'classnames';
import { AngleDoubleRightIcon } from '@patternfly/react-icons/dist/esm/icons/angle-double-right-icon';
import { CheckCircleIcon } from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import { CircleIcon } from '@patternfly/react-icons/dist/esm/icons/circle-icon';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import { HourglassHalfIcon } from '@patternfly/react-icons/dist/esm/icons/hourglass-half-icon';
import NewProcessIcon from '@patternfly/react-icons/dist/esm/icons/new-process-icon';
import { QuestionCircleIcon } from '@patternfly/react-icons/dist/esm/icons/question-circle-icon';
import { ResourcesAlmostEmptyIcon } from '@patternfly/react-icons/dist/esm/icons/resources-almost-empty-icon';
import { ResourcesAlmostFullIcon } from '@patternfly/react-icons/dist/esm/icons/resources-almost-full-icon';
import { ResourcesEmptyIcon } from '@patternfly/react-icons/dist/esm/icons/resources-empty-icon';
import { SyncAltIcon } from '@patternfly/react-icons/dist/esm/icons/sync-alt-icon';
import { ApprovalStatus, ApproverStatusResponse } from '../../types';
import { getRunStatusColor } from '../utils/pipeline-augment';
import { t } from '../utils/common-utils';
import { ComputedStatus } from '../pipelines-list/usePipelinesFilters';
import { YellowExclamationTriangleIcon } from '@openshift-console/dynamic-plugin-sdk';
import TimeoutApprovalTaskIcon from '../../images/TimeoutApprovalTaskIcon';
import FailedApprovalTaskIcon from '../../images/FailedApprovalTaskIcon';
import SuccessApprovalTaskIcon from '../../images/SuccessApprovalTaskIcon';

interface StatusIconProps {
  status: string;
  height?: number;
  width?: number;
  disableSpin?: boolean;
}

export const StatusIcon: React.FC<StatusIconProps> = ({
  status,
  disableSpin,
  ...props
}) => {
  switch (status) {
    case ComputedStatus['In Progress']:
    case ComputedStatus.Running:
      return (
        <SyncAltIcon {...props} className={cx({ 'fa-spin': !disableSpin })} />
      );

    case ComputedStatus.Succeeded:
      return <CheckCircleIcon {...props} />;

    case ComputedStatus.Failed:
      return <ExclamationCircleIcon {...props} />;

    case ComputedStatus.Idle:
    case ComputedStatus.Pending:
      return <HourglassHalfIcon {...props} />;

    case ComputedStatus.Cancelled:
      return <YellowExclamationTriangleIcon {...props} />;

    case ComputedStatus.Skipped:
      return <AngleDoubleRightIcon {...props} />;

    default:
      return <CircleIcon {...props} />;
  }
};

export const ApprovalStatusIcon: React.FC<StatusIconProps> = ({
  status,
  ...others
}) => {
  switch (status) {
    case ApprovalStatus.Idle:
      return <NewProcessIcon {...others} />;
    case ApprovalStatus.RequestSent:
    case ApproverStatusResponse.Pending:
      return <ResourcesEmptyIcon {...others} />;
    case ApprovalStatus.PartiallyApproved:
      return <ResourcesAlmostEmptyIcon {...others} />;
    case ApprovalStatus.AlmostApproved:
      return <ResourcesAlmostFullIcon {...others} />;
    case ApprovalStatus.Accepted:
    case ApproverStatusResponse.Accepted:
      return <SuccessApprovalTaskIcon {...others} />;
    case ApprovalStatus.Rejected:
    case ApproverStatusResponse.Rejected:
      return <FailedApprovalTaskIcon {...others} />;
    case ApprovalStatus.TimedOut:
      return <TimeoutApprovalTaskIcon {...others} />;
    case ApprovalStatus.Unknown:
    default:
      return <QuestionCircleIcon {...others} />;
  }
};

export const ColoredStatusIcon: React.FC<StatusIconProps> = ({
  status,
  ...others
}) => {
  return (
    <div
      style={{
        color: status
          ? getRunStatusColor(status, t).pftoken.value
          : getRunStatusColor(ComputedStatus.Cancelled, t).pftoken.value,
      }}
    >
      <StatusIcon status={status} {...others} />
    </div>
  );
};
