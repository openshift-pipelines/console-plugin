import {
  getGroupVersionKindForModel,
  K8sResourceCommon,
  ListPageBody,
  useK8sWatchResource,
  useListPageFilter,
  VirtualizedTable,
} from '@openshift-console/dynamic-plugin-sdk';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { useDefaultColumns } from '../list-pages/default-resources';
import { EventListenerModel } from '../../models';
import EventListenersRow from './EventListenersRow';
import { ListPageFilter } from '../list-pages/ListPageFilter';

type EventListenersListProps = {
  namespace?: string;
  hideNameLabelFilters?: boolean;
};

const EventListenersList: FC<EventListenersListProps> = ({
  namespace,
  hideNameLabelFilters,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
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
        hideColumnManagement
        hideNameLabelFilters={hideNameLabelFilters}
      />
      <VirtualizedTable
        columns={columns}
        data={filteredData}
        loaded={eventListenersLoaded}
        loadError={eventListenersLoadError}
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

export default EventListenersList;
