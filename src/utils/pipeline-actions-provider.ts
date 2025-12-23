import {
  Action,
  k8sCreate,
  useAccessReview,
  useAnnotationsModal,
  useDeleteModal,
  useLabelsModal,
  useOverlay,
} from '@openshift-console/dynamic-plugin-sdk';
import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import { useGetActiveUser } from '../components/hooks/hooks';
import { useErrorModal } from '../components/modals/error-modal';
import {
  AddTriggerModal,
  RemoveTriggerModal,
  startPipelineModal,
} from '../components/start-pipeline';
import { rerunPipeline } from '../components/utils/pipelines-actions';
import { usePipelineTriggerTemplateNames } from '../components/utils/triggers';
import {
  getPipelineRunData,
  resourcePathFromModel,
} from '../components/utils/utils';
import { PipelineModel, PipelineRunModel } from '../models';
import { PipelineKind, PipelineRunKind, PipelineWithLatest } from '../types';

export const triggerPipeline = (
  pipeline: PipelineKind,
  currentUser: string,
  onSubmit?: (pipelineRun: PipelineRunKind) => void,
  onError?: (error: string) => void,
) => {
  k8sCreate({
    model: PipelineRunModel,
    data: getPipelineRunData(pipeline, currentUser),
  })
    .then(onSubmit)
    .catch((err) => {
      if (onError) {
        onError(err.message);
      }
    });
};

export const usePipelineActionsProvider = (resource: PipelineWithLatest) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const launchDeleteModal = useDeleteModal(resource);
  const launchLabelsModal = useLabelsModal(resource);
  const launchAnnotationsModal = useAnnotationsModal(resource);
  const launchOverlay = useOverlay();
  const launchErrorModal = useErrorModal();
  const navigate = useNavigate();
  const currentUser = useGetActiveUser();

  const { name, namespace } = resource.metadata;
  const templateNames = usePipelineTriggerTemplateNames(name, namespace) || [];

  const hasParams = !_.isEmpty(_.get(resource, ['spec', 'params'], []));
  const hasResources = !_.isEmpty(_.get(resource, ['spec', 'resources'], []));
  const hasWorkspaces = !_.isEmpty(_.get(resource, ['spec', 'workspaces'], []));
  const hasLatestRun = !!resource.latestRun;
  const hasTriggers = !_.isEmpty(templateNames);

  /* Using useAccessReview instead of the accessReview field in Action as accessReview does not respect disabledTooltip property */

  const [canCreatePipelineRun] = useAccessReview({
    group: PipelineRunModel.apiGroup,
    resource: PipelineRunModel.plural,
    verb: 'create',
    namespace,
  });

  const [canUpdatePipeline] = useAccessReview({
    group: PipelineModel.apiGroup,
    resource: PipelineModel.plural,
    verb: 'update',
    name,
    namespace,
  });

  const [canDeletePipeline] = useAccessReview({
    group: PipelineModel.apiGroup,
    resource: PipelineModel.plural,
    verb: 'delete',
    name,
    namespace,
  });

  // Callback to navigate to the newly created PipelineRun
  const handlePipelineRunSubmit = React.useCallback(
    (pipelineRun: PipelineRunKind) => {
      navigate(
        resourcePathFromModel(
          PipelineRunModel,
          pipelineRun.metadata.name,
          pipelineRun.metadata.namespace,
        ),
      );
    },
    [navigate],
  );

  return React.useMemo<[Action[], boolean, any]>(() => {
    const actions: Action[] = [
      {
        id: 'start-pipeline',
        label: t('Start'),
        disabled: !canCreatePipelineRun,
        disabledTooltip: t('Insufficient permissions to create PipelineRun'),
        cta: () => {
          if (hasParams || hasResources || hasWorkspaces) {
            launchOverlay(startPipelineModal, {
              pipeline: resource,
              onSubmit: handlePipelineRunSubmit,
            });
          } else {
            triggerPipeline(
              resource,
              currentUser,
              handlePipelineRunSubmit,
              (error) => launchErrorModal({ error }),
            );
          }
        },
      },
      {
        id: 'start-last-run',
        label: t('Start last run'),
        disabled: !hasLatestRun || !canCreatePipelineRun,
        disabledTooltip: !hasLatestRun
          ? t('No latest run available')
          : t('Insufficient permissions to create PipelineRun'),
        cta: () => {
          if (resource.latestRun) {
            rerunPipeline(
              PipelineRunModel,
              resource.latestRun,
              currentUser,
              launchOverlay,
              {
                onComplete: handlePipelineRunSubmit,
              },
            );
          }
        },
      },
      {
        id: 'add-trigger',
        label: t('Add Trigger'),
        disabled: !canUpdatePipeline,
        disabledTooltip: t('Insufficient permissions to update Pipeline'),
        cta: () => {
          launchOverlay(AddTriggerModal, {
            pipeline: resource,
          });
        },
      },
      {
        id: 'remove-trigger',
        label: t('Remove Trigger'),
        disabled: !hasTriggers || !canUpdatePipeline,
        disabledTooltip: !hasTriggers
          ? t('No triggers to remove')
          : t('Insufficient permissions to update Pipeline'),
        cta: () => {
          launchOverlay(RemoveTriggerModal, {
            pipeline: resource,
          });
        },
      },
      {
        id: 'edit-pipeline',
        label: t('Edit Pipeline'),
        disabled: !canUpdatePipeline,
        disabledTooltip: t('Insufficient permissions to update Pipeline'),
        cta: () => {
          navigate(
            `${resourcePathFromModel(PipelineModel, name, namespace)}/builder`,
          );
        },
      },
      {
        id: 'edit-labels',
        label: t('Edit labels'),
        disabled: !canUpdatePipeline,
        disabledTooltip: t('Insufficient permissions to update Pipeline'),
        cta: () => launchLabelsModal(),
      },
      {
        id: 'edit-annotations',
        label: t('Edit annotations'),
        disabled: !canUpdatePipeline,
        disabledTooltip: t('Insufficient permissions to update Pipeline'),
        cta: () => launchAnnotationsModal(),
      },
      {
        id: 'delete',
        label: t('Delete'),
        disabled: !canDeletePipeline,
        disabledTooltip: t('Insufficient permissions to delete Pipeline'),
        cta: () => launchDeleteModal(),
      },
    ];
    return [actions, true, undefined];
  }, [
    hasParams,
    hasResources,
    hasWorkspaces,
    hasLatestRun,
    hasTriggers,
    name,
    namespace,
    currentUser,
    resource,
    handlePipelineRunSubmit,
    launchOverlay,
    launchErrorModal,
    launchLabelsModal,
    launchAnnotationsModal,
    launchDeleteModal,
    navigate,
    canCreatePipelineRun,
    canUpdatePipeline,
    canDeletePipeline,
  ]);
};
