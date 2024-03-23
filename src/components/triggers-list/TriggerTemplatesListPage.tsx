import {
  ListPageCreateLink,
  ListPageHeader,
  getGroupVersionKindForModel,
} from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TriggerTemplateModel } from '../../models';
import { getReferenceForModel } from '../pipelines-overview/utils';
import TriggerTemplatesList from './TriggerTemplatesList';

type TriggerTemplatesListPageProps = {
  namespace: string;
};

const TriggerTemplatesListPage: React.FC<TriggerTemplatesListPageProps> = ({
  namespace,
}) => {
  const { t } = useTranslation();
  return (
    <>
      <ListPageHeader title={t('TriggerTemplates')}>
        <ListPageCreateLink
          createAccessReview={{
            groupVersionKind: getGroupVersionKindForModel(TriggerTemplateModel),
            namespace,
          }}
          to={`/k8s/ns/${namespace}/${getReferenceForModel(
            TriggerTemplateModel,
          )}/~new`}
        >
          {t('Create TriggerTemplates')}
        </ListPageCreateLink>
      </ListPageHeader>
      <TriggerTemplatesList namespace={namespace} />
    </>
  );
};

export default TriggerTemplatesListPage;
