import {
  ListPageBody,
  getGroupVersionKindForModel,
  useFlag,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import type { FC } from 'react';
import { PipelineRunModel, RepositoryModel } from '../../models';
import { PipelineRunKind, RepositoryKind } from '../../types';
import useRepositoriesColumns from './useRepositoriesColumns';
import { getRepositoriesListDataViewRows } from './RepositoriesRow';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ConsoleDataView } from '@openshift-console/dynamic-plugin-sdk-internal';
import { useDataViewFilter } from '../hooks/useDataViewFilter';
import { DataViewFilterToolbar } from '../common/DataViewFilterToolbar';
import { useTaskRuns } from '../hooks/useTaskRuns';
import { FLAG_PIPELINE_TEKTON_RESULT_INSTALLED } from '../../consts';

type RepositoriesListProps = {
  namespace?: string;
  hideTextFilter?: boolean;
};

const RepositoriesList: FC<RepositoriesListProps> = ({
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
  const [taskRuns, k8sLoaded, resultsLoaded] = useTaskRuns(namespace);
  const isTektonResultEnabled = useFlag(FLAG_PIPELINE_TEKTON_RESULT_INSTALLED);

  const { filterValues, onFilterChange, onClearAll, filteredData } =
    useDataViewFilter<RepositoryKind>({
      data: repositories || [],
    });

  return (
    <ListPageBody>
      {!hideTextFilter && (
        <DataViewFilterToolbar
          filterValues={filterValues}
          onFilterChange={onFilterChange}
          onClearAll={onClearAll}
        />
      )}
      <ConsoleDataView<RepositoryKind>
        label={t('Repositories')}
        columns={columns}
        data={filteredData}
        loaded={repositoriesLoaded && pipelineRunsLoaded}
        loadError={repositoriesLoadError}
        getDataViewRows={getRepositoriesListDataViewRows}
        hideColumnManagement
        hideNameLabelFilters
        customRowData={{
          taskRuns,
          pipelineRuns,
          taskRunsLoaded: isTektonResultEnabled
            ? k8sLoaded && resultsLoaded
            : k8sLoaded,
        }}
      />
    </ListPageBody>
  );
};

export default RepositoriesList;
