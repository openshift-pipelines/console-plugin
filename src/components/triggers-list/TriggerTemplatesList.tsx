import {
  getGroupVersionKindForModel,
  ListPageBody,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { useDefaultColumns } from '../list-pages/useDefaultColumns';
import { TriggerTemplateModel } from '../../models';
import { ConsoleDataView } from '@openshift-console/dynamic-plugin-sdk-internal';
import { TriggerTemplateKind } from 'src/types';
import { DataViewFilterToolbar } from '../common/DataViewFilterToolbar';
import { useDataViewFilter } from '../hooks/useDataViewFilter';
import { getDefaultListPageDataViewRows } from '../list-pages/DefaultListPageRow';

type TriggerTemplatesListProps = {
  namespace?: string;
  hideNameLabelFilters?: boolean;
};

const TriggerTemplatesList: FC<TriggerTemplatesListProps> = ({
  namespace,
  hideNameLabelFilters,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { ns } = useParams();
  namespace = namespace || ns;
  const columns = useDefaultColumns();
  const [triggerTemplates, triggerTemplatesLoaded, triggerTemplatesLoadError] =
    useK8sWatchResource<TriggerTemplateKind[]>({
      groupVersionKind: getGroupVersionKindForModel(TriggerTemplateModel),
      isList: true,
      namespace,
    });
  const { filterValues, onFilterChange, onClearAll, filteredData } =
    useDataViewFilter<TriggerTemplateKind>({
      data: triggerTemplates || [],
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
      <ConsoleDataView<TriggerTemplateKind>
        label={t('TriggerTemplate')}
        columns={columns}
        data={filteredData}
        loaded={triggerTemplatesLoaded}
        loadError={triggerTemplatesLoadError}
        getDataViewRows={getDefaultListPageDataViewRows}
        hideColumnManagement
        hideNameLabelFilters
        showNamespaceOverride
      />
    </ListPageBody>
  );
};

export default TriggerTemplatesList;
