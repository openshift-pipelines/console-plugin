import { TableColumn } from '@openshift-console/dynamic-plugin-sdk';
import { SortByDirection } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { LocalQueueKind } from '../../types';
import { getLastUpdatedTimestamp } from './utils';

export const localQueueColumnIds = {
  name: 'name',
  admittedWorkloads: 'admitted-workloads',
  pendingWorkloads: 'pending-workloads',
  lastUpdated: 'last-updated',
  actions: 'actions',
};

const useLocalQueuesColumns = (): TableColumn<LocalQueueKind>[] => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  return [
    {
      id: localQueueColumnIds.name,
      title: t('Name'),
      sort: 'metadata.name',
      props: { width: 35, isStickyColumn: true, modifier: 'nowrap' },
    },
    {
      id: localQueueColumnIds.admittedWorkloads,
      title: t('Admitted Workloads'),
      sort: 'status.admittedWorkloads',
      props: { width: 20, modifier: 'nowrap' },
    },
    {
      id: localQueueColumnIds.pendingWorkloads,
      title: t('Pending Workloads'),
      sort: 'status.pendingWorkloads',
      props: { width: 20, modifier: 'nowrap' },
    },
    {
      id: localQueueColumnIds.lastUpdated,
      title: t('Last Updated'),
      sort: (data: LocalQueueKind[], direction: SortByDirection) =>
        [...data].sort((a, b) => {
          const aTimestamp = Date.parse(getLastUpdatedTimestamp(a)) || 0;
          const bTimestamp = Date.parse(getLastUpdatedTimestamp(b)) || 0;
          const comparison = aTimestamp - bTimestamp;

          return direction === SortByDirection.asc ? comparison : -comparison;
        }),
      props: { width: 20, modifier: 'nowrap' },
    },
    {
      id: localQueueColumnIds.actions,
      title: '',
      props: { width: 5 },
    },
  ];
};

export default useLocalQueuesColumns;
