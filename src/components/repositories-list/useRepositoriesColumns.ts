import {
  K8sResourceCommon,
  TableColumn,
} from '@openshift-console/dynamic-plugin-sdk';
import { useTranslation } from 'react-i18next';
const useRepositoriesColumns = (
  namespace,
): TableColumn<K8sResourceCommon>[] => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const columns = [
    {
      id: 'name',
      title: t('Name'),
      sort: 'metadata.name',
      props: { width: 15, isStickyColumn: true, modifier: 'nowrap' },
    },
    ...(!namespace
      ? [
          {
            id: 'namespace',
            title: t('Namespace'),
            sort: 'metadata.namespace',
            props: { width: 10, modifier: 'nowrap' },
          },
        ]
      : []),
    {
      id: 'event-type',
      title: t('Event type'),
      sort: 'spec.event_type',
      props: { width: 5, modifier: 'nowrap' },
    },
    {
      id: 'last-run',
      title: t('Last run'),
      props: { width: 15, modifier: 'nowrap' },
    },
    {
      id: 'task-status',
      title: t('Task status'),
      props: { width: 15, modifier: 'nowrap' },
    },
    {
      id: 'last-run-status',
      title: t('Last run status'),
      props: { width: 10, modifier: 'nowrap' },
    },
    {
      id: 'last-runtime',
      title: t('Last run time'),
      props: { width: 15, modifier: 'nowrap' },
    },
    {
      id: 'last-run-duration',
      title: t('Last run duration'),
      props: { width: 10, modifier: 'nowrap' },
    },
    {
      id: 'kebab-menu',
      title: '',
      props: { width: 5 },
    },
  ];
  return columns;
};

export default useRepositoriesColumns;
