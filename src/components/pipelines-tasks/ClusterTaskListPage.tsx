import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import {
  ListPageCreateLink,
  ListPageHeader,
  getGroupVersionKindForModel,
} from '@openshift-console/dynamic-plugin-sdk';
import { ClusterTaskModel } from '../../models';
import { getReferenceForModel } from '../pipelines-overview/utils';
import ClusterTaskList from './ClusterTaskList';

const clusterTaskModelRef = getReferenceForModel(ClusterTaskModel);

type ClusterTaskListPageProps = {
  namespace: string;
  showTitle?: boolean;
  hideColumnManagement?: boolean;
  hideNameLabelFilters?: boolean;
};

const ClusterTaskListPage: React.FC<ClusterTaskListPageProps> = ({
  namespace,
  showTitle = true,
  hideColumnManagement = false,
  hideNameLabelFilters = false,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  return (
    <>
      <Helmet>
        <title>{t('ClusterTasks')}</title>
      </Helmet>
      {showTitle && (
        <ListPageHeader title={t('ClusterTasks')}>
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
        </ListPageHeader>
      )}
      <ClusterTaskList
        showTitle={showTitle}
        hideColumnManagement={hideColumnManagement}
        hideNameLabelFilters={hideNameLabelFilters}
        namespace={namespace}
      />
    </>
  );
};

export default ClusterTaskListPage;
