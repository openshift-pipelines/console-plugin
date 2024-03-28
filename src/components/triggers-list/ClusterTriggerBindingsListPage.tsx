import { ListPageHeader } from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ClusterTriggerBindingModel } from '../../models';
import ClusterTriggerBindingsList from './ClusterTriggerBindingsList';
import ListPageCreateButton from '../list-pages/ListPageCreateButton';

type ClusterTriggerBindingsListPageProps = {
  namespace: string;
  hideNameLabelFilters?: boolean;
};

const ClusterTriggerBindingsListPage: React.FC<
  ClusterTriggerBindingsListPageProps
> = (props) => {
  const { t } = useTranslation();
  const { namespace, hideNameLabelFilters } = props;
  return (
    <>
      {hideNameLabelFilters ? (
        <>
          <ListPageCreateButton
            model={ClusterTriggerBindingModel}
            namespace={namespace}
            hideTitle={hideNameLabelFilters}
          />
          <ClusterTriggerBindingsList {...props} />
        </>
      ) : (
        <>
          <ListPageHeader title={t('ClusterTriggerBindings')}>
            <ListPageCreateButton
              model={ClusterTriggerBindingModel}
              namespace={namespace}
              hideTitle={hideNameLabelFilters}
            />
          </ListPageHeader>
          <ClusterTriggerBindingsList {...props} />
        </>
      )}
    </>
  );
};

export default ClusterTriggerBindingsListPage;
