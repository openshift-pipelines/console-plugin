import * as React from 'react';
import { useTranslation } from 'react-i18next';
import useProjectsColumns from './useProjectsColumns';
import {
  getGroupVersionKindForModel,
  K8sResourceKind,
  ListPageBody,
  ListPageFilter,
  useK8sWatchResource,
  useListPageFilter,
  VirtualizedTable,
} from '@openshift-console/dynamic-plugin-sdk';
import { ProjectModel } from '../../models';
import ProjectsRow from './ProjectsRow';

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
  const [staticData, filteredData, onFilterChange] =
    useListPageFilter(projects);
  return (
    <ListPageBody>
      <ListPageFilter
        data={staticData}
        onFilterChange={onFilterChange}
        loaded={projectsLoaded}
      />
      <VirtualizedTable
        EmptyMsg={() => (
          <div
            className="pf-v5-u-text-align-center virtualized-table-empty-msg"
            id="no-templates-msg"
          >
            {t('No Projects found')}
          </div>
        )}
        columns={columns}
        data={filteredData}
        loaded={projectsLoaded}
        loadError={projectsLoadError}
        Row={ProjectsRow}
        unfilteredData={staticData}
      />
    </ListPageBody>
  );
};

export default ProjectsList;
