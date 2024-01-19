import { useTranslation } from 'react-i18next';
import { sortable } from '@patternfly/react-table';
import {
  K8sResourceCommon,
  TableColumn,
} from '@openshift-console/dynamic-plugin-sdk';

export const useDefaultColumns = () => {
  const { t } = useTranslation('plugin__pipeline-console-plugin');

  const columns: TableColumn<K8sResourceCommon>[] = [
    {
      id: 'name',
      sort: 'metadata.name',
      title: t('Name'),
      transforms: [sortable],
    },
    {
      id: 'namespace',
      sort: 'metadata.namespace',
      title: t('Namesapce'),
      transforms: [sortable],
    },
    {
      id: 'created',
      sort: 'metadata.creationTimestamp',
      title: t('Created'),
      transforms: [sortable],
    },
    {
      id: '',
      props: { className: 'dropdown-kebab-pf pf-v5-c-table__action' },
      title: '',
    },
  ];

  return columns;
};
