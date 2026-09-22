import { Link } from 'react-router';
import {
  getGroupVersionKindForModel,
  ResourceLink,
} from '@openshift-console/dynamic-plugin-sdk';
import type { ReactNode } from 'react';
import { GetDataViewRows } from '@openshift-console/dynamic-plugin-sdk-internal/lib/api/internal-types';
import { formatTime, formatTimeLastRunTime } from '../dateTime';
import {
  SummaryProps,
  doesNamespaceExists,
  getReferenceForModel,
} from '../utils';
import { NamespaceModel, RepositoryModel } from '../../../models';
import { Project } from '../../../types';
import { t } from '../../utils/common-utils';
import { TooltipforDeletedContent } from './PipelineRunsForPipelinesRow';

type RowCell = { cell: ReactNode; props?: Record<string, unknown> };

const repositoryReference = getReferenceForModel(RepositoryModel);

export const tableColumnInfo = [
  { id: 'repoName' },
  { id: 'namespace' },
  { id: 'total' },
  { id: 'totalDuration' },
  { id: 'avgDuration' },
  { id: 'successRate' },
  { id: 'lastRunTime' },
];

export const getPipelineRunsForRepositoriesDataViewRows: GetDataViewRows<
  SummaryProps,
  { projects?: Project[]; projectsLoaded?: boolean }
> = (data, columns) => {
  return data.map(({ obj, rowData }) => {
    const [namespace, name] = obj.group_value.split('/');
    const nsExists = doesNamespaceExists(rowData, namespace);

    const rowCells: Record<string, RowCell> = {
      [tableColumnInfo[0].id]: {
        cell: nsExists ? (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(RepositoryModel)}
            name={name}
            namespace={namespace}
          />
        ) : (
          <TooltipforDeletedContent
            content={t('This resource belongs to a deleted namespace')}
            model={RepositoryModel}
            name={name}
          />
        ),
        props: {
          isStickyColumn: true,
          hasRightBorder: true,
          stickyMinWidth: '0',
        },
      },
      [tableColumnInfo[1].id]: {
        cell: nsExists ? (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(NamespaceModel)}
            name={namespace}
          />
        ) : (
          <TooltipforDeletedContent
            content={t('This namespace has been deleted')}
            model={NamespaceModel}
            name={namespace}
          />
        ),
      },
      [tableColumnInfo[2].id]: {
        cell: nsExists ? (
          <Link to={`/k8s/ns/${namespace}/${repositoryReference}/${name}/Runs`}>
            {obj.total}
          </Link>
        ) : (
          <span>{obj.total}</span>
        ),
      },
      [tableColumnInfo[3].id]: {
        cell: formatTime(obj.total_duration),
      },
      [tableColumnInfo[4].id]: {
        cell: formatTime(obj.avg_duration),
      },
      [tableColumnInfo[5].id]: {
        cell: `${Math.round((100 * obj.succeeded) / obj.total)}%`,
      },
      [tableColumnInfo[6].id]: {
        cell: formatTimeLastRunTime(obj.last_runtime),
      },
    };

    return columns.map(({ id }) => ({
      id,
      props: rowCells[id]?.props,
      cell: rowCells[id]?.cell,
    }));
  });
};
