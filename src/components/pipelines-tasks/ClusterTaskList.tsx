import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  K8sResourceCommon,
  ListPageBody,
  ListPageCreateLink,
  ListPageFilter,
  VirtualizedTable,
  getGroupVersionKindForModel,
  useK8sWatchResource,
  useListPageFilter,
} from '@openshift-console/dynamic-plugin-sdk';
import { ClusterTaskModel } from '../../models';
import { useDefaultColumns } from '../list-pages/default-resources';
import ClusterTaskRow from './ClusterTaskRow';
import { getReferenceForModel } from '../pipelines-overview/utils';

interface ClusterTaskListProps {
  showTitle?: boolean;
  hideColumnManagement?: boolean;
  hideNameLabelFilters?: boolean;
  namespace: string;
}
const clusterTaskModelRef = getReferenceForModel(ClusterTaskModel);

const ClusterTaskList: React.FC<ClusterTaskListProps> = ({
  showTitle = true,
  hideColumnManagement = false,
  hideNameLabelFilters = false,
  namespace,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  const [data, loaded, loadError] = useK8sWatchResource<K8sResourceCommon[]>({
    groupVersionKind: getGroupVersionKindForModel(ClusterTaskModel),
    isList: true,
    namespaced: false,
  });

  const [staticData, filteredData, onFilterChange] = useListPageFilter(data);
  return (
    <>
      <ListPageBody>
        {!showTitle && (
          <ListPageCreateLink
            createAccessReview={{
              groupVersionKind: getGroupVersionKindForModel(ClusterTaskModel),
              namespace,
            }}
            to={`/k8s/cluster/${clusterTaskModelRef}/~new`}
          >
            {t('Create {{resourceKind}}', {
              resourceKind: ClusterTaskModel.kind,
            })}
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
          columns={useDefaultColumns()}
          data={filteredData}
          loaded={loaded}
          loadError={loadError}
          Row={ClusterTaskRow}
          unfilteredData={staticData}
          NoDataEmptyMsg={() => (
            <div className="cos-status-box">
              <div className="pf-v5-u-text-align-center">
                {t('No ClusterTasks found')}
              </div>
            </div>
          )}
        />
      </ListPageBody>
    </>
  );
};

export default ClusterTaskList;
