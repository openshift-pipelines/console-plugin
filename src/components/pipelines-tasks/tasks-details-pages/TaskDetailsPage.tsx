import { BreadcrumbItem, Text, TextVariants } from '@patternfly/react-core';
import { Link, useHistory } from 'react-router-dom';
import * as React from 'react';
import { useParams } from 'react-router-dom-v5-compat';
import {
  getGroupVersionKindForModel,
  useAccessReview,
  useAnnotationsModal,
  useDeleteModal,
  useK8sWatchResource,
  useLabelsModal,
} from '@openshift-console/dynamic-plugin-sdk';
import TaskDetails from './TaskDetails';
import DetailsPage from '../../../components/details-page/DetailsPage';
import { getReferenceForModel } from '../../../components/pipelines-overview/utils';
import { TaskModel } from '../../../models';
import { TaskKind } from '../../../types';
import { useTranslation } from 'react-i18next';
import { navFactory } from '../../utils/horizontal-nav';
import ResourceYAMLEditorTab from '../../yaml-editor/ResourceYAMLEditorTab';
import { LoadingBox } from '../../status/status-box';

const TaskDetailsPage = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const history = useHistory();

  const params = useParams();
  const { name, ns: namespace } = params;
  const [data, loaded] = useK8sWatchResource<TaskKind>({
    groupVersionKind: getGroupVersionKindForModel(TaskModel),
    namespace: namespace,
    name: name,
    isList: false,
  });
  const launchAnnotationsModal = useAnnotationsModal(data);
  const launchLabelsModal = useLabelsModal(data);
  const launchDeleteModal = useDeleteModal(data);

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

  if (!loaded) {
    return <LoadingBox />;
  }

  const editURL = namespace
    ? `/k8s/ns/${namespace}/${getReferenceForModel(
        TaskModel,
      )}/${encodeURIComponent(name)}/yaml`
    : `/k8s/cluster/${getReferenceForModel(TaskModel)}/${encodeURIComponent(
        name,
      )}/yaml`;

  return (
    <DetailsPage
      obj={data}
      headTitle={name}
      title={<Text component={TextVariants.h1}>{name}</Text>}
      baseURL={`/k8s/ns/${namespace}/${getReferenceForModel(
        TaskModel,
      )}/${name}`}
      model={TaskModel}
      breadcrumbs={[
        <BreadcrumbItem key="app-link" component="div">
          <Link
            data-test="breadcrumb-link"
            className="pf-v5-c-breadcrumb__link"
            to={`/tasks/ns/${namespace}`}
          >
            {t('Tasks')}
          </Link>
        </BreadcrumbItem>,
        {
          path: `/tasks/ns/${namespace}`,
          name: t('Task details'),
        },
      ]}
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
          label: t('Edit {{resourceKind}}', { resourceKind: TaskModel.kind }),
          onClick: () => history.push(editURL),
          disabled: !canEditResource[0],
        },
        {
          key: 'delete-task',
          label: t('Delete {{resourceKind}}', { resourceKind: TaskModel.kind }),
          onClick: () => launchDeleteModal(),
          disabled: !canDeleteResource[0],
        },
      ]}
      pages={[
        navFactory.details(TaskDetails),
        navFactory.editYaml(ResourceYAMLEditorTab),
      ]}
    />
  );
};

export default TaskDetailsPage;
