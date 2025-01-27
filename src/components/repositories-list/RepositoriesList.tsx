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
import { useParams } from 'react-router-dom-v5-compat';
import { useTranslation } from 'react-i18next';

type RepositoriesListProps = {
  namespace?: string;
  hideTextFilter?: boolean;
};

const RepositoriesList: React.FC<RepositoriesListProps> = ({
  namespace,
  hideTextFilter,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { ns } = useParams();
  namespace = namespace || ns;
  const columns = useRepositoriesColumns(namespace);
  const [repositories, repositoriesLoaded, repositoriesLoadError] =
    useK8sWatchResource<RepositoryKind[]>({
      groupVersionKind: getGroupVersionKindForModel(RepositoryModel),
      isList: true,
      namespace,
      optional: true,
    });
  const [pipelineRuns, pipelineRunsLoaded] = useK8sWatchResource<
    PipelineRunKind[]
  >({
    isList: true,
    groupVersionKind: getGroupVersionKindForModel(PipelineRunModel),
    namespace,
    optional: true,
  });
  const [taskRuns, taskRunsLoaded] = useGetTaskRuns(namespace);
  const [staticData, filteredData, onFilterChange] =
    useListPageFilter(repositories);

  return (
    <ListPageBody>
      <ListPageFilter
        data={staticData}
        onFilterChange={onFilterChange}
        loaded={repositoriesLoaded}
        hideNameLabelFilters={hideTextFilter}
      />
      <VirtualizedTable
        EmptyMsg={() => (
          <div className="cos-status-box">
            <div className="pf-v5-u-text-align-center">
              {t('No Repositories found')}
            </div>
          </div>
        )}
        columns={columns}
        data={filteredData}
        loaded={repositoriesLoaded && pipelineRunsLoaded}
        loadError={repositoriesLoadError}
        Row={RepositoriesRow}
        rowData={{
          taskRuns,
          pipelineRuns,
          taskRunsLoaded,
        }}
        unfilteredData={staticData}
      />
    </ListPageBody>
  );
};

export default RepositoriesList;
