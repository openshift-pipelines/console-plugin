import { TableColumn } from '@openshift-console/dynamic-plugin-sdk';
import { useTranslation } from 'react-i18next';
import { ClusterQueueKind } from '../../types';

export const clusterQueueColumnIds = {
  name: 'name',
  cohort: 'cohort',
  strategy: 'strategy',
  quota: 'quota',
  workloads: 'workloads',
  status: 'status',
  actions: 'actions',
};

const useClusterQueuesColumns = (): TableColumn<ClusterQueueKind>[] => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  return [
    {
      id: clusterQueueColumnIds.name,
      title: t('Name'),
      sort: 'metadata.name',
      props: { width: 15, isStickyColumn: true, modifier: 'nowrap' },
    },
    {
      id: clusterQueueColumnIds.cohort,
      title: t('Cohort'),
      sort: 'spec.cohortName',
      props: { width: 10, modifier: 'nowrap' },
    },
    {
      id: clusterQueueColumnIds.strategy,
      title: t('Queueing strategy'),
      sort: 'spec.queueingStrategy',
      props: { width: 15, modifier: 'nowrap' },
    },
    {
      id: clusterQueueColumnIds.quota,
      title: t('Nominal quota'),
      props: { width: 20 },
    },
    {
      id: clusterQueueColumnIds.workloads,
      title: t('Workloads'),
      props: { width: 15, modifier: 'nowrap' },
    },
    {
      id: clusterQueueColumnIds.status,
      title: t('Status'),
      props: { width: 10, modifier: 'nowrap' },
    },
    {
      id: clusterQueueColumnIds.actions,
      title: '',
      props: { width: 5 },
    },
  ];
};

export default useClusterQueuesColumns;
