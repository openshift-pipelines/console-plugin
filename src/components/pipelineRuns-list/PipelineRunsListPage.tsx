import { ListPageHeader } from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { PipelineRunModel } from '../../models';
import PipelineRunsList from './PipelineRunsList';
import ListPageCreateButton from '../list-pages/ListPageCreateButton';

type PipelineRunsListPageProps = {
  namespace: string;
  hideTextFilter?: boolean;
};

const PipelineRunsListPage: React.FC<PipelineRunsListPageProps> = (props) => {
  const { t } = useTranslation();
  const { namespace, hideTextFilter } = props;
  return (
    <>
      {hideTextFilter ? (
        <>
          <ListPageCreateButton
            model={PipelineRunModel}
            namespace={namespace}
            hideTitle={hideTextFilter}
          />
          <PipelineRunsList {...props} />
        </>
      ) : (
        <>
          <ListPageHeader title={t('PipelineRuns')}>
            <ListPageCreateButton
              model={PipelineRunModel}
              namespace={namespace}
              hideTitle={hideTextFilter}
            />
          </ListPageHeader>
          <PipelineRunsList {...props} />
        </>
      )}
    </>
  );
};

export default PipelineRunsListPage;
