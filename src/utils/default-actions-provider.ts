import {
  Action,
  K8sResourceCommon,
  useAccessReview,
  useAnnotationsModal,
  useDeleteModal,
  useLabelsModal,
} from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import { getReferenceForModel } from '../components/pipelines-overview/utils';
import {
  ClusterTriggerBindingModel,
  EventListenerModel,
  RepositoryModel,
  TaskModel,
  TriggerBindingModel,
  TriggerTemplateModel,
} from '../models';

const getModelForResource = (resource: K8sResourceCommon) => {
  const { kind } = resource;
  switch (kind) {
    case 'Task':
      return TaskModel;
    case 'EventListener':
      return EventListenerModel;
    case 'TriggerTemplate':
      return TriggerTemplateModel;
    case 'TriggerBinding':
      return TriggerBindingModel;
    case 'ClusterTriggerBinding':
      return ClusterTriggerBindingModel;
    case 'Repository':
      return RepositoryModel;
    default:
      return null;
  }
};

export const useDefaultActionsProvider = (resource: K8sResourceCommon) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const navigate = useNavigate();
  const launchDeleteModal = useDeleteModal(resource);
  const launchLabelsModal = useLabelsModal(resource);
  const launchAnnotationsModal = useAnnotationsModal(resource);

  const { name, namespace } = resource.metadata || {};
  const kind = resource.kind;
  const model = getModelForResource(resource);

  /* Using useAccessReview instead of the accessReview field in Action as accessReview does not respect disabledTooltip property */
  const [canEditResource] = useAccessReview({
    group: model?.apiGroup || '',
    resource: model?.plural || '',
    verb: 'update',
    name,
    namespace,
  });

  const [canDeleteResource] = useAccessReview({
    group: model?.apiGroup || '',
    resource: model?.plural || '',
    verb: 'delete',
    name,
    namespace,
  });

  // Building the path to the YAML editor
  const editURL = React.useMemo(() => {
    if (!model || !name || !namespace) return '';
    const reference = getReferenceForModel(model);
    return `/k8s/ns/${namespace}/${reference}/${encodeURIComponent(name)}/yaml`;
  }, [model, name, namespace]);

  return React.useMemo<[Action[], boolean, any]>(() => {
    const actions: Action[] = [
      {
        id: 'edit-labels',
        label: t('Edit labels'),
        cta: () => launchLabelsModal(),
        disabled: !canEditResource,
        disabledTooltip: t('Insufficient permissions to edit labels'),
      },
      {
        id: 'edit-annotations',
        label: t('Edit annotations'),
        cta: () => launchAnnotationsModal(),
        disabled: !canEditResource,
        disabledTooltip: t('Insufficient permissions to edit annotations'),
      },
      {
        id: 'edit-resource',
        label: t('Edit {{resourceKind}}', { resourceKind: kind }),
        cta: () => navigate(editURL),
        disabled: !canEditResource,
        disabledTooltip: t(
          'Insufficient permissions to edit {{resourceKind}}',
          {
            resourceKind: kind,
          },
        ),
      },
      {
        id: 'delete',
        label: t('Delete {{resourceKind}}', { resourceKind: kind }),
        cta: () => launchDeleteModal(),
        disabled: !canDeleteResource,
        disabledTooltip: t(
          'Insufficient permissions to delete {{resourceKind}}',
          {
            resourceKind: kind,
          },
        ),
      },
    ];
    return [actions, true, undefined];
  }, [
    kind,
    editURL,
    launchLabelsModal,
    launchAnnotationsModal,
    navigate,
    launchDeleteModal,
    canEditResource,
    canDeleteResource,
  ]);
};
