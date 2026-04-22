import {
  getGroupVersionKindForModel,
  ListPageBody,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useDefaultColumns } from '../list-pages/useDefaultColumns';
import { ClusterTriggerBindingModel } from '../../models';
import { ClusterTriggerBindingKind } from 'src/types';
import { getDefaultListPageDataViewRows } from '../list-pages/DefaultListPageRow';
import { useDataViewFilter } from '../hooks/useDataViewFilter';
import { DataViewFilterToolbar } from '../common/DataViewFilterToolbar';
import { ConsoleDataView } from '@openshift-console/dynamic-plugin-sdk-internal';

type ClusterTriggerBindingsListProps = {
  hideNameLabelFilters?: boolean;
};

const ClusterTriggerBindingsList: FC<ClusterTriggerBindingsListProps> = ({
  hideNameLabelFilters,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const columns = useDefaultColumns();
  const [
    clusterTriggerBindings,
    clusterTriggerBindingsLoaded,
    clusterTriggerBindingsLoadError,
  ] = useK8sWatchResource<ClusterTriggerBindingKind[]>({
    groupVersionKind: getGroupVersionKindForModel(ClusterTriggerBindingModel),
    isList: true,
    namespaced: false,
    optional: true,
  });
  const { filterValues, onFilterChange, onClearAll, filteredData } =
    useDataViewFilter<ClusterTriggerBindingKind>({
      data: clusterTriggerBindings || [],
    });
  return (
    <ListPageBody>
      {!hideNameLabelFilters && (
        <DataViewFilterToolbar
          filterValues={filterValues}
          onFilterChange={onFilterChange}
          onClearAll={onClearAll}
        />
      )}
      <ConsoleDataView<ClusterTriggerBindingKind>
        label={t('TriggerBinding')}
        columns={columns}
        data={filteredData}
        loaded={clusterTriggerBindingsLoaded}
        loadError={clusterTriggerBindingsLoadError}
        getDataViewRows={getDefaultListPageDataViewRows}
        hideColumnManagement
        hideNameLabelFilters
        showNamespaceOverride
      />
    </ListPageBody>
  );
};

export default ClusterTriggerBindingsList;
