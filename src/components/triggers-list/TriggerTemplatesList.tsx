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
import { useParams } from 'react-router-dom-v5-compat';
import { useDefaultColumns } from '../list-pages/default-resources';
import { TriggerTemplateModel } from '../../models';
import EventListenersRow from './EventListenersRow';
import { ListPageFilter } from '../list-pages/ListPageFilter';

type TriggerTemplatesListProps = {
  namespace?: string;
  hideNameLabelFilters?: boolean;
};

const TriggerTemplatesList: React.FC<TriggerTemplatesListProps> = ({
  namespace,
  hideNameLabelFilters,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { ns } = useParams();
  namespace = namespace || ns;
  const columns = useDefaultColumns();
  const [triggerTemplates, triggerTemplatesLoaded, triggerTemplatesLoadError] =
    useK8sWatchResource<K8sResourceCommon[]>({
      groupVersionKind: getGroupVersionKindForModel(TriggerTemplateModel),
      isList: true,
      namespace,
    });
  const [staticData, filteredData, onFilterChange] =
    useListPageFilter(triggerTemplates);
  return (
    <ListPageBody>
      <ListPageFilter
        data={staticData}
        onFilterChange={onFilterChange}
        loaded={triggerTemplatesLoaded}
        hideColumnManagement
        hideNameLabelFilters={hideNameLabelFilters}
      />
      <VirtualizedTable
        columns={columns}
        data={filteredData}
        loaded={triggerTemplatesLoaded}
        loadError={triggerTemplatesLoadError}
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

export default TriggerTemplatesList;
