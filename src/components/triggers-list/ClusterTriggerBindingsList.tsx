import {
  getGroupVersionKindForModel,
  K8sResourceCommon,
  ListPageBody,
  ListPageFilter,
  useK8sWatchResource,
  useListPageFilter,
  VirtualizedTable,
} from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import { useDefaultColumns } from '../list-pages/default-resources';
import { ClusterTriggerBindingModel } from '../../models';
import EventListenersRow from './EventListenersRow';

const ClusterTriggerBindingsList: React.FC = () => {
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
      />
      <VirtualizedTable
        columns={columns}
        data={filteredData}
        loaded={clusterTriggerBindingsLoaded}
        loadError={clusterTriggerBindingsLoadError}
        Row={EventListenersRow}
        unfilteredData={staticData}
      />
    </ListPageBody>
  );
};

export default ClusterTriggerBindingsList;
