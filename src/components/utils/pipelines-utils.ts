import {
  GroupVersionKind,
  K8sKind,
  K8sModel,
} from '@openshift-console/dynamic-plugin-sdk';
import { ClusterTaskModel, TaskModel } from '../../models';
import { PipelineRunKind, TaskRunKind } from '../../types';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { t } from './common-utils';
import { pipelineRunStatus } from './pipeline-filter-reducer';

export enum ListFilterId {
  Running = 'Running',
  Failed = 'Failed',
  Succeeded = 'Succeeded',
  Cancelled = 'Cancelled',
  Other = '-',
}

export const ListFilterLabels = {
  [ListFilterId.Running]: t('Running'),
  [ListFilterId.Failed]: t('Failed'),
  [ListFilterId.Succeeded]: t('Succeeded'),
  [ListFilterId.Cancelled]: t('Cancelled'),
  [ListFilterId.Other]: t('Other'),
};

export const getResourceModelFromTaskKind = (kind: string): K8sKind => {
  if (kind === ClusterTaskModel.kind) {
    return ClusterTaskModel;
  }
  if (kind === TaskModel.kind || kind === undefined) {
    return TaskModel;
  }
  return null;
};

export const getModelReferenceFromTaskKind = (
  kind: string,
): GroupVersionKind => {
  const model = getResourceModelFromTaskKind(kind);
  return getReferenceForModel(model);
};

export const getDuration = (seconds: number, long?: boolean): string => {
  if (seconds === 0) {
    return t('less than a sec');
  }
  let sec = Math.round(seconds);
  let min = 0;
  let hr = 0;
  let duration = '';
  if (sec >= 60) {
    min = Math.floor(sec / 60);
    sec %= 60;
  }
  if (min >= 60) {
    hr = Math.floor(min / 60);
    min %= 60;
  }
  if (hr > 0) {
    duration += long
      ? t('{{count}} hour', {
          count: hr,
        })
      : t('{{hr}}h', { hr });
    duration += ' ';
  }
  if (min > 0) {
    duration += long
      ? t('{{count}} minute', {
          count: min,
        })
      : t('{{min}}m', { min });
    duration += ' ';
  }
  if (sec > 0) {
    duration += long
      ? t('{{count}} second', {
          count: sec,
        })
      : t('{{sec}}s', { sec });
  }

  return duration.trim();
};

export const calculateDuration = (
  startTime: string,
  endTime?: string,
  long?: boolean,
) => {
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : new Date().getTime();
  const durationInSeconds = (end - start) / 1000;
  return getDuration(durationInSeconds, long);
};

export const pipelineRunDuration = (
  run: PipelineRunKind | TaskRunKind,
): string => {
  const startTime = run?.status?.startTime ?? null;
  const completionTime = run?.status?.completionTime ?? null;

  // Duration cannot be computed if start time is missing or a completed/failed pipeline/task has no end time
  if (!startTime || (!completionTime && pipelineRunStatus(run) !== 'Running')) {
    return '-';
  }
  return calculateDuration(startTime, completionTime, true);
};

export const apiGroupForReference = (ref: GroupVersionKind) =>
  ref.split('~')[0];

export const resourcePathFromModel = (
  model: K8sModel,
  name?: string,
  namespace?: string,
) => {
  const { plural, namespaced, crd } = model;

  let url = '/k8s/';

  if (!namespaced) {
    url += 'cluster/';
  }

  if (namespaced) {
    url += namespace ? `ns/${namespace}/` : 'all-namespaces/';
  }

  if (crd) {
    url += getReferenceForModel(model);
  } else if (plural) {
    url += plural;
  }

  if (name) {
    // Some resources have a name that needs to be encoded. For instance,
    // Users can have special characters in the name like `#`.
    url += `/${encodeURIComponent(name)}`;
  }

  return url;
};
