import {
  ListPageBody,
  ListPageCreateButton,
  getGroupVersionKindForModel,
} from '@openshift-console/dynamic-plugin-sdk';
import { ConsoleDataView } from '@openshift-console/dynamic-plugin-sdk-internal';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { ClusterQueueModel } from '../../models';
import { ClusterQueueKind } from '../../types';
import { ListPageSearchToolbar } from '../common/ListPageSearchToolbar';
import { useClusterQueues } from '../hooks/useMultiKueueResources';
import { useDataViewFilter } from '../hooks/useDataViewFilter';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { getClusterQueueDataViewRows } from './ClusterQueueRow';
import useClusterQueuesColumns from './useClusterQueuesColumns';

type ClusterQueuesListProps = {
  hideCreateButton?: boolean;
};

const ClusterQueuesList: FC<ClusterQueuesListProps> = ({
  hideCreateButton = false,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const navigate = useNavigate();
  const location = useLocation();
  const columns = useClusterQueuesColumns();
  const [clusterQueues, loaded, loadError] = useClusterQueues();
  const { filterValues, onFilterChange, filteredData } =
    useDataViewFilter<ClusterQueueKind>({
      data: clusterQueues || [],
      options: {
        getName: (clusterQueue) =>
          `${clusterQueue.metadata.name} ${
            clusterQueue.spec?.cohortName || ''
          }`,
      },
    });

  return (
    <ListPageBody>
      <ListPageSearchToolbar
        value={filterValues.name}
        onChange={(value) => onFilterChange('name', value)}
        placeholder={t('Search by name or cohort')}
        actions={
          !hideCreateButton && (
            <ListPageCreateButton
              createAccessReview={{
                groupVersionKind:
                  getGroupVersionKindForModel(ClusterQueueModel),
              }}
              onClick={() =>
                navigate(
                  `/k8s/cluster/${getReferenceForModel(
                    ClusterQueueModel,
                  )}/~new/builder`,
                  { state: { from: `${location.pathname}${location.search}` } },
                )
              }
            >
              {t('Create ClusterQueue')}
            </ListPageCreateButton>
          )
        }
      />
      <ConsoleDataView<ClusterQueueKind>
        label={t('ClusterQueues')}
        columns={columns}
        data={filteredData}
        loaded={loaded}
        loadError={loadError}
        getDataViewRows={getClusterQueueDataViewRows}
        hideColumnManagement
        hideNameLabelFilters
      />
    </ListPageBody>
  );
};

export default ClusterQueuesList;
