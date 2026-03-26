import { TableColumn } from '@openshift-console/dynamic-plugin-sdk';
import { useTranslation } from 'react-i18next';
import {
  RepoAnnotationFields,
  RepositoryAnnotations,
  RepositoryFields,
  RepositoryLabels,
} from '../../consts';
import { PipelineRunKind } from '../../types';
import { sortPipelineAndTaskRunsByDuration } from '../pipelines-details/pipeline-step-utils';

export const tableColumnInfo = [
  {id: 'name', classNames: 'pf-v6-m-width-20'},
  {id: 'commit-id', classNames: 'pf-v6-m-hidden pf-m-visible-on-sm pf-m-width-10'},
  {id: 'namespace', classNames: ''}, 
  {id: 'vulnerabilities', classNames: 'pf-v6-m-hidden pf-m-visible-on-md'},
  {id: 'status', classNames: 'pf-v6-m-hidden pf-m-visible-on-sm pf-m-width-10'},
  {id: 'task-status', classNames: 'pf-v6-m-hidden pf-m-visible-on-lg'},
  {id: 'started', classNames: 'pf-v6-m-hidden pf-m-visible-on-lg'},
  {id: 'duration', classNames: 'pf-v6-m-hidden pf-m-visible-on-xl'},
  {id: 'branch-tag', classNames: 'pf-v6-m-hidden pf-m-visible-on-xl pf-m-width-5'},
  {id: 'action', classNames: 'dropdown-kebab-pf pf-v6-c-table__action'}
];

const usePipelineRunsColumns = (
  namespace: string,
  repositoryPLRs?: boolean,
): TableColumn<PipelineRunKind>[] => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const columns = [
    {
      id: tableColumnInfo[0].id,
      title: t('Name'),
      sort: 'metadata.name',
      props: { className: tableColumnInfo[0].classNames, modifier: 'nowrap' },
    },
    ...(repositoryPLRs
      ? [
          {
            id: tableColumnInfo[1].id,
            title: t('Commit id'),
            sort: `metadata.labels.${RepositoryLabels[RepositoryFields.SHA]}`,
            props: { className: tableColumnInfo[1].classNames, modifier: 'nowrap' },
          },
        ]
      : []),
    ...(!namespace
      ? [
          {
            id: tableColumnInfo[2].id,
            title: t('Namespace'),
            sort: 'metadata.namespace',
            props: { className: tableColumnInfo[2].classNames, modifier: 'nowrap' },
          },
        ]
      : []),
    {
      id: tableColumnInfo[3].id,
      title: t('Vulnerabilities'),
      sortFunc: 'vulnerabilities',
      props: { className: tableColumnInfo[3].classNames, modifier: 'nowrap' },
    },
    {
      id: tableColumnInfo[4].id,
      title: t('Status'),
      sort: 'status.conditions[0].reason',
      props: { className: tableColumnInfo[4].classNames, modifier: 'nowrap' },
    },
    {
      id: tableColumnInfo[5].id,
      title: t('Task status'),
      sort: 'status.conditions[0].reason',
      props: { className: tableColumnInfo[5].classNames, modifier: 'nowrap' },
    },
    {
      id: tableColumnInfo[6].id,
      title: t('Started'),
      sort: 'status.startTime',
      props: { className: tableColumnInfo[6].classNames, modifier: 'nowrap' },
    },
    {
      id: tableColumnInfo[7].id,
      title: t('Duration'),
      sort: sortPipelineAndTaskRunsByDuration,
      props: { className: tableColumnInfo[7].classNames, modifier: 'nowrap' },
    },
    ...(repositoryPLRs
      ? [
          {
            id: tableColumnInfo[8].id,
            title: t('Branch/Tag'),
            sort: `metadata.annotations.${
              RepositoryAnnotations[RepoAnnotationFields.BRANCH]
            }`,
            props: { className: tableColumnInfo[8].classNames, modifier: 'nowrap' },
          },
        ]
      : []),
    {
      id: tableColumnInfo[9].id,
      title: '',
      props: { className: tableColumnInfo[9].classNames },
    },
  ];
  return columns;
};

export default usePipelineRunsColumns;
