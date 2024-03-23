import { TableColumn } from '@openshift-console/dynamic-plugin-sdk';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { RepositoryKind } from '../../types';
import { repositoriesTableColumnClasses } from './RepositoriesRow';

const useRepositoriesColumns = (namespace): TableColumn<RepositoryKind>[] => {
  const { t } = useTranslation();
  return [
    {
      id: 'name',
      title: t('Name'),
      sort: 'metadata.name',
      transforms: [sortable],
      props: { className: repositoriesTableColumnClasses[0] },
    },
    ...(!namespace
      ? [
          {
            title: t('Namespace'),
            sort: 'metadata.namespace',
            transforms: [sortable],
            props: { className: repositoriesTableColumnClasses[1] },
            id: 'namespace',
          },
        ]
      : []),
    {
      id: 'event-type',
      title: t('Event type'),
      sort: 'spec.event_type',
      transforms: [sortable],
      props: { className: repositoriesTableColumnClasses[2] },
    },
    {
      id: 'last-run',
      title: t('Last run'),
      transforms: [sortable],
      props: { className: repositoriesTableColumnClasses[3] },
    },
    {
      id: 'task-status',
      title: t('Task status'),
      transforms: [sortable],
      props: { className: repositoriesTableColumnClasses[4] },
    },
    {
      id: 'last-run-status',
      title: t('Last run status'),
      transforms: [sortable],
      props: { className: repositoriesTableColumnClasses[5] },
    },
    {
      id: 'last-runtime',
      title: t('Last run time'),
      transforms: [sortable],
      props: { className: repositoriesTableColumnClasses[6] },
    },
    {
      id: 'last-run-duration',
      title: t('Last run duration'),
      transforms: [sortable],
      props: { className: repositoriesTableColumnClasses[7] },
    },
    {
      id: 'kebab-menu',
      title: '',
      props: { className: repositoriesTableColumnClasses[8] },
    },
  ];
};

export default useRepositoriesColumns;
