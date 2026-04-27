import { useTranslation } from 'react-i18next';
import {
  K8sResourceCommon,
  TableColumn,
} from '@openshift-console/dynamic-plugin-sdk';
import { actionsCellProps } from '@openshift-console/dynamic-plugin-sdk-internal';

export const defaultTableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'created' },
  { id: 'action' },
];

export const useDefaultColumns = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  const columns: TableColumn<K8sResourceCommon>[] = [
    {
      id: defaultTableColumnInfo[0].id,
      sort: 'metadata.name',
      title: t('Name'),
      props: { width: 30, isStickyColumn: true },
    },
    {
      id: defaultTableColumnInfo[1].id,
      sort: 'metadata.namespace',
      title: t('Namespace'),
      props: { width: 30 },
    },
    {
      id: defaultTableColumnInfo[2].id,
      sort: 'metadata.creationTimestamp',
      title: t('Created'),
      props: { width: 30 },
    },
    {
      id: defaultTableColumnInfo[3].id,
      title: '',
      props: actionsCellProps,
    },
  ];

  return columns;
};
