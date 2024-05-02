import {
  K8sResourceKind,
  TableColumn,
} from '@openshift-console/dynamic-plugin-sdk';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';

const useProjectsColumns = (): TableColumn<K8sResourceKind>[] => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return [
    {
      id: 'name',
      title: t('Name'),
      sort: 'metadata.name',
      transforms: [sortable],
    },
    {
      title: t('Display name'),
      id: 'display-name',
      sort: 'metadata.annotations["openshift.io/display-name"]',
      transforms: [sortable],
    },
    {
      title: t('Status'),
      id: 'status',
      sort: 'status.phase',
      transforms: [sortable],
    },
    {
      title: t('Requester'),
      id: 'requester',
      sort: "metadata.annotations.['openshift.io/requester']",
      transforms: [sortable],
    },
    {
      title: t('Created'),
      id: 'created',
      sort: 'metadata.creationTimestamp',
      transforms: [sortable],
    },
  ];
};

export default useProjectsColumns;
