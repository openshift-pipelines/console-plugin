import { t_chart_color_black_500 as waitColor } from '@patternfly/react-tokens/dist/js/t_chart_color_black_500';
import { t_chart_color_blue_300 as partiallyApprovedColor } from '@patternfly/react-tokens/dist/js/t_chart_color_blue_300';
import { t_chart_color_blue_400 as almostApprovedColor } from '@patternfly/react-tokens/dist/js/t_chart_color_blue_400';
import { t_chart_color_green_500 as approveColor } from '@patternfly/react-tokens/dist/js/t_chart_color_green_500';
import { t_chart_global_danger_color_100 as rejectColor } from '@patternfly/react-tokens/dist/js/t_chart_global_danger_color_100';
import { ApprovalFields, ApprovalLabels } from '../../consts';
import {
  ApprovalStatus,
  ApprovalTaskKind,
  ApproverStatusResponse,
  ComputedStatus,
  PipelineRunKind,
} from '../../types';
import { t } from './common-utils';
import { StatusMessage } from './pipeline-augment';
import { pipelineRunFilterReducer } from './pipeline-filter-reducer';

export const getApprovalStatusInfo = (status: string): StatusMessage => {
  switch (status) {
    case ApprovalStatus.Idle:
      return {
        message: t('Waiting'),
        pftoken: waitColor,
      };
    case ApprovalStatus.RequestSent:
      return {
        message: t('Pending'),
        pftoken: waitColor,
      };
    case ApprovalStatus.PartiallyApproved:
      return {
        message: t('Partially approved'),
        pftoken: partiallyApprovedColor,
      };
    case ApprovalStatus.AlmostApproved:
      return {
        message: t('Partially approved'),
        pftoken: almostApprovedColor,
      };
    case ApprovalStatus.Accepted:
      return {
        message: t('Approved'),
        pftoken: approveColor,
      };
    case ApprovalStatus.Rejected:
      return {
        message: t('Rejected'),
        pftoken: rejectColor,
      };
    case ApprovalStatus.TimedOut:
      return {
        message: t('Timed out'),
        pftoken: waitColor,
      };
    case ApprovalStatus.Unknown:
    default:
      return {
        message: t('Unknown'),
        pftoken: waitColor,
      };
  }
};

export const getApprovalStatus = (
  approvalTask: ApprovalTaskKind,
  pipelineRun: PipelineRunKind,
): ApprovalStatus => {
  const pipelineRunStatus =
    pipelineRun && pipelineRunFilterReducer(pipelineRun);

  const approvalsRequired = approvalTask?.spec?.numberOfApprovalsRequired;
  const currentApprovals = approvalTask?.status?.approvalsReceived;
  const approvalState = approvalTask?.status?.state;
  const approvalPercentage = (currentApprovals / approvalsRequired) * 100;

  if (pipelineRunStatus === ComputedStatus.Running) {
    if (!approvalState) {
      return ApprovalStatus.Idle;
    }
    if (approvalState === ApprovalStatus.RequestSent) {
      if (!approvalPercentage) {
        return ApprovalStatus.RequestSent;
      }
      return approvalPercentage >= 75
        ? ApprovalStatus.AlmostApproved
        : ApprovalStatus.PartiallyApproved;
    }
  }

  if (approvalState === ApproverStatusResponse.Accepted) {
    return ApprovalStatus.Accepted;
  }
  if (approvalState === ApproverStatusResponse.Rejected) {
    return ApprovalStatus.Rejected;
  }

  if (approvalState === ApproverStatusResponse.Timedout) {
    return ApprovalStatus.TimedOut;
  }

  return ApprovalStatus.Unknown;
};

export const getPipelineRunOfApprovalTask = (
  pipelineRuns: PipelineRunKind[],
  approvalTask: ApprovalTaskKind,
): PipelineRunKind => {
  if (!pipelineRuns || !pipelineRuns.length) {
    return null;
  }

  return (
    pipelineRuns?.find(
      (pr) =>
        pr.metadata.name ===
        approvalTask?.metadata?.labels?.[
          ApprovalLabels[ApprovalFields.PIPELINE_RUN]
        ],
    ) || null
  );
};
