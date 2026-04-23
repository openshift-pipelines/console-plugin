import { Link } from 'react-router';
import {
  getGroupVersionKindForModel,
  ResourceLink,
} from '@openshift-console/dynamic-plugin-sdk';
import type { ReactNode } from 'react';
import { GetDataViewRows } from '@openshift-console/dynamic-plugin-sdk-internal/lib/api/internal-types';
import { formatTime, formatTimeLastRunTime } from '../dateTime';
import { SummaryProps, getReferenceForModel } from '../utils';
import { NamespaceModel, RepositoryModel } from '../../../models';

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
  undefined
> = (data, columns) => {
  return data.map(({ obj }) => {
    const [namespace, name] = obj.group_value.split('/');

    const rowCells: Record<string, RowCell> = {
      [tableColumnInfo[0].id]: {
        cell: (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(RepositoryModel)}
            name={name}
            namespace={namespace}
          />
        ),
        props: {
          isStickyColumn: true,
          hasRightBorder: true,
          stickyMinWidth: '0',
        },
      },
      [tableColumnInfo[1].id]: {
        cell: (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(NamespaceModel)}
            name={namespace}
          />
        ),
      },
      [tableColumnInfo[2].id]: {
        cell: (
          <Link to={`/k8s/ns/${namespace}/${repositoryReference}/${name}/Runs`}>
            {obj.total}
          </Link>
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
