import { ListPageHeader } from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { RepositoryModel } from '../../models';
import RepositoriesList from './RepositoriesList';
import ListPageCreateButton from '../list-pages/ListPageCreateButton';

type RepositoriesListPageProps = {
  namespace?: string;
  hideTextFilter?: boolean;
};

const RepositoriesListPage: React.FC<RepositoriesListPageProps> = (props) => {
  const { t } = useTranslation();
  const { namespace, hideTextFilter } = props;
  return (
    <>
      {hideTextFilter ? (
        <>
          <ListPageCreateButton
            model={RepositoryModel}
            namespace={namespace}
            hideTitle={hideTextFilter}
          />
          <RepositoriesList {...props} />
        </>
      ) : (
        <ListPageHeader title={t('Repositories')}>
          <ListPageCreateButton
            model={RepositoryModel}
            namespace={namespace}
            hideTitle={hideTextFilter}
          />
          <RepositoriesList {...props} />
        </ListPageHeader>
      )}
    </>
  );
};

export default RepositoriesListPage;
