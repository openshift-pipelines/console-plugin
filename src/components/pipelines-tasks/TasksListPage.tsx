import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useParams } from 'react-router-dom-v5-compat';
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

interface TasksListPageProps {
  showLabelFilters?: boolean;
}

const taskModelRef = getReferenceForModel(TaskModel);

const TasksListPage: React.FC<TasksListPageProps> = ({ showLabelFilters }) => {
  const { t } = useTranslation('plugin__pipeline-console-plugin');
  const params = useParams();
  const history = useHistory();
  const { ns: namespace } = params;
  const [data, loaded, loadError] = useK8sWatchResource<K8sResourceCommon[]>({
    groupVersionKind: getGroupVersionKindForModel(TaskModel),
    isList: true,
    namespaced: true,
    namespace,
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
              history.push(`/k8s/ns/${namespace}/${taskModelRef}/~new`)
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
