import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import {
  K8sResourceCommon,
  ListPageCreateLink,
  ListPageHeader,
  getGroupVersionKindForModel,
} from '@openshift-console/dynamic-plugin-sdk';
import { TaskRunModel } from '../../models';
import { ALL_NAMESPACES_KEY } from '../../consts';
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
      <Helmet>
        <title>{t('TaskRuns')}</title>
      </Helmet>
      {showTitle && (
        <ListPageHeader title={t('TaskRuns')}>
          <ListPageCreateLink
            createAccessReview={{
              groupVersionKind: getGroupVersionKindForModel(TaskRunModel),
              namespace,
            }}
            to={
              namespace === ALL_NAMESPACES_KEY
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
