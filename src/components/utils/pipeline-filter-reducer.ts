import * as _ from 'lodash';
import { ComputedStatus } from '../../types';
import { t } from './common-utils';

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
  PipelineRunTimeout = 'PipelineRunTimeout',
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
      case SucceedConditionReason.PipelineRunTimeout:
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

export const pipelineRunStatusTitle = (pipelineRun): string => {
  const status = pipelineRunStatus(pipelineRun);
  if (!status) return '-';
  switch (status) {
    case ComputedStatus.Cancelled:
      return t('Cancelled');
    case ComputedStatus.Failed:
      return t('Failed');
    case ComputedStatus.Succeeded:
      return t('Succeeded');
    case ComputedStatus.Pending:
      return t('Pending');
    case ComputedStatus.Running:
      return t('Running');
    case ComputedStatus.Skipped:
      return t('Skipped');
    case ComputedStatus.Cancelling:
      return t('Cancelling');
    default:
      return status;
  }
};

export const pipelineFilterReducer = (pipeline): ComputedStatus => {
  if (!pipeline.latestRun) return ComputedStatus.Other;
  return pipelineRunStatus(pipeline.latestRun) || ComputedStatus.Other;
};

export const pipelineTitleFilterReducer = (pipeline): string => {
  if (!pipeline.latestRun) return '-';
  return pipelineRunStatusTitle(pipeline.latestRun) || '-';
};

export const pipelineRunTitleFilterReducer = (pipelineRun): string => {
  const status = pipelineRunStatusTitle(pipelineRun);
  return status || '-';
};

export const pipelineStatusFilter = (filters, pipeline) => {
  if (!filters || !filters.selected || !filters.selected.length) {
    return true;
  }
  const status = pipelineFilterReducer(pipeline);
  return filters.selected?.includes(status) || !_.includes(filters.all, status);
};

export const pipelineResourceFilterReducer = (pipelineResource): string => {
  return pipelineResource.spec.type;
};

export const pipelineResourceTypeFilter = (
  filters,
  pipelineResource,
): boolean => {
  if (!filters || !filters.selected || !filters.selected.length) {
    return true;
  }
  const type = pipelineResourceFilterReducer(pipelineResource);
  return filters.selected?.includes(type) || !_.includes(filters.all, type);
};

export const taskRunFilterReducer = (taskRun): ComputedStatus => {
  const status = pipelineRunStatus(taskRun);
  return status || ComputedStatus.Other;
};

export const taskRunFilterTitleReducer = (taskRun): string => {
  const status = pipelineRunStatusTitle(taskRun);
  return status || '-';
};

export const pipelineRunFilterReducer = (pipelineRun): ComputedStatus => {
  const status = pipelineRunStatus(pipelineRun);
  return status || ComputedStatus.Other;
};

export const isPipelineRunLoadedFromTektonResults = (pipelineRun): boolean => {
  return (
    pipelineRun?.metadata?.annotations?.['resource.deleted.in.k8s'] &&
    pipelineRun?.metadata?.annotations?.['resource.loaded.from.tektonResults']
  );
};

export const pipelineRunDataSourceFilterReducer = (pipelineRun) => {
  if (isPipelineRunLoadedFromTektonResults(pipelineRun)) {
    return 'archived-data';
  } else {
    return 'cluster-data';
  }
};

export const pipelineRunDataSourceFilter = (phases, pipelineRun) => {
  if (!phases || !phases.selected || !phases.selected.length) {
    return true;
  }
  if (
    phases.selected.includes('cluster-data') &&
    !phases.selected.includes('archived-data')
  ) {
    return !isPipelineRunLoadedFromTektonResults(pipelineRun);
  }
  if (
    !phases.selected.includes('cluster-data') &&
    phases.selected.includes('archived-data')
  ) {
    return isPipelineRunLoadedFromTektonResults(pipelineRun);
  }
  return true;
};

export const pipelineRunStatusFilter = (phases, pipeline) => {
  if (!phases || !phases.selected || !phases.selected.length) {
    return true;
  }

  const status = pipelineRunFilterReducer(pipeline);

  return phases.selected?.includes(status) || !_.includes(phases.all, status);
};
