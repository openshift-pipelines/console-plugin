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
import { EventListenerModel } from '../../models';
import EventListenersRow from './EventListenersRow';

type EventListenersListProps = {
  namespace: string;
};

const EventListenersList: React.FC<EventListenersListProps> = ({
  namespace,
}) => {
  const { ns } = useParams();
  namespace = namespace || ns;
  const columns = useDefaultColumns();
  const [eventListeners, eventListenersLoaded, eventListenersLoadError] =
    useK8sWatchResource<K8sResourceCommon[]>({
      groupVersionKind: getGroupVersionKindForModel(EventListenerModel),
      isList: true,
      namespace,
    });
  const [staticData, filteredData, onFilterChange] =
    useListPageFilter(eventListeners);
  return (
    <ListPageBody>
      <ListPageFilter
        data={staticData}
        onFilterChange={onFilterChange}
        loaded={eventListenersLoaded}
      />
      <VirtualizedTable
        columns={columns}
        data={filteredData}
        loaded={eventListenersLoaded}
        loadError={eventListenersLoadError}
        Row={EventListenersRow}
        unfilteredData={staticData}
      />
    </ListPageBody>
  );
};

export default EventListenersList;
