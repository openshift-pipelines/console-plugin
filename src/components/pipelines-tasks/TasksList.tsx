import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import {
  K8sResourceCommon,
  ListPageBody,
  ListPageCreateLink,
  VirtualizedTable,
  getGroupVersionKindForModel,
  useK8sWatchResource,
  useListPageFilter,
} from '@openshift-console/dynamic-plugin-sdk';
import { TaskModel } from '../../models';
import TaskRow from './TasksRow';
import { useDefaultColumns } from '../list-pages/default-resources';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { ListPageFilter } from '../list-pages/ListPageFilter';

interface TaskListProps {
  showTitle?: boolean;
  hideColumnManagement?: boolean;
  hideNameLabelFilters?: boolean;
  namespace: string;
}
const taskModelRef = getReferenceForModel(TaskModel);

const TasksList: React.FC<TaskListProps> = ({
  showTitle = true,
  hideColumnManagement = false,
  hideNameLabelFilters = false,
  namespace,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const columns = useDefaultColumns();
  const { ns } = useParams();
  namespace = namespace || ns;
  const [data, loaded, loadError] = useK8sWatchResource<K8sResourceCommon[]>({
    groupVersionKind: getGroupVersionKindForModel(TaskModel),
    isList: true,
    namespaced: true,
    namespace,
  });

  const [staticData, filteredData, onFilterChange] = useListPageFilter(data);
  return (
    <>
      <ListPageBody>
        {!showTitle && (
          <ListPageCreateLink
            createAccessReview={{
              groupVersionKind: getGroupVersionKindForModel(TaskModel),
              namespace,
            }}
            to={
              !namespace
                ? `/k8s/cluster/${taskModelRef}/~new`
                : `/k8s/ns/${namespace}/${taskModelRef}/~new`
            }
          >
            {t('Create {{resourceKind}}', { resourceKind: TaskModel.kind })}
          </ListPageCreateLink>
        )}
        <ListPageFilter
          data={staticData}
          onFilterChange={onFilterChange}
          loaded={loaded}
          hideColumnManagement={hideColumnManagement}
          hideLabelFilter={hideNameLabelFilters}
          hideNameLabelFilters={hideNameLabelFilters}
        />
        <VirtualizedTable
          columns={columns}
          data={filteredData}
          loaded={loaded}
          loadError={loadError}
          Row={TaskRow}
          unfilteredData={staticData}
          NoDataEmptyMsg={() => (
            <div className="cp-text-align-center" id="no-resource-msg">
              {t('No Tasks found')}
            </div>
          )}
        />
      </ListPageBody>
    </>
  );
};

export default TasksList;
