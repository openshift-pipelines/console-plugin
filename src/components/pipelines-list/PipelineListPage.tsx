import { ListPageHeader } from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { PipelineModel } from '../../models';
import PipelinesList from './PipelinesList';
import ListPageCreateButton from '../list-pages/ListPageCreateButton';

type PipelineListPageProps = {
  namespace?: string;
  hideTextFilter?: boolean;
};

const PipelineListPage: React.FC<PipelineListPageProps> = (props) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { namespace, hideTextFilter } = props;
  return (
    <>
      {hideTextFilter ? (
        <>
          <ListPageCreateButton
            model={PipelineModel}
            namespace={namespace}
            hideTitle={hideTextFilter}
          />
          <PipelinesList {...props} />
        </>
      ) : (
        <ListPageHeader title={t('Pipeline')}>
          <ListPageCreateButton
            model={PipelineModel}
            namespace={namespace}
            hideTitle={hideTextFilter}
          />
          <PipelinesList {...props} />
        </ListPageHeader>
      )}
    </>
  );
};

export default PipelineListPage;
