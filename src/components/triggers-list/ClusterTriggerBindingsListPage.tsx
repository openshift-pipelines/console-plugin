import {
  ListPageCreateLink,
  ListPageHeader,
  getGroupVersionKindForModel,
} from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ClusterTriggerBindingModel } from '../../models';
import { getReferenceForModel } from '../pipelines-overview/utils';
import ClusterTriggerBindingsList from './ClusterTriggerBindingsList';

type ClusterTriggerBindingsListPageProps = {
  namespace: string;
};

const ClusterTriggerBindingsListPage: React.FC<
  ClusterTriggerBindingsListPageProps
> = ({ namespace }) => {
  const { t } = useTranslation();
  return (
    <>
      <ListPageHeader title={t('ClusterTriggerBindings')}>
        <ListPageCreateLink
          createAccessReview={{
            groupVersionKind: getGroupVersionKindForModel(
              ClusterTriggerBindingModel,
            ),
            namespace,
          }}
          to={`/k8s/ns/${namespace}/${getReferenceForModel(
            ClusterTriggerBindingModel,
          )}/~new`}
        >
          {t('Create ClusterTriggerBinding')}
        </ListPageCreateLink>
      </ListPageHeader>
      <ClusterTriggerBindingsList />
    </>
  );
};

export default ClusterTriggerBindingsListPage;
