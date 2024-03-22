import * as React from 'react';

import { BreadcrumbItem, Text, TextVariants } from '@patternfly/react-core';
import { Link, useHistory } from 'react-router-dom';
import { useParams } from 'react-router-dom-v5-compat';
import {
  getGroupVersionKindForModel,
  useAccessReview,
  useActiveNamespace,
  useAnnotationsModal,
  useDeleteModal,
  useK8sWatchResource,
  useLabelsModal,
} from '@openshift-console/dynamic-plugin-sdk';
import DetailsPage from '../../../components/details-page/DetailsPage';
import { getReferenceForModel } from '../../../components/pipelines-overview/utils';
import { ClusterTaskModel } from '../../../models';
import { TaskKind } from '../../../types';
import { useTranslation } from 'react-i18next';
import { navFactory } from '../../utils/horizontal-nav';
import ClusterTaskDetails from './ClusterTaskDetails';
import ResourceYAMLEditorTab from '../../yaml-editor/ResourceYAMLEditorTab';
import { ALL_NAMESPACES_KEY } from '../../../consts';
import { LoadingBox } from '../../status/status-box';

const ClusterTaskDetailsPage = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const history = useHistory();
  const [activeNamespace] = useActiveNamespace();
  const params = useParams();
  const { name, ns: namespace } = params;
  const [data, loaded] = useK8sWatchResource<TaskKind>({
    groupVersionKind: getGroupVersionKindForModel(ClusterTaskModel),
    namespace: namespace,
    name: name,
    isList: false,
  });
  const launchAnnotationsModal = useAnnotationsModal(data);
  const launchLabelsModal = useLabelsModal(data);
  const launchDeleteModal = useDeleteModal(data);

  const canEditResource = useAccessReview({
    group: ClusterTaskModel.apiGroup,
    resource: ClusterTaskModel.plural,
    verb: 'update',
    name,
    namespace: namespace,
  });
  const canDeleteResource = useAccessReview({
    group: ClusterTaskModel.apiGroup,
    resource: ClusterTaskModel.plural,
    verb: 'delete',
    name,
    namespace: namespace,
  });

  if (!loaded) {
    return <LoadingBox />;
  }
  const editURL = `/k8s/cluster/${getReferenceForModel(
    ClusterTaskModel,
  )}/${encodeURIComponent(name)}/yaml`;

  return (
    <DetailsPage
      obj={data}
      headTitle={name}
      title={<Text component={TextVariants.h1}>{name}</Text>}
      baseURL={
        activeNamespace === ALL_NAMESPACES_KEY
          ? `/tasks/all-namespaces//${getReferenceForModel(
              ClusterTaskModel,
            )}/${name}/cluster-tasks`
          : `/tasks/ns/${activeNamespace}/${getReferenceForModel(
              ClusterTaskModel,
            )}/${name}/cluster-tasks`
      }
      model={ClusterTaskModel}
      breadcrumbs={[
        <BreadcrumbItem key="app-link" component="div">
          <Link
            data-test="breadcrumb-link"
            className="pf-v5-c-breadcrumb__link"
            to={
              activeNamespace === ALL_NAMESPACES_KEY
                ? '/tasks/all-namespaces/cluster-tasks'
                : `/tasks/ns/${activeNamespace}/cluster-tasks`
            }
          >
            {t('ClusterTasks')}
          </Link>
        </BreadcrumbItem>,
        {
          path:
            activeNamespace === ALL_NAMESPACES_KEY
              ? '/tasks/all-namespaces/cluster-tasks'
              : `/tasks/ns/${activeNamespace}/cluster-tasks`,
          name: t('ClusterTask details'),
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
          label: t('Edit {{resourceKind}}', {
            resourceKind: ClusterTaskModel.kind,
          }),
          onClick: () => history.push(editURL),
          disabled: !canEditResource[0],
        },
        {
          key: 'delete-task',
          label: t('Delete {{resourceKind}}', {
            resourceKind: ClusterTaskModel.kind,
          }),
          onClick: () => launchDeleteModal(),
          disabled: !canDeleteResource[0],
        },
      ]}
      pages={[
        navFactory.details(ClusterTaskDetails),
        navFactory.editYaml(ResourceYAMLEditorTab),
      ]}
    />
  );
};

export default ClusterTaskDetailsPage;
