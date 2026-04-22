import {
  getGroupVersionKindForModel,
  ListPageBody,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { useDefaultColumns } from '../list-pages/useDefaultColumns';
import { TriggerBindingModel } from '../../models';
import { ConsoleDataView } from '@openshift-console/dynamic-plugin-sdk-internal';
import { DataViewFilterToolbar } from '../common/DataViewFilterToolbar';
import { getDefaultListPageDataViewRows } from '../list-pages/DefaultListPageRow';
import { TriggerBindingKind } from 'src/types/triggers';
import { useDataViewFilter } from '../hooks/useDataViewFilter';

type TriggerBindingsListProps = {
  namespace?: string;
  hideNameLabelFilters?: boolean;
};

const TriggerBindingsList: FC<TriggerBindingsListProps> = ({
  namespace,
  hideNameLabelFilters,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { ns } = useParams();
  namespace = namespace || ns;
  const columns = useDefaultColumns();
  const [triggerBindings, triggerBindingsLoaded, triggerBindingsLoadError] =
    useK8sWatchResource<TriggerBindingKind[]>({
      groupVersionKind: getGroupVersionKindForModel(TriggerBindingModel),
      isList: true,
      namespace,
    });

  const { filterValues, onFilterChange, onClearAll, filteredData } =
    useDataViewFilter<TriggerBindingKind>({
      data: triggerBindings || [],
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
      <ConsoleDataView<TriggerBindingKind>
        label={t('TriggerBinding')}
        columns={columns}
        data={filteredData}
        loaded={triggerBindingsLoaded}
        loadError={triggerBindingsLoadError}
        getDataViewRows={getDefaultListPageDataViewRows}
        hideColumnManagement
        hideNameLabelFilters
        showNamespaceOverride
      />
    </ListPageBody>
  );
};

export default TriggerBindingsList;
