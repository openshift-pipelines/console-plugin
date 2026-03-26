import type { FC } from 'react';
import { useParams, useSearchParams } from 'react-router-dom-v5-compat';
import { useTranslation } from 'react-i18next';
import {
  ListPageBody,
  getGroupVersionKindForModel,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import usePipelinesColumns from './usePipelinesColumns';
import { getPipelineListDataViewRows } from './PipelineRow';
import { useGetPipelineRuns } from '../hooks/useTektonResult';
import { PipelineModel } from '../../models';
import { PropPipelineData, augmentRunsToData } from '../utils/pipeline-augment';
import { useGetActiveUser } from '../hooks/hooks';
import { ConsoleDataView } from '@openshift-console/dynamic-plugin-sdk-internal';
import { useEffect } from 'react';
import { DataViewFilterToolbar } from '../common/DataViewFilterToolbar';
import { useDataViewFilter } from '../hooks/useDataViewFilter';

type PipelineListProps = {
  namespace?: string;
  hideTextFilter?: boolean;
};

const PipelinesList: FC<PipelineListProps> = ({
  namespace,
  hideTextFilter,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { ns } = useParams();
  namespace = namespace || ns;
  const columns = usePipelinesColumns(namespace);
  const currentUser = useGetActiveUser();
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (!searchParams.has('sortBy')) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('sortBy', t('Last run time'));
        next.set('orderBy', 'desc');
        return next;
      });
    }
  }, []);

  const [pipelines, pipelinesLoaded, pipelinesLoadError] = useK8sWatchResource<
    PropPipelineData[]
  >({
    isList: true,
    groupVersionKind: getGroupVersionKindForModel(PipelineModel),
    namespace,
    optional: true,
  });
  const [pipelineRuns, k8sPLRLoaded, trPLRLoaded, pipelineRunsLoadError] =
    useGetPipelineRuns(namespace);
  const pipelinesData = augmentRunsToData(pipelines, pipelineRuns);

  const {
    filterValues,
    onFilterChange,
    onClearAll,
    filteredData,
    updatedCheckboxFilters,
  } = useDataViewFilter<PropPipelineData>({
    data: pipelinesData || [],
    resourceType: 'Pipeline',
  });

  return (
    <ListPageBody>
      {!hideTextFilter && (
        <DataViewFilterToolbar
          filterValues={filterValues}
          onFilterChange={onFilterChange}
          onClearAll={onClearAll}
          checkboxFilters={updatedCheckboxFilters}
        />
      )}
      <ConsoleDataView<PropPipelineData>
        label={t('Pipelines')}
        columns={columns}
        data={filteredData}
        loaded={pipelinesLoaded && k8sPLRLoaded && trPLRLoaded}
        loadError={pipelinesLoadError || pipelineRunsLoadError}
        getDataViewRows={getPipelineListDataViewRows}
        hideColumnManagement
        hideNameLabelFilters
        customRowData={{
          currentUser,
        }}
      />
    </ListPageBody>
  );
};

export default PipelinesList;
