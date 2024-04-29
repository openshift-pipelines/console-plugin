import { TableColumn } from '@openshift-console/dynamic-plugin-sdk';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { ApprovalFields, ApprovalLabels } from '../../consts';
import { ApprovalTaskKind } from '../../types';
import { tableColumnClasses } from './approval-table';

const useApprovalsColumns = (): TableColumn<ApprovalTaskKind>[] => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return [
    {
      id: 'plrName',
      title: t('PipelineRun name'),
      transforms: [sortable],
      sort: `metadata.labels["${ApprovalLabels[ApprovalFields.PIPELINE_RUN]}"]`,
      props: { className: tableColumnClasses.plrName },
    },
    {
      id: 'taskRunName',
      title: t('TaskRun name'),
      sort: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses.taskRunName },
    },
    {
      id: 'status',
      title: t('Current status'),
      props: { className: tableColumnClasses.status },
    },
    {
      id: 'description',
      title: t('Description'),
      props: { className: tableColumnClasses.description },
    },
    {
      id: 'startTime',
      title: t('Started'),
      sort: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses.startTime },
    },
    {
      id: 'kebab-menu',
      title: '',
      props: { className: tableColumnClasses.actions },
    },
  ];
};

export default useApprovalsColumns;
