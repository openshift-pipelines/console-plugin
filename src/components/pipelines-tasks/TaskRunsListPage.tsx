import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  DocumentTitle,
  K8sResourceCommon,
  ListPageCreateLink,
  ListPageHeader,
  getGroupVersionKindForModel,
} from '@openshift-console/dynamic-plugin-sdk';
import { TaskRunModel } from '../../models';
import { getReferenceForModel } from '../pipelines-overview/utils';
import TaskRunsList from './TaskRunsList';

interface TaskRunsListPageProps {
  showPipelineColumn?: boolean;
  obj?: K8sResourceCommon;
  namespace: string;
  showTitle?: boolean;
  hideColumnManagement?: boolean;
  hideNameLabelFilters?: boolean;
}

const taskRunModelRef = getReferenceForModel(TaskRunModel);

const TaskRunsListPage: React.FC<TaskRunsListPageProps> = ({
  showPipelineColumn = true,
  namespace,
  showTitle = true,
  hideColumnManagement = false,
  hideNameLabelFilters = false,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return (
    <>
      <DocumentTitle>
        {t('TaskRuns')}
      </DocumentTitle>
      {showTitle && (
        <ListPageHeader title={t('TaskRuns')}>
          <ListPageCreateLink
            createAccessReview={{
              groupVersionKind: getGroupVersionKindForModel(TaskRunModel),
              namespace,
            }}
            to={
              !namespace
                ? `/k8s/cluster/${taskRunModelRef}/~new`
                : `/k8s/ns/${namespace}/${taskRunModelRef}/~new`
            }
          >
            {t('Create {{resourceKind}}', { resourceKind: TaskRunModel.kind })}
          </ListPageCreateLink>
        </ListPageHeader>
      )}
      <TaskRunsList
        showTitle={showTitle}
        showPipelineColumn={showPipelineColumn}
        hideColumnManagement={hideColumnManagement}
        hideNameLabelFilters={hideNameLabelFilters}
      />
    </>
  );
};
export default TaskRunsListPage;
