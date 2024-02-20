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
import { ClusterTaskModel } from '../../models';
import { useDefaultColumns } from '../list-pages/default-resources';
import ClusterTaskRow from './ClusterTaskRow';
import { getReferenceForModel } from '../pipelines-overview/utils';

interface ClusterTaskListPageProps {
  showLabelFilters?: boolean;
}

const clusterTaskModelRef = getReferenceForModel(ClusterTaskModel);

const ClusterTaskListPage: React.FC<ClusterTaskListPageProps> = ({
  showLabelFilters,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const history = useHistory();

  const [data, loaded, loadError] = useK8sWatchResource<K8sResourceCommon[]>({
    groupVersionKind: getGroupVersionKindForModel(ClusterTaskModel),
    isList: true,
    namespaced: false,
  });

  const [staticData, filteredData, onFilterChange] = useListPageFilter(data);
  return (
    <>
      <Helmet>
        <title>{t('ClusterTasks')}</title>
      </Helmet>
      <ListPageBody>
        {!showLabelFilters && (
          <ListPageCreateButton
            onClick={() =>
              history.push(`/k8s/cluster/${clusterTaskModelRef}/~new`)
            }
            id="clustertask-create-id"
          >
            {t('Create {{resourceKind}}', {
              resourceKind: ClusterTaskModel.kind,
            })}
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
          Row={ClusterTaskRow}
          unfilteredData={staticData}
        />
      </ListPageBody>
    </>
  );
};

export default ClusterTaskListPage;
