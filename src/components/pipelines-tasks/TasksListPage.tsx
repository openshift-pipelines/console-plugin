import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import {
  K8sResourceCommon,
  ListPageBody,
  ListPageCreateButton,
  ListPageFilter,
  VirtualizedTable,
  getGroupVersionKindForModel,
  useK8sWatchResource,
  useListPageFilter,
} from '@openshift-console/dynamic-plugin-sdk';
import { TaskModel } from '../../models';
import TaskRow from './TasksRow';
import { useDefaultColumns } from '../list-pages/default-resources';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { ALL_NAMESPACES_KEY } from '../../consts';
import useActiveNamespace from '../hooks/useActiveNamespace';

interface TasksListPageProps {
  showLabelFilters?: boolean;
}

const taskModelRef = getReferenceForModel(TaskModel);

const TasksListPage: React.FC<TasksListPageProps> = ({ showLabelFilters }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [activeNamespace] = useActiveNamespace();
  const history = useHistory();
  const [data, loaded, loadError] = useK8sWatchResource<K8sResourceCommon[]>({
    groupVersionKind: getGroupVersionKindForModel(TaskModel),
    isList: true,
    namespaced: true,
    namespace:
      activeNamespace === ALL_NAMESPACES_KEY ? undefined : activeNamespace,
  });

  const [staticData, filteredData, onFilterChange] = useListPageFilter(data);
  return (
    <>
      <Helmet>
        <title>{t('Tasks')}</title>
      </Helmet>
      <ListPageBody>
        {!showLabelFilters && (
          <ListPageCreateButton
            onClick={() =>
              history.push(
                activeNamespace === ALL_NAMESPACES_KEY
                  ? `/k8s/cluster/${taskModelRef}/~new`
                  : `/k8s/ns/${activeNamespace}/${taskModelRef}/~new`,
              )
            }
            id="task-create-id"
          >
            {t('Create {{resourceKind}}', { resourceKind: TaskModel.kind })}
          </ListPageCreateButton>
        )}
        <ListPageFilter
          data={staticData}
          onFilterChange={onFilterChange}
          loaded={loaded}
          hideNameLabelFilters={!showLabelFilters}
        />
        <VirtualizedTable
          columns={useDefaultColumns()}
          data={filteredData}
          loaded={loaded}
          loadError={loadError}
          Row={TaskRow}
          unfilteredData={staticData}
        />
      </ListPageBody>
    </>
  );
};

export default TasksListPage;
