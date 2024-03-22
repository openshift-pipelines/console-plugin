import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  K8sResourceCommon,
  ListPageBody,
  ListPageCreateLink,
  ListPageFilter,
  VirtualizedTable,
  getGroupVersionKindForModel,
  useActiveNamespace,
  useK8sWatchResource,
  useListPageFilter,
} from '@openshift-console/dynamic-plugin-sdk';
import { TaskModel } from '../../models';
import TaskRow from './TasksRow';
import { useDefaultColumns } from '../list-pages/default-resources';
import { ALL_NAMESPACES_KEY } from '../../consts';
import { getReferenceForModel } from '../pipelines-overview/utils';

interface TaskListProps {
  showTitle?: boolean;
  hideColumnManagement?: boolean;
  hideNameLabelFilters?: boolean;
}
const taskModelRef = getReferenceForModel(TaskModel);

const TasksList: React.FC<TaskListProps> = ({
  showTitle = true,
  hideColumnManagement = false,
  hideNameLabelFilters = false,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const columns = useDefaultColumns();
  const [activeNamespace] = useActiveNamespace();
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
      <ListPageBody>
        {!showTitle && (
          <ListPageCreateLink
            createAccessReview={{
              groupVersionKind: getGroupVersionKindForModel(TaskModel),
              namespace: activeNamespace,
            }}
            to={
              activeNamespace === ALL_NAMESPACES_KEY
                ? `/k8s/cluster/${taskModelRef}/~new`
                : `/k8s/ns/${activeNamespace}/${taskModelRef}/~new`
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
            <div className="cos-status-box">
              <div className="pf-v5-u-text-align-center">
                {t('No Tasks found')}
              </div>
            </div>
          )}
        />
      </ListPageBody>
    </>
  );
};

export default TasksList;
