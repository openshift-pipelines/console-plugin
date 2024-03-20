import {
  ListPageCreateLink,
  ListPageHeader,
  getGroupVersionKindForModel,
} from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { PipelineRunModel } from '../../models';
import { getReferenceForModel } from '../pipelines-overview/utils';
import PipelineRunsList from './PipelineRunsList';

type PipelineRunsListPageProps = {
  namespace: string;
};

const PipelineRunsListPage: React.FC<PipelineRunsListPageProps> = ({
  namespace,
}) => {
  const { t } = useTranslation();
  return (
    <>
      <ListPageHeader title={t('PipelineRuns')}>
        <ListPageCreateLink
          createAccessReview={{
            groupVersionKind: getGroupVersionKindForModel(PipelineRunModel),
            namespace,
          }}
          to={`/k8s/ns/${namespace}/${getReferenceForModel(
            PipelineRunModel,
          )}/~new`}
        >
          {t('Create PipelineRun')}
        </ListPageCreateLink>
      </ListPageHeader>
      <PipelineRunsList namespace={namespace} />
    </>
  );
};

export default PipelineRunsListPage;
