import {
  ListPageCreateLink,
  ListPageHeader,
  getGroupVersionKindForModel,
} from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TriggerBindingModel } from '../../models';
import { getReferenceForModel } from '../pipelines-overview/utils';
import TriggerBindingsList from './TriggerBindingsList';

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
      <ListPageHeader title={!hideNameLabelFilters && t('TriggerBindings')}>
        <ListPageCreateLink
          createAccessReview={{
            groupVersionKind: getGroupVersionKindForModel(TriggerBindingModel),
            namespace,
          }}
          to={`/k8s/ns/${namespace}/${getReferenceForModel(
            TriggerBindingModel,
          )}/~new`}
        >
          {t('Create TriggerBindings')}
        </ListPageCreateLink>
      </ListPageHeader>
      <TriggerBindingsList {...props} />
    </>
  );
};

export default TriggerBindingsListPage;
