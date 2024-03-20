import {
  ListPageBody,
  ListPageFilter,
  VirtualizedTable,
  getGroupVersionKindForModel,
  useK8sWatchResource,
  useListPageFilter,
} from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import { PipelineRunModel, RepositoryModel } from '../../models';
import { PipelineRunKind, RepositoryKind } from '../../types';
import useRepositoriesColumns from './useRepositoriesColumns';
import RepositoriesRow from './RepositoriesRow';
import { useGetTaskRuns } from '../hooks/useTektonResult';

type RepositoriesListProps = {
  namespace: string;
};

const RepositoriesList: React.FC<RepositoriesListProps> = ({ namespace }) => {
  const columns = useRepositoriesColumns(namespace);
  const [repositories, repositoriesLoaded, repositoriesLoadError] =
    useK8sWatchResource<RepositoryKind[]>({
      groupVersionKind: getGroupVersionKindForModel(RepositoryModel),
      isList: true,
      namespaced: false,
    });
  const [pipelineRuns, pipelineRunsLoaded] = useK8sWatchResource<
    PipelineRunKind[]
  >({
    isList: true,
    groupVersionKind: getGroupVersionKindForModel(PipelineRunModel),
    namespace,
    optional: true,
  });
  const [taskRuns] = useGetTaskRuns(namespace);
  const [staticData, filteredData, onFilterChange] =
    useListPageFilter(repositories);

  return (
    <ListPageBody>
      <ListPageFilter
        data={staticData}
        onFilterChange={onFilterChange}
        loaded={repositoriesLoaded}
        hideNameLabelFilters
      />
      <VirtualizedTable
        columns={columns}
        data={filteredData}
        loaded={repositoriesLoaded && pipelineRunsLoaded}
        loadError={repositoriesLoadError}
        Row={RepositoriesRow}
        rowData={{
          taskRuns,
          pipelineRuns,
        }}
        unfilteredData={staticData}
      />
    </ListPageBody>
  );
};

export default RepositoriesList;
