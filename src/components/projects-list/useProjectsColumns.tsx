import {
  K8sResourceKind,
  TableColumn,
} from '@openshift-console/dynamic-plugin-sdk';
import { cellIsStickyProps } from '@openshift-console/dynamic-plugin-sdk-internal';
import { useTranslation } from 'react-i18next';

export const tableColumnInfo = [
  { id: 'name' },
  { id: 'display-name' },
  { id: 'status' },
  { id: 'requester' },
  { id: 'created' },
];

const useProjectsColumns = (): TableColumn<K8sResourceKind>[] => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return [
    {
      id: tableColumnInfo[0].id,
      title: t('Name'),
      sort: 'metadata.name',
      props: { ...cellIsStickyProps, modifier: 'nowrap' },
    },
    {
      id: tableColumnInfo[1].id,
      title: t('Display name'),
      sort: 'metadata.annotations["openshift.io/display-name"]',
      props: { modifier: 'nowrap' },
    },
    {
      id: tableColumnInfo[2].id,
      title: t('Status'),
      sort: 'status.phase',
      props: { modifier: 'nowrap' },
    },
    {
      id: tableColumnInfo[3].id,
      title: t('Requester'),
      sort: "metadata.annotations['openshift.io/requester']",
      props: { modifier: 'nowrap' },
    },
    {
      id: tableColumnInfo[4].id,
      title: t('Created'),
      sort: 'metadata.creationTimestamp',
      props: { modifier: 'nowrap' },
    },
  ];
};

export default useProjectsColumns;
