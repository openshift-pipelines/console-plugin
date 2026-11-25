import { ListPageBody } from '@openshift-console/dynamic-plugin-sdk';
import { ConsoleDataView } from '@openshift-console/dynamic-plugin-sdk-internal';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { LocalQueueKind } from '../../types';
import { DataViewFilterToolbar } from '../common/DataViewFilterToolbar';
import { useDataViewFilter } from '../hooks/useDataViewFilter';
import { useLocalQueues } from '../hooks/useMultiKueueResources';
import { getLocalQueueDataViewRows } from './LocalQueueRow';
import useLocalQueuesColumns from './useLocalQueuesColumns';

const LocalQueuesList: FC = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { ns } = useParams();
  const namespace = ns ?? '-';
  const columns = useLocalQueuesColumns();
  const [localQueues, loaded, loadError] = useLocalQueues(namespace);
  const { filterValues, onFilterChange, onClearAll, filteredData } =
    useDataViewFilter<LocalQueueKind>({
      data: localQueues || [],
      options: {
        getName: (localQueue) => localQueue.metadata.name,
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
      <ConsoleDataView<LocalQueueKind>
        label={t('LocalQueues')}
        columns={columns}
        data={filteredData}
        loaded={loaded}
        loadError={loadError}
        getDataViewRows={getLocalQueueDataViewRows}
        hideColumnManagement
        hideNameLabelFilters
      />
    </ListPageBody>
  );
};

export default LocalQueuesList;
