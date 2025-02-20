import {
  getGroupVersionKindForModel,
  K8sResourceCommon,
  ListPageBody,
  useK8sWatchResource,
  useListPageFilter,
  VirtualizedTable,
} from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useDefaultColumns } from '../list-pages/default-resources';
import { ClusterTriggerBindingModel } from '../../models';
import EventListenersRow from './EventListenersRow';
import { ListPageFilter } from '../list-pages/ListPageFilter';

type ClusterTriggerBindingsListProps = {
  hideNameLabelFilters?: boolean;
};

const ClusterTriggerBindingsList: React.FC<ClusterTriggerBindingsListProps> = ({
  hideNameLabelFilters,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const columns = useDefaultColumns();
  const [
    clusterTriggerBindings,
    clusterTriggerBindingsLoaded,
    clusterTriggerBindingsLoadError,
  ] = useK8sWatchResource<K8sResourceCommon[]>({
    groupVersionKind: getGroupVersionKindForModel(ClusterTriggerBindingModel),
    isList: true,
    namespaced: false,
    optional: true,
  });
  const [staticData, filteredData, onFilterChange] = useListPageFilter(
    clusterTriggerBindings,
  );
  return (
    <ListPageBody>
      <ListPageFilter
        data={staticData}
        onFilterChange={onFilterChange}
        loaded={clusterTriggerBindingsLoaded}
        hideColumnManagement
        hideNameLabelFilters={hideNameLabelFilters}
      />
      <VirtualizedTable
        columns={columns}
        data={filteredData}
        loaded={clusterTriggerBindingsLoaded}
        loadError={clusterTriggerBindingsLoadError}
        Row={EventListenersRow}
        unfilteredData={staticData}
        EmptyMsg={() => (
          <div className="cp-text-align-center" id="no-resource-msg">
            {t('Not found')}
          </div>
        )}
      />
    </ListPageBody>
  );
};

export default ClusterTriggerBindingsList;
