import {
  ListPageCreateLink,
  ListPageHeader,
} from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { PipelineModel } from '../../models';
import PipelinesList from './PipelinesList';
import { getReferenceForModel } from '../pipelines-overview/utils';

type PipelineListPageProps = {
  namespace: string;
};

const PipelineListPage: React.FC<PipelineListPageProps> = ({ namespace }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return (
    <>
      <ListPageHeader title={t('Pipelines')}>
        <ListPageCreateLink
          createAccessReview={{
            groupVersionKind: getReferenceForModel(PipelineModel),
            namespace,
          }}
          to={`/k8s/ns/${namespace}/${getReferenceForModel(
            PipelineModel,
          )}/~new/builder`}
        >
          {t('Create Pipeline')}
        </ListPageCreateLink>
      </ListPageHeader>
      <PipelinesList namespace={namespace} />
    </>
  );
};

export default PipelineListPage;
