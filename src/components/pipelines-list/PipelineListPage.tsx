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
  namespace?: string;
  hideTextFilter?: boolean;
};

const PipelineListPage: React.FC<PipelineListPageProps> = (props) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { namespace, hideTextFilter } = props;
  return (
    <>
      <ListPageHeader title={!hideTextFilter && t('Pipelines')}>
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
      <PipelinesList {...props} />
    </>
  );
};

export default PipelineListPage;
