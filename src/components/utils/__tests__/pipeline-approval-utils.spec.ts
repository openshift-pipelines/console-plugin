import { ApprovalFields, ApprovalLabels } from '../../../consts';
import { ApprovalStatus, PipelineRunKind } from '../../../types';
import { t } from '../common-utils';
import {
  getApprovalStatus,
  getApprovalStatusInfo,
  getPipelineRunOfApprovalTask,
} from '../pipeline-approval-utils';
import { mockApprovalStatus } from './pipeline-approval-data';

describe('Get Approval Status', () => {
  it('should return Idle status when pipeline run is running but approvaltask is not yet created', () => {
    const result = getApprovalStatus(null, mockApprovalStatus.Idle.PipelineRun);

    expect(result).toBe(ApprovalStatus.Idle);
  });

  it('should return Pending status when pipeline run is running and approval state is set to pending', () => {
    const result = getApprovalStatus(
      mockApprovalStatus.Pending.ApprovalTask,
      mockApprovalStatus.Pending.PipelineRun,
    );

    expect(result).toBe(ApprovalStatus.RequestSent);
  });

  it('should return PartiallyApproved status when pipeline run is running and approvaltask has been approved by less than 75% of the approvers', () => {
    const result = getApprovalStatus(
      mockApprovalStatus.PartiallyApproved.ApprovalTask,
      mockApprovalStatus.PartiallyApproved.PipelineRun,
    );

    expect(result).toBe(ApprovalStatus.PartiallyApproved);
  });

  it('should return AlmostApproved status when pipeline run is running and approvaltask has been approved by greater than or equal to 75% of the approvers', () => {
    const result = getApprovalStatus(
      mockApprovalStatus.AlmostApproved.ApprovalTask,
      mockApprovalStatus.AlmostApproved.PipelineRun,
    );

    expect(result).toBe(ApprovalStatus.AlmostApproved);
  });

  it('should return Rejected status when pipeline run is running and approval state is set to rejected', () => {
    const result = getApprovalStatus(
      mockApprovalStatus.Rejected.ApprovalTask,
      mockApprovalStatus.Rejected.PipelineRun,
    );

    expect(result).toBe(ApprovalStatus.Rejected);
  });

  it('should return Accepted status when pipeline run is running and approval state is set to accepted', () => {
    const result = getApprovalStatus(
      mockApprovalStatus.Approved.ApprovalTask,
      mockApprovalStatus.Approved.PipelineRun,
    );

    expect(result).toBe(ApprovalStatus.Accepted);
  });

  it('should return TimedOut status when pipeline run is running and approval state is set to timed out', () => {
    const result = getApprovalStatus(
      mockApprovalStatus.TimedOut.ApprovalTask,
      mockApprovalStatus.TimedOut.PipelineRun,
    );

    expect(result).toBe(ApprovalStatus.TimedOut);
  });

  it('should return unknown status when approval state is not a standard one', () => {
    const result = getApprovalStatus(
      mockApprovalStatus.Unknown.ApprovalTask,
      mockApprovalStatus.Unknown.PipelineRun,
    );

    expect(result).toBe(ApprovalStatus.Unknown);
  });
});

describe('Get PipelineRun of ApprovalTask', () => {
  it('should return the correct pipeline run when given a valid approval task and pipeline runs', () => {
    const pipelineRuns = [
      { metadata: { name: 'pipeline-run-1' } },
      { metadata: { name: 'pipeline-run-2' } },
      { metadata: { name: 'pipeline-run-3' } },
    ];
    const approvalTask = {
      metadata: {
        labels: {
          [ApprovalLabels[ApprovalFields.PIPELINE_RUN]]: 'pipeline-run-2',
        },
      },
    };

    const result = getPipelineRunOfApprovalTask(
      pipelineRuns as PipelineRunKind[],
      approvalTask,
    );

    expect(result).toEqual(pipelineRuns[1]);
  });

  it('should return null when given an invalid approval task and pipeline runs', () => {
    const pipelineRuns = [
      { metadata: { name: 'pipeline-run-1' } },
      { metadata: { name: 'pipeline-run-2' } },
      { metadata: { name: 'pipeline-run-3' } },
    ];
    const approvalTask = {
      metadata: {
        labels: {
          [ApprovalLabels[ApprovalFields.PIPELINE_RUN]]: 'pipeline-run-4',
        },
      },
    };

    const result = getPipelineRunOfApprovalTask(
      pipelineRuns as PipelineRunKind[],
      approvalTask,
    );

    expect(result).toBeNull();
  });

  it('should return null when given an empty pipeline runs array', () => {
    const pipelineRuns = [];
    const approvalTask = {
      metadata: {
        labels: {
          [ApprovalLabels[ApprovalFields.PIPELINE_RUN]]: 'pipeline-run-1',
        },
      },
    };

    const result = getPipelineRunOfApprovalTask(
      pipelineRuns as PipelineRunKind[],
      approvalTask,
    );

    expect(result).toBeNull();
  });
});

describe('Get Approval Status Info', () => {
  it('should return the correct status message and color for Idle status', () => {
    const status = ApprovalStatus.Idle;
    const result = getApprovalStatusInfo(status);

    expect(result.message).toEqual(t('Waiting'));
  });

  it('should return the correct status message and color for RequestSent status', () => {
    const status = ApprovalStatus.RequestSent;
    const result = getApprovalStatusInfo(status);

    expect(result.message).toEqual(t('Pending'));
  });

  it('should return the correct status message and color for PartiallyApproved status', () => {
    const status = ApprovalStatus.PartiallyApproved;
    const result = getApprovalStatusInfo(status);

    expect(result.message).toEqual(t('Partially approved'));
  });

  it('should return the correct status message and color for AlmostApproved status', () => {
    const status = ApprovalStatus.AlmostApproved;
    const result = getApprovalStatusInfo(status);

    expect(result.message).toEqual(t('Partially approved'));
  });

  it('should return the correct status message and color for Accepted status', () => {
    const status = ApprovalStatus.Accepted;
    const result = getApprovalStatusInfo(status);

    expect(result.message).toEqual(t('Approved'));
  });

  it('should return the correct status message and color for Rejected status', () => {
    const status = ApprovalStatus.Rejected;
    const result = getApprovalStatusInfo(status);

    expect(result.message).toEqual(t('Rejected'));
  });

  it('should return the correct status message and color for TimedOut status', () => {
    const status = ApprovalStatus.TimedOut;
    const result = getApprovalStatusInfo(status);

    expect(result.message).toEqual(t('Timed out'));
  });

  it('should return the correct status message and color for Unknown status', () => {
    const status = ApprovalStatus.Unknown;
    const result = getApprovalStatusInfo(status);

    expect(result.message).toEqual(t('Unknown'));
  });
});
