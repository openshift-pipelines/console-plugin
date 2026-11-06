import {
  ResourceLink,
  getGroupVersionKindForModel,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  actionsCellProps,
  getNameCellProps,
  LazyActionMenu,
} from '@openshift-console/dynamic-plugin-sdk-internal';
import { GetDataViewRows } from '@openshift-console/dynamic-plugin-sdk-internal/lib/api/internal-types';
import { ClusterQueueModel } from '../../models';
import { ClusterQueueKind, Resource } from '../../types';
import { getReferenceForModel } from '../pipelines-overview/utils';
import Status from '../status/Status';
import { t } from '../utils/common-utils';
import { clusterQueueColumnIds } from './useClusterQueuesColumns';

const formatQuota = (resource: Resource) =>
  resource.name === 'cpu'
    ? t('{{quota}} cores', { quota: resource.nominalQuota })
    : resource.name === 'memory'
    ? resource.nominalQuota
    : `${resource.nominalQuota} ${resource.name}`;

export const getClusterQueueStatus = (queue: ClusterQueueKind) => {
  const activeCondition = queue.status?.conditions?.find(
    (condition) => condition.type === 'Active',
  );

  if (activeCondition?.status === 'True') return 'Ready';
  if (activeCondition?.status === 'False') return 'Error';
  return 'Pending';
};

const getNominalQuota = (queue: ClusterQueueKind) => {
  const flavor = queue.spec?.resourceGroups?.[0]?.flavors?.[0];
  const resources = flavor?.resources ?? [];

  if (!resources.length) return t('No quota set');

  return (
    <>
      <div>{resources.map(formatQuota).join(' · ')}</div>
      <div>{flavor.name}</div>
    </>
  );
};

export const getClusterQueueDataViewRows: GetDataViewRows<ClusterQueueKind> = (
  data,
  columns,
) =>
  data.map(({ obj }) => {
    const admitted = obj.status?.admittedWorkloads ?? 0;
    const pending = obj.status?.pendingWorkloads ?? 0;
    const rowCells = {
      [clusterQueueColumnIds.name]: {
        cell: (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(ClusterQueueModel)}
            name={obj.metadata.name}
          />
        ),
        props: {
          ...getNameCellProps('clusterqueues-list'),
          modifier: 'nowrap',
        },
      },
      [clusterQueueColumnIds.cohort]: {
        cell: obj.spec?.cohortName || t('None'),
        props: { modifier: 'nowrap' },
      },
      [clusterQueueColumnIds.strategy]: {
        cell: obj.spec?.queueingStrategy ?? 'BestEffortFIFO',
        props: { modifier: 'nowrap' },
      },
      [clusterQueueColumnIds.quota]: { cell: getNominalQuota(obj) },
      [clusterQueueColumnIds.workloads]: {
        cell: t('{{admitted}} admitted · {{pending}} pending', {
          admitted,
          pending,
        }),
        props: { modifier: 'nowrap' },
      },
      [clusterQueueColumnIds.status]: {
        cell: <Status status={getClusterQueueStatus(obj)} />,
        props: { modifier: 'nowrap' },
      },
      [clusterQueueColumnIds.actions]: {
        cell: (
          <LazyActionMenu
            context={{ [getReferenceForModel(ClusterQueueModel)]: obj }}
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
