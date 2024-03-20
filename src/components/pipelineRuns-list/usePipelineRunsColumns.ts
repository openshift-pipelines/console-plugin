import { TableColumn } from '@openshift-console/dynamic-plugin-sdk';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { PipelineRunKind } from '../../types';
import { tableColumnClasses } from './PipelineRunsRow';

const usePipelineRunsColumns = (namespace): TableColumn<PipelineRunKind>[] => {
  const { t } = useTranslation();
  const columns = [
    {
      id: 'name',
      title: t('pipelines-plugin~Name'),
      sort: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses.name },
    },
    ...(!namespace
      ? [
          {
            id: 'namespace',
            title: t('pipelines-plugin~Namespace'),
            sort: 'metadata.namespace',
            transforms: [sortable],
            props: { className: tableColumnClasses.namespace },
          },
        ]
      : []),
    {
      id: 'vulnerabilities',
      title: t('pipelines-plugin~Vulnerabilities'),
      sortFunc: 'vulnerabilities',
      transforms: [sortable],
      props: { className: tableColumnClasses.vulnerabilities },
    },
    {
      id: 'status',
      title: t('pipelines-plugin~Status'),
      sort: 'status.conditions[0].reason',
      transforms: [sortable],
      props: { className: tableColumnClasses.status },
    },
    {
      id: 'task-status',
      title: t('pipelines-plugin~Task status'),
      sort: 'status.conditions[0].reason',
      transforms: [sortable],
      props: { className: tableColumnClasses.taskStatus },
    },
    {
      id: 'started',
      title: t('pipelines-plugin~Started'),
      sort: 'status.startTime',
      transforms: [sortable],
      props: { className: tableColumnClasses.started },
    },
    {
      id: 'duration',
      title: t('pipelines-plugin~Duration'),
      sort: 'status.completionTime',
      transforms: [sortable],
      props: { className: tableColumnClasses.duration },
    },
    {
      id: 'kebab-menu',
      title: '',
      props: { className: tableColumnClasses.actions },
    },
  ];
  return columns;
};

export default usePipelineRunsColumns;
