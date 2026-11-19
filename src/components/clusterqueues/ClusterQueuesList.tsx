import { ListPageBody } from '@openshift-console/dynamic-plugin-sdk';
import { ConsoleDataView } from '@openshift-console/dynamic-plugin-sdk-internal';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ClusterQueueKind } from '../../types';
import { DataViewFilterToolbar } from '../common/DataViewFilterToolbar';
import { useDataViewFilter } from '../hooks/useDataViewFilter';
import { useClusterQueues } from '../hooks/useMultiKueueResources';
import { getClusterQueueDataViewRows } from './ClusterQueueRow';
import useClusterQueuesColumns from './useClusterQueuesColumns';

const ClusterQueuesList: FC = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const columns = useClusterQueuesColumns();
  const [clusterQueues, loaded, loadError] = useClusterQueues();
  const { filterValues, onFilterChange, onClearAll, filteredData } =
    useDataViewFilter<ClusterQueueKind>({
      data: clusterQueues || [],
      options: {
        getName: (clusterQueue) => clusterQueue.metadata.name,
      },
    });

  return (
    <ListPageBody>
      <DataViewFilterToolbar
        filterValues={filterValues}
        onFilterChange={onFilterChange}
        onClearAll={onClearAll}
        hideLabelFilter
      />
      <ConsoleDataView<ClusterQueueKind>
        label={t('ClusterQueues')}
        columns={columns}
        data={filteredData}
        loaded={loaded}
        loadError={loadError}
        getDataViewRows={getClusterQueueDataViewRows}
        hideColumnManagement
        hideNameLabelFilters
      />
    </ListPageBody>
  );
};

export default ClusterQueuesList;
