import {
  K8sResourceCommon,
  TableColumn,
} from '@openshift-console/dynamic-plugin-sdk';
import { useTranslation } from 'react-i18next';

export const tableColumnInfo = [
  {
    id: 'name',
    classNames: 'pf-v6-u-w-16-on-xl pf-v6-u-w-25-on-lg pf-v6-u-w-33-on-xs',
  },
  { id: 'namespace', classNames: 'pf-v6-u-w-8-on-xl pf-v6-u-w-16-on-xs' },
  {
    id: 'last-run',
    classNames: 'pf-v6-u-w-16-on-xl pf-v6-u-w-25-on-lg pf-v6-u-w-33-on-xs',
  },
  { id: 'task-run', classNames: 'pf-v6-m-hidden pf-m-visible-on-lg' },
  { id: 'status', classNames: 'pf-v6-m-hidden pf-m-visible-on-xl' },
  { id: 'last-run-time', classNames: 'pf-v6-m-hidden pf-m-visible-on-xl' },
  { id: 'action', classNames: 'dropdown-kebab-pf pf-v6-c-table__action' },
];

const usePipelinesColumns = (namespace): TableColumn<K8sResourceCommon>[] => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const columns = [
    {
      id: tableColumnInfo[0].id,
      title: t('Name'),
      sort: 'metadata.name',
      props: { className: tableColumnInfo[0].classNames, modifier: 'nowrap' },
    },
    ...(!namespace
      ? [
          {
            title: t('Namespace'),
            sort: 'metadata.namespace',
            props: {
              className: tableColumnInfo[1].classNames,
              modifier: 'nowrap',
            },
            id: tableColumnInfo[1].id,
          },
        ]
      : []),
    {
      id: tableColumnInfo[2].id,
      title: t('Last run'),
      sort: 'latestRun.metadata.name',
      props: { className: tableColumnInfo[2].classNames, modifier: 'nowrap' },
    },
    {
      id: tableColumnInfo[3].id,
      title: t('Task status'),
      sort: 'latestRun.status.succeededCondition',
      props: { className: tableColumnInfo[3].classNames, modifier: 'nowrap' },
    },
    {
      id: tableColumnInfo[4].id,
      title: t('Last run status'),
      sort: 'latestRun.status.succeededCondition',
      props: { className: tableColumnInfo[4].classNames, modifier: 'nowrap' },
    },
    {
      id: tableColumnInfo[5].id,
      title: t('Last run time'),
      sort: 'latestRun.status.completionTime',
      props: { className: tableColumnInfo[5].classNames },
    },
    {
      id: tableColumnInfo[6].id,
      title: '',
      props: { className: tableColumnInfo[6].classNames },
    },
  ];
  return columns;
};

export default usePipelinesColumns;
