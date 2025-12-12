import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  BreadcrumbItem,
  Content,
  ContentVariants,
} from '@patternfly/react-core';
import { Link, useNavigate, useParams } from 'react-router-dom-v5-compat';
import {
  getGroupVersionKindForModel,
  useAccessReview,
  useAnnotationsModal,
  useDeleteModal,
  useK8sWatchResource,
  useLabelsModal,
} from '@openshift-console/dynamic-plugin-sdk';
import TaskDetails from './TaskDetails';
import DetailsPage from '../details-page/DetailsPage';
import { navFactory } from '../utils/horizontal-nav';
import { TaskModel } from '../../models';
import { TaskKind } from '../../types';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { getTaskName } from '../utils/pipeline-augment';
import { ErrorPage404 } from '../common/error';
import { LoadingBox } from '../status/status-box';
import ResourceYAMLEditorTab from '../yaml-editor/ResourceYAMLEditorTab';

type TaskDetailsPageProps = {
  name: string;
  namespace: string;
};

const TaskDetailsPage: React.FC<TaskDetailsPageProps> = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const params = useParams();
  const navigate = useNavigate();
  const { name, ns: namespace } = params;
  const [task, loaded, loadError] = useK8sWatchResource<TaskKind>({
    groupVersionKind: getGroupVersionKindForModel(TaskModel),
    namespace,
    name,
  });
  const launchAnnotationsModal = useAnnotationsModal(task);
  const launchLabelsModal = useLabelsModal(task);
  const launchDeleteModal = useDeleteModal(task);
  const canEditResource = useAccessReview({
    group: TaskModel.apiGroup,
    resource: TaskModel.plural,
    verb: 'update',
    name,
    namespace,
  });
  const canDeleteResource = useAccessReview({
    group: TaskModel.apiGroup,
    resource: TaskModel.plural,
    verb: 'delete',
    name,
    namespace,
  });

  const editURL = `/k8s/ns/${namespace}/${getReferenceForModel(
    TaskModel,
  )}/${encodeURIComponent(name)}/yaml`;

  const resourceTitleFunc = React.useMemo(() => {
    return <div className="task-details-page">{getTaskName(task)} </div>;
  }, [task]);

  if (!loaded) {
    return loadError ? <ErrorPage404 /> : <LoadingBox />;
  }

  return (
    <DetailsPage
      obj={task}
      model={TaskModel}
      title={
        <Content component={ContentVariants.h1}>{resourceTitleFunc}</Content>
      }
      actions={[
        {
          key: 'edit-labels',
          label: t('Edit labels'),
          onClick: () => launchLabelsModal(),
          disabled: !canEditResource[0],
        },
        {
          key: 'edit-annotations',
          label: t('Edit annotations'),
          onClick: () => launchAnnotationsModal(),
          disabled: !canEditResource[0],
        },
        {
          key: 'edit-task',
          label: t('Edit {{resourceKind}}', {
            resourceKind: TaskModel.kind,
          }),
          onClick: () => navigate(editURL),
          disabled: !canEditResource[0],
        },
        {
          key: 'delete-task',
          label: t('Delete {{resourceKind}}', {
            resourceKind: TaskModel.kind,
          }),
          onClick: () => launchDeleteModal(),
          disabled: !canDeleteResource[0],
        },
      ]}
      pages={[
        navFactory.details(TaskDetails),
        navFactory.editYaml(ResourceYAMLEditorTab),
      ]}
      breadcrumbs={[
        <BreadcrumbItem key="app-link" component="div">
          <Link
            data-test="breadcrumb-link"
            className="pf-v6-c-breadcrumb__link"
            to={`/tasks/ns/${namespace}/`}
          >
            {t('Tasks')}
          </Link>
        </BreadcrumbItem>,
        {
          path: `/tasks/ns/${namespace}/`,
          name: t('Task details'),
        },
      ]}
    />
  );
};

export default TaskDetailsPage;
