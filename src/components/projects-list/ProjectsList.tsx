import { useTranslation } from 'react-i18next';
import useProjectsColumns from './useProjectsColumns';
import {
  getGroupVersionKindForModel,
  K8sResourceKind,
  ListPageBody,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { ConsoleDataView } from '@openshift-console/dynamic-plugin-sdk-internal';
import { ProjectModel } from '../../models';
import { getProjectsDataViewRows } from './ProjectsRow';
import { DataViewFilterToolbar } from '../common/DataViewFilterToolbar';
import { useDataViewFilter } from '../hooks/useDataViewFilter';

const ProjectsList = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [projects, projectsLoaded, projectsLoadError] = useK8sWatchResource<
    K8sResourceKind[]
  >({
    isList: true,
    groupVersionKind: getGroupVersionKindForModel(ProjectModel),
    optional: true,
  });
  const columns = useProjectsColumns();
  const { filterValues, onFilterChange, onClearAll, filteredData } =
    useDataViewFilter<K8sResourceKind>({ data: projects || [] });

  return (
    <ListPageBody>
      <DataViewFilterToolbar
        filterValues={filterValues}
        onFilterChange={onFilterChange}
        onClearAll={onClearAll}
      />
      <ConsoleDataView<K8sResourceKind>
        label={t('Projects')}
        columns={columns}
        data={filteredData}
        loaded={projectsLoaded}
        loadError={projectsLoadError}
        getDataViewRows={getProjectsDataViewRows}
        hideColumnManagement
        hideNameLabelFilters
      />
    </ListPageBody>
  );
};

export default ProjectsList;
