import { RowFilter } from '@openshift-console/dynamic-plugin-sdk';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';

export enum ListFilterId {
  Running = 'Running',
  Failed = 'Failed',
  Succeeded = 'Succeeded',
  Cancelled = 'Cancelled',
  Other = '-',
}

export const ListFilterLabels = {
  [ListFilterId.Running]: 'Running',
  [ListFilterId.Failed]: 'Failed',
  [ListFilterId.Succeeded]: 'Succeeded',
  [ListFilterId.Cancelled]: 'Cancelled',
  [ListFilterId.Other]: 'Other',
};

export enum ComputedStatus {
  Cancelling = 'Cancelling',
  Succeeded = 'Succeeded',
  Failed = 'Failed',
  Running = 'Running',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'In Progress' = 'In Progress',
  FailedToStart = 'FailedToStart',
  PipelineNotStarted = 'PipelineNotStarted',
  Skipped = 'Skipped',
  Cancelled = 'Cancelled',
  Pending = 'Pending',
  Idle = 'Idle',
  Other = '-',
}

export enum SucceedConditionReason {
  PipelineRunCancelled = 'StoppedRunFinally',
  PipelineRunStopped = 'CancelledRunFinally',
  TaskRunCancelled = 'TaskRunCancelled',
  Cancelled = 'Cancelled',
  PipelineRunStopping = 'PipelineRunStopping',
  PipelineRunPending = 'PipelineRunPending',
  TaskRunStopping = 'TaskRunStopping',
  CreateContainerConfigError = 'CreateContainerConfigError',
  ExceededNodeResources = 'ExceededNodeResources',
  ExceededResourceQuota = 'ExceededResourceQuota',
  ConditionCheckFailed = 'ConditionCheckFailed',
}

export const pipelineRunStatus = (pipelineRun): ComputedStatus => {
  const conditions = _.get(pipelineRun, ['status', 'conditions'], []);
  if (conditions.length === 0) return null;

  const succeedCondition = conditions.find((c) => c.type === 'Succeeded');
  const cancelledCondition = conditions.find((c) => c.reason === 'Cancelled');

  if (
    [
      SucceedConditionReason.PipelineRunStopped,
      SucceedConditionReason.PipelineRunCancelled,
    ].includes(pipelineRun.spec?.status) &&
    !cancelledCondition
  ) {
    return ComputedStatus.Cancelling;
  }

  if (!succeedCondition || !succeedCondition.status) {
    return null;
  }

  const status =
    succeedCondition.status === 'True'
      ? ComputedStatus.Succeeded
      : succeedCondition.status === 'False'
      ? ComputedStatus.Failed
      : ComputedStatus.Running;

  if (succeedCondition.reason && succeedCondition.reason !== status) {
    switch (succeedCondition.reason) {
      case SucceedConditionReason.PipelineRunCancelled:
      case SucceedConditionReason.TaskRunCancelled:
      case SucceedConditionReason.Cancelled:
      case SucceedConditionReason.PipelineRunStopped:
        return ComputedStatus.Cancelled;
      case SucceedConditionReason.PipelineRunStopping:
      case SucceedConditionReason.TaskRunStopping:
        return ComputedStatus.Failed;
      case SucceedConditionReason.CreateContainerConfigError:
      case SucceedConditionReason.ExceededNodeResources:
      case SucceedConditionReason.ExceededResourceQuota:
      case SucceedConditionReason.PipelineRunPending:
        return ComputedStatus.Pending;
      case SucceedConditionReason.ConditionCheckFailed:
        return ComputedStatus.Skipped;
      default:
        return status;
    }
  }
  return status;
};

const pipelineFilterReducer = (pipeline): ComputedStatus => {
  if (!pipeline.latestRun) return ComputedStatus.Other;
  return pipelineRunStatus(pipeline.latestRun) || ComputedStatus.Other;
};

export const pipelineRunFilterReducer = (pipelineRun): ComputedStatus => {
  const status = pipelineRunStatus(pipelineRun);
  return status || ComputedStatus.Other;
};

export const pipelineStatusFilter = (filters, pipeline) => {
  if (!filters || !filters.selected || !filters.selected.length) {
    return true;
  }
  const status = pipelineFilterReducer(pipeline);
  return filters.selected?.includes(status) || !_.includes(filters.all, status);
};

export const usePipelinesFilters = (): RowFilter[] => {
  const { t } = useTranslation();
  return [
    {
      filterGroupName: t('Status'),
      type: 'pipeline-status',
      reducer: pipelineFilterReducer,
      items: [
        {
          id: ListFilterId.Succeeded,
          title: ListFilterLabels[ListFilterId.Succeeded],
        },
        {
          id: ListFilterId.Running,
          title: ListFilterLabels[ListFilterId.Running],
        },
        {
          id: ListFilterId.Failed,
          title: ListFilterLabels[ListFilterId.Failed],
        },
        {
          id: ListFilterId.Cancelled,
          title: ListFilterLabels[ListFilterId.Cancelled],
        },
        { id: ListFilterId.Other, title: ListFilterLabels[ListFilterId.Other] },
      ],
      filter: pipelineStatusFilter,
    },
  ];
};
