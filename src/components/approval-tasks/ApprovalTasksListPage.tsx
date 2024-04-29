import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ListPageHeader } from '@openshift-console/dynamic-plugin-sdk';
import ListPageCreateButton from '../list-pages/ListPageCreateButton';
import { ApprovalTaskModel } from '../../models';
import ApprovalTasksList from './ApprovalTasksList';

type ApprovalTasksListPageProps = {
  namespace: string;
  hideTextFilter?: boolean;
};

const ApprovalTasksListPage: React.FC<ApprovalTasksListPageProps> = (props) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { namespace, hideTextFilter } = props;
  return (
    <>
      {hideTextFilter ? (
        <>
          <ListPageCreateButton
            model={ApprovalTaskModel}
            namespace={namespace}
            hideTitle={hideTextFilter}
          />
          <ApprovalTasksList {...props} />
        </>
      ) : (
        <ListPageHeader title={t('ApprovalTasks')}>
          <ListPageCreateButton
            model={ApprovalTaskModel}
            namespace={namespace}
            hideTitle={hideTextFilter}
          />
          <ApprovalTasksList {...props} />
        </ListPageHeader>
      )}
    </>
  );
};

export default ApprovalTasksListPage;
