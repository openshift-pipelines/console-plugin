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
import { useParams } from 'react-router-dom-v5-compat';
import { useDefaultColumns } from '../list-pages/default-resources';
import { TriggerBindingModel } from '../../models';
import EventListenersRow from './EventListenersRow';

type TriggerBindingsListProps = {
  namespace?: string;
  hideNameLabelFilters?: boolean;
};

const TriggerBindingsList: React.FC<TriggerBindingsListProps> = ({
  namespace,
  hideNameLabelFilters,
}) => {
  const { ns } = useParams();
  namespace = namespace || ns;
  const columns = useDefaultColumns();
  const [triggerBindings, triggerBindingsLoaded, triggerBindingsLoadError] =
    useK8sWatchResource<K8sResourceCommon[]>({
      groupVersionKind: getGroupVersionKindForModel(TriggerBindingModel),
      isList: true,
      namespace,
    });
  const [staticData, filteredData, onFilterChange] =
    useListPageFilter(triggerBindings);
  return (
    <ListPageBody>
      <ListPageFilter
        data={staticData}
        onFilterChange={onFilterChange}
        loaded={triggerBindingsLoaded}
        hideColumnManagement
        hideNameLabelFilters={hideNameLabelFilters}
      />
      <VirtualizedTable
        columns={columns}
        data={filteredData}
        loaded={triggerBindingsLoaded}
        loadError={triggerBindingsLoadError}
        Row={EventListenersRow}
        unfilteredData={staticData}
      />
    </ListPageBody>
  );
};

export default TriggerBindingsList;
