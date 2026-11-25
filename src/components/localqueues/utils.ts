import { LocalQueueKind } from '../../types';

export const getLastUpdatedTimestamp = (queue: LocalQueueKind): string => {
  let lastUpdatedTimestamp = queue.metadata.creationTimestamp ?? '';

  queue.metadata.managedFields?.forEach(({ time }) => {
    if (time && time > lastUpdatedTimestamp) {
      lastUpdatedTimestamp = time;
    }
  });

  return lastUpdatedTimestamp;
};
