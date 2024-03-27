import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import {
  ListPageCreateLink,
  ListPageHeader,
  getGroupVersionKindForModel,
} from '@openshift-console/dynamic-plugin-sdk';
import { TaskModel } from '../../models';
import { getReferenceForModel } from '../pipelines-overview/utils';
import TasksList from './TasksList';

const taskModelRef = getReferenceForModel(TaskModel);

type TasksListPageProps = {
  namespace: string;
  showTitle?: boolean;
  hideColumnManagement?: boolean;
  hideNameLabelFilters?: boolean;
};

const TasksListPage: React.FC<TasksListPageProps> = ({
  namespace,
  showTitle = true,
  hideColumnManagement = false,
  hideNameLabelFilters = false,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return (
    <>
      <Helmet>
        <title>{t('Tasks')}</title>
      </Helmet>
      {showTitle && (
        <ListPageHeader title={t('Tasks')}>
          <ListPageCreateLink
            createAccessReview={{
              groupVersionKind: getGroupVersionKindForModel(TaskModel),
              namespace,
            }}
            to={
              !namespace
                ? `/k8s/cluster/${taskModelRef}/~new`
                : `/k8s/ns/${namespace}/${taskModelRef}/~new`
            }
          >
            {t('Create {{resourceKind}}', { resourceKind: TaskModel.kind })}
          </ListPageCreateLink>
        </ListPageHeader>
      )}
      <TasksList
        showTitle={showTitle}
        hideColumnManagement={hideColumnManagement}
        hideNameLabelFilters={hideNameLabelFilters}
        namespace={namespace}
      />
    </>
  );
};

export default TasksListPage;
