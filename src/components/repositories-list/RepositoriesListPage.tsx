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
  namespace: string;
};

const RepositoriesListPage: React.FC<RepositoriesListPageProps> = ({
  namespace,
}) => {
  const { t } = useTranslation();
  return (
    <>
      <ListPageHeader title={t('Pipeline Repositories')}>
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
      <RepositoriesList namespace={namespace} />
    </>
  );
};

export default RepositoriesListPage;
