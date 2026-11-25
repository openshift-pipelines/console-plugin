import {
  getGroupVersionKindForModel,
  ResourceLink,
  Timestamp,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  actionsCellProps,
  getNameCellProps,
  LazyActionMenu,
} from '@openshift-console/dynamic-plugin-sdk-internal';
import { GetDataViewRows } from '@openshift-console/dynamic-plugin-sdk-internal/lib/api/internal-types';
import { LocalQueueModel } from '../../models';
import { LocalQueueKind } from '../../types';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { localQueueColumnIds } from './useLocalQueuesColumns';
import { getLastUpdatedTimestamp } from './utils';

export const getLocalQueueDataViewRows: GetDataViewRows<LocalQueueKind> = (
  data,
  columns,
) =>
  data.map(({ obj }) => {
    const admitted = obj.status?.admittedWorkloads ?? 0;
    const pending = obj.status?.pendingWorkloads ?? 0;
    const rowCells = {
      [localQueueColumnIds.name]: {
        cell: (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(LocalQueueModel)}
            name={obj.metadata.name}
            namespace={obj.metadata.namespace}
          />
        ),
        props: {
          ...getNameCellProps('localqueues-list'),
          modifier: 'nowrap',
        },
      },
      [localQueueColumnIds.admittedWorkloads]: {
        cell: admitted,
        props: { modifier: 'nowrap' },
      },
      [localQueueColumnIds.pendingWorkloads]: {
        cell: pending,
        props: { modifier: 'nowrap' },
      },
      [localQueueColumnIds.lastUpdated]: {
        cell: <Timestamp timestamp={getLastUpdatedTimestamp(obj)} />,
        props: { modifier: 'nowrap' },
      },
      [localQueueColumnIds.actions]: {
        cell: (
          <LazyActionMenu
            context={{ [getReferenceForModel(LocalQueueModel)]: obj }}
          />
        ),
        props: actionsCellProps,
      },
    };

    return columns.map(({ id }) => ({
      id,
      cell: rowCells[id]?.cell,
      props: rowCells[id]?.props,
    }));
  });
