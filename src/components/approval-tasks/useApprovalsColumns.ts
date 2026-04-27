import { TableColumn } from '@openshift-console/dynamic-plugin-sdk';
import { useTranslation } from 'react-i18next';
import { ApprovalFields, ApprovalLabels } from '../../consts';
import { ApprovalTaskKind } from '../../types';

export const tableColumnInfo = [
  { id: 'plrName' },
  { id: 'taskRunName' },
  { id: 'namespace' },
  { id: 'status' },
  { id: 'description' },
  { id: 'startTime' },
  { id: 'action' },
];

const useApprovalsColumns = (namespace): TableColumn<ApprovalTaskKind>[] => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return [
    {
      id: tableColumnInfo[0].id,
      title: t('PipelineRun name'),
      sort: `metadata.labels["${ApprovalLabels[ApprovalFields.PIPELINE_RUN]}"]`,
      props: { width: 20, modifier: 'nowrap', isStickyColumn: true },
    },
    {
      id: tableColumnInfo[1].id,
      title: t('TaskRun name'),
      sort: 'metadata.name',
      props: { width: 15, modifier: 'nowrap' },
    },
    ...(!namespace
      ? [
          {
            title: t('Namespace'),
            sort: 'metadata.namespace',
            props: { width: 15, modifier: 'nowrap' },
            id: 'namespace',
          },
        ]
      : []),
    {
      id: 'status',
      title: t('Current status'),
      props: {
        width: 10,
        modifier: 'nowrap',
      },
    },
    {
      id: 'description',
      title: t('Description'),
      props: { width: 10 },
    },
    {
      id: 'startTime',
      title: t('Started'),
      sort: 'metadata.creationTimestamp',
      props: {
        width: 15,
        modifier: 'nowrap',
      },
    },
    {
      id: 'action',
      title: '',
    },
  ];
};

export default useApprovalsColumns;
