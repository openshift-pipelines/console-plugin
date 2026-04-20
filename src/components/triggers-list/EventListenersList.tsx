import {
  getGroupVersionKindForModel,
  ListPageBody,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { useDefaultColumns } from '../list-pages/useDefaultColumns';
import { EventListenerModel } from '../../models';
import { DataViewFilterToolbar } from '../common/DataViewFilterToolbar';
import { ConsoleDataView } from '@openshift-console/dynamic-plugin-sdk-internal';
import { useDataViewFilter } from '../hooks/useDataViewFilter';
import { getDefaultListPageDataViewRows } from '../list-pages/DefaultListPageRow';
import { EventListenerKind } from '../../types';

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
    useK8sWatchResource<EventListenerKind[]>({
      groupVersionKind: getGroupVersionKindForModel(EventListenerModel),
      isList: true,
      namespace,
    });
  const { filterValues, onFilterChange, onClearAll, filteredData } =
    useDataViewFilter<EventListenerKind>({
      data: eventListeners || [],
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
      <ConsoleDataView<EventListenerKind>
        label={t('EventListeners')}
        columns={columns}
        data={filteredData}
        loaded={eventListenersLoaded}
        loadError={eventListenersLoadError}
        getDataViewRows={getDefaultListPageDataViewRows}
        hideColumnManagement
        hideNameLabelFilters
        showNamespaceOverride
      />
    </ListPageBody>
  );
};

export default EventListenersList;
