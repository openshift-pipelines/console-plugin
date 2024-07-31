import * as React from 'react';
import { useParams } from 'react-router-dom-v5-compat';
import { useTranslation } from 'react-i18next';
import { SortByDirection } from '@patternfly/react-table';
import {
  K8sResourceCommon,
  ListPageBody,
  ListPageFilter,
  VirtualizedTable,
  getGroupVersionKindForModel,
  useK8sWatchResource,
  useListPageFilter,
} from '@openshift-console/dynamic-plugin-sdk';
import usePipelinesColumns from './usePipelinesColumns';
import { usePipelinesFilters } from './usePipelinesFilters';
import PipelineRow from './PipelineRow';
import { useGetPipelineRuns } from '../hooks/useTektonResult';
import { PipelineModel } from '../../models';
import { PropPipelineData, augmentRunsToData } from '../utils/pipeline-augment';

type PipelineListProps = {
  namespace?: string;
  hideTextFilter?: boolean;
};

const PipelinesList: React.FC<PipelineListProps> = ({
  namespace,
  hideTextFilter,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { ns } = useParams();
  namespace = namespace || ns;
  const columns = usePipelinesColumns(namespace);
  const filters = usePipelinesFilters();
  const sortColumnIndex = !namespace ? 5 : 4;
  const [pipelines, pipelinesLoaded, pipelinesLoadError] = useK8sWatchResource<
    PropPipelineData[]
  >({
    isList: true,
    groupVersionKind: getGroupVersionKindForModel(PipelineModel),
    namespace,
    optional: true,
  });
  const [pipelineRuns, pipelineRunsLoaded, pipelineRunsLoadError] =
    useGetPipelineRuns(namespace);
  const pipelinesData = augmentRunsToData(pipelines, pipelineRuns);
  const [data, filteredData, onFilterChange] = useListPageFilter(
    pipelinesData,
    filters,
  );
  return (
    <ListPageBody>
      <ListPageFilter
        columnLayout={{
          columns: columns?.map(({ id, title }) => ({ id, title })),
          id: 'pipeline-list',
          type: 'Pipeline',
          selectedColumns: new Set(['name']),
        }}
        rowFilters={filters}
        onFilterChange={onFilterChange}
        data={data}
        loaded={pipelinesLoaded && pipelineRunsLoaded}
        hideColumnManagement
        hideNameLabelFilters={hideTextFilter}
      />
      <VirtualizedTable<K8sResourceCommon>
        key={sortColumnIndex}
        EmptyMsg={() => (
          <div
            className="pf-u-text-align-center virtualized-table-empty-msg"
            id="no-templates-msg"
          >
            {t('No Pipelines found')}
          </div>
        )}
        columns={columns}
        data={filteredData}
        loaded={pipelinesLoaded && pipelineRunsLoaded}
        loadError={pipelinesLoadError || pipelineRunsLoadError}
        Row={PipelineRow}
        unfilteredData={data}
        sortColumnIndex={sortColumnIndex}
        sortDirection={SortByDirection.desc}
      />
    </ListPageBody>
  );
};

export default PipelinesList;
