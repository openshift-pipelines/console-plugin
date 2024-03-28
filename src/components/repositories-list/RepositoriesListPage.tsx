import {
  ListPageCreateLink,
  ListPageHeader,
  getGroupVersionKindForModel,
} from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { RepositoryModel } from '../../models';
import { getReferenceForModel } from '../pipelines-overview/utils';
import RepositoriesList from './RepositoriesList';

type RepositoriesListPageProps = {
  namespace?: string;
  hideTextFilter?: boolean;
};

const RepositoriesListPage: React.FC<RepositoriesListPageProps> = (props) => {
  const { t } = useTranslation();
  const { namespace, hideTextFilter } = props;
  return (
    <>
      <ListPageHeader title={!hideTextFilter && t('Repositories')}>
        <ListPageCreateLink
          createAccessReview={{
            groupVersionKind: getGroupVersionKindForModel(RepositoryModel),
            namespace,
          }}
          to={`/k8s/ns/${namespace}/${getReferenceForModel(
            RepositoryModel,
          )}/~new`}
        >
          {t('Create Repository')}
        </ListPageCreateLink>
      </ListPageHeader>
      <RepositoriesList {...props} />
    </>
  );
};

export default RepositoriesListPage;
