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
  hideTextFilter?: boolean;
};

const PipelineRunsListPage: React.FC<PipelineRunsListPageProps> = (props) => {
  const { t } = useTranslation();
  const { namespace, hideTextFilter } = props;
  return (
    <>
      <ListPageHeader title={!hideTextFilter && t('PipelineRuns')}>
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
      <PipelineRunsList {...props} />
    </>
  );
};

export default PipelineRunsListPage;
