import {
  K8sResourceCommon,
  TableColumn,
} from '@openshift-console/dynamic-plugin-sdk';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';

const tableColumnClasses = [
  'pf-v6-u-w-16-on-xl pf-v6-u-w-25-on-lg pf-v6-u-w-33-on-xs', // name
  'pf-v6-u-w-8-on-xl pf-v6-u-w-16-on-xs', // namespace
  'pf-v6-u-w-16-on-xl pf-v6-u-w-25-on-lg pf-v6-u-w-33-on-xs', // last run
  'pf-v6-m-hidden pf-m-visible-on-lg', // task status
  'pf-v6-m-hidden pf-m-visible-on-xl', // last run status
  'pf-v6-m-hidden pf-m-visible-on-xl', // last run time
];

const usePipelinesColumns = (namespace): TableColumn<K8sResourceCommon>[] => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const columns = [
    {
      id: 'name',
      title: t('Name'),
      sort: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    ...(!namespace
      ? [
          {
            title: t('Namespace'),
            sort: 'metadata.namespace',
            transforms: [sortable],
            props: { className: tableColumnClasses[1] },
            id: 'namespace',
          },
        ]
      : []),
    {
      id: 'last-run',
      title: t('Last run'),
      sort: 'latestRun.metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      id: 'task-run',
      title: t('Task status'),
      sort: 'latestRun.status.succeededCondition',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      id: 'last-run-status',
      title: t('Last run status'),
      sort: 'latestRun.status.succeededCondition',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      id: 'last-run-time',
      title: t('Last run time'),
      sort: 'latestRun.status.completionTime',
      transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
    {
      id: '',
      title: '',
      props: { className: 'dropdown-kebab-pf pf-v6-c-table__action' },
    },
  ];
  return columns;
};

export default usePipelinesColumns;
