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
};

const TriggerBindingsListPage: React.FC<TriggerBindingsListPageProps> = ({
  namespace,
}) => {
  const { t } = useTranslation();
  return (
    <>
      <ListPageHeader title={t('TriggerBindings')}>
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
      <TriggerBindingsList namespace={namespace} />
    </>
  );
};

export default TriggerBindingsListPage;
