import {
  K8sResourceCommon,
  ListPageBody,
  ListPageFilter,
  VirtualizedTable,
  getGroupVersionKindForModel,
  useK8sWatchResource,
  useListPageFilter,
} from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import usePipelinesColumns from './usePipelinesColumns';
import { usePipelinesFilters } from './usePipelinesFilters';
import PipelineRow from './PipelineRow';
import { useGetTaskRuns } from '../hooks/useTektonResult';
import { PipelineModel, PipelineRunModel } from '../../models';
import { PropPipelineData, augmentRunsToData } from '../utils/pipeline-augment';
import { PipelineRunKind } from '../../types';
import { useParams } from 'react-router-dom-v5-compat';

type PipelineListProps = {
  namespace: string;
};

const PipelinesList: React.FC<PipelineListProps> = ({ namespace }) => {
  const { ns } = useParams();
  namespace = namespace || ns;
  const columns = usePipelinesColumns(namespace);
  const filters = usePipelinesFilters();
  const [pipelines, pipelinesLoaded, pipelinesLoadError] = useK8sWatchResource<
    PropPipelineData[]
  >({
    isList: true,
    groupVersionKind: getGroupVersionKindForModel(PipelineModel),
    namespace,
    optional: true,
  });
  const [pipelineRuns, pipelineRunsLoaded, pipelineRunsLoadError] =
    useK8sWatchResource<PipelineRunKind[]>({
      isList: true,
      groupVersionKind: getGroupVersionKindForModel(PipelineRunModel),
      namespace,
      optional: true,
    });
  const pipelinesData = augmentRunsToData(pipelines, pipelineRuns);
  const [data, filteredData, onFilterChange] = useListPageFilter(
    pipelinesData,
    filters,
  );
  const [taskRuns] = useGetTaskRuns(namespace);
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
      />
      <VirtualizedTable<K8sResourceCommon>
        EmptyMsg={() => (
          <div className="pf-u-text-align-center" id="no-templates-msg">
            No Pipelines found
          </div>
        )}
        columns={columns}
        data={filteredData}
        loaded={pipelinesLoaded && pipelineRunsLoaded}
        loadError={pipelinesLoadError || pipelineRunsLoadError}
        Row={PipelineRow}
        rowData={{
          taskRuns,
        }}
        unfilteredData={data}
      />
    </ListPageBody>
  );
};

export default PipelinesList;
