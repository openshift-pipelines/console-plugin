import { TableColumn } from '@openshift-console/dynamic-plugin-sdk';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import {
  RepoAnnotationFields,
  RepositoryAnnotations,
  RepositoryFields,
  RepositoryLabels,
} from '../../consts';
import { PipelineRunKind } from '../../types';
import { tableColumnClasses } from './PipelineRunsRow';
import { sortPipelineRunsByDuration } from '../pipelines-details/pipeline-step-utils';

const usePipelineRunsColumns = (
  namespace: string,
  repositoryPLRs?: boolean,
): TableColumn<PipelineRunKind>[] => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const columns = [
    {
      id: 'name',
      title: t('Name'),
      sort: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses.name },
    },
    ...(repositoryPLRs
      ? [
          {
            id: 'commit-id',
            title: t('Commit id'),
            sort: `metadata.labels.${RepositoryLabels[RepositoryFields.SHA]}`,
            transforms: [sortable],
            props: { className: tableColumnClasses.commit },
          },
        ]
      : []),
    ...(!namespace
      ? [
          {
            id: 'namespace',
            title: t('Namespace'),
            sort: 'metadata.namespace',
            transforms: [sortable],
            props: { className: tableColumnClasses.namespace },
          },
        ]
      : []),
    {
      id: 'vulnerabilities',
      title: t('Vulnerabilities'),
      sortFunc: 'vulnerabilities',
      transforms: [sortable],
      props: { className: tableColumnClasses.vulnerabilities },
    },
    {
      id: 'status',
      title: t('Status'),
      sort: 'status.conditions[0].reason',
      transforms: [sortable],
      props: { className: tableColumnClasses.status },
    },
    {
      id: 'task-status',
      title: t('Task status'),
      sort: 'status.conditions[0].reason',
      transforms: [sortable],
      props: { className: tableColumnClasses.taskStatus },
    },
    {
      id: 'started',
      title: t('Started'),
      sort: 'status.startTime',
      transforms: [sortable],
      props: { className: tableColumnClasses.started },
    },
    {
      id: 'duration',
      title: t('Duration'),
      sort: sortPipelineRunsByDuration,
      transforms: [sortable],
      props: { className: tableColumnClasses.duration },
    },
    ...(repositoryPLRs
      ? [
          {
            id: 'branch-tag',
            title: t('Branch/Tag'),
            sort: `metadata.annotations.${
              RepositoryAnnotations[RepoAnnotationFields.BRANCH]
            }`,
            transforms: [sortable],
            props: { className: tableColumnClasses.branch },
          },
        ]
      : []),
    {
      id: 'kebab-menu',
      title: '',
      props: { className: tableColumnClasses.actions },
    },
  ];
  return columns;
};

export default usePipelineRunsColumns;
