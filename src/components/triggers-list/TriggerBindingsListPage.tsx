import { ListPageHeader } from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TriggerBindingModel } from '../../models';
import TriggerBindingsList from './TriggerBindingsList';
import ListPageCreateButton from '../list-pages/ListPageCreateButton';

type TriggerBindingsListPageProps = {
  namespace: string;
  hideNameLabelFilters?: boolean;
};

const TriggerBindingsListPage: React.FC<TriggerBindingsListPageProps> = (
  props,
) => {
  const { t } = useTranslation();
  const { namespace, hideNameLabelFilters } = props;
  return (
    <>
      {hideNameLabelFilters ? (
        <>
          <ListPageCreateButton
            model={TriggerBindingModel}
            namespace={namespace}
            hideTitle={hideNameLabelFilters}
          />
          <TriggerBindingsList {...props} />
        </>
      ) : (
        <>
          <ListPageHeader title={t('TriggerBindings')}>
            <ListPageCreateButton
              model={TriggerBindingModel}
              namespace={namespace}
              hideTitle={hideNameLabelFilters}
            />
          </ListPageHeader>
          <TriggerBindingsList {...props} />
        </>
      )}
    </>
  );
};

export default TriggerBindingsListPage;
