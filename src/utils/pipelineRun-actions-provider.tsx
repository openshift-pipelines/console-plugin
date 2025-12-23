import * as React from 'react';
import {
  Action,
  k8sCreate,
  k8sPatch,
  useAccessReview,
  useDeleteModal,
} from '@openshift-console/dynamic-plugin-sdk';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import { PipelineRunModel } from '../models';
import { PipelineRunKind } from '../types';
import { returnValidPipelineRunModel } from '../components/utils/pipeline-utils';
import {
  getPipelineRunData,
  resourcePathFromModel,
} from '../components/utils/utils';
import {
  shouldHidePipelineRunCancel,
  shouldHidePipelineRunStop,
} from '../components/utils/pipeline-augment';
import {
  isResourceLoadedFromTR,
  tektonResultsFlag,
} from '../components/utils/common-utils';
import { useErrorModal } from '../components/modals/error-modal';
import { useGetActiveUser } from '../components/hooks/hooks';

export const usePipelineRunActionsProvider = (resource: PipelineRunKind) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const navigate = useNavigate();
  const currentUser = useGetActiveUser();
  const launchErrorModal = useErrorModal();

  const { name, namespace } = resource.metadata;

  const hidePLRStop = shouldHidePipelineRunStop(resource, []);
  const hidePLRCancel = shouldHidePipelineRunCancel(resource, []);
  const isDeleteDisabled = isResourceLoadedFromTR(resource);

  const hasPipelineRef = !!(
    resource.spec.pipelineRef?.name ||
    resource.spec.pipelineSpec ||
    resource.spec.pipelineRef?.resolver
  );

  /* Using useAccessReview instead of the accessReview field in Action as accessReview does not respect disabledTooltip property */

  const [canCreatePipelineRun] = useAccessReview({
    group: PipelineRunModel.apiGroup,
    resource: PipelineRunModel.plural,
    verb: 'create',
    namespace,
  });

  const [canUpdatePipelineRun] = useAccessReview({
    group: PipelineRunModel.apiGroup,
    resource: PipelineRunModel.plural,
    verb: 'update',
    name,
    namespace,
  });

  const [canDeletePipelineRun] = useAccessReview({
    group: PipelineRunModel.apiGroup,
    resource: PipelineRunModel.plural,
    verb: 'delete',
    name,
    namespace,
  });

  const message = React.useMemo(
    () => (
      <p>
        {t(
          'This action will delete resource from k8s but still the resource can be fetched from Tekton Results',
        )}
      </p>
    ),
    [],
  );

  const shouldShowMessage =
    !isResourceLoadedFromTR(resource) && tektonResultsFlag(resource);
  const launchDeleteModal = useDeleteModal(
    resource,
    undefined,
    shouldShowMessage ? message : undefined,
  );

  return React.useMemo<[Action[], boolean, any]>(() => {
    const actions: Action[] = [
      {
        id: 'rerun-pipelinerun',
        label: t('Rerun'),
        disabled: !canCreatePipelineRun,
        disabledTooltip: t('Insufficient permissions to create PipelineRun'),
        cta: () => {
          if (namespace && hasPipelineRef) {
            k8sCreate({
              model: returnValidPipelineRunModel(resource),
              data: getPipelineRunData(null, currentUser, resource),
            })
              .then((plr) => {
                navigate(
                  resourcePathFromModel(
                    PipelineRunModel,
                    plr.metadata.name,
                    plr.metadata.namespace,
                  ),
                );
              })
              .catch((err) => {
                launchErrorModal({ error: err.message });
              });
          } else {
            launchErrorModal({
              error: t(
                'Invalid PipelineRun configuration, unable to start Pipeline.',
              ),
            });
          }
        },
      },
      {
        id: 'stop-pipelinerun',
        label: t('Stop'),
        disabled: hidePLRStop || !canUpdatePipelineRun,
        tooltip:
          !hidePLRStop && canUpdatePipelineRun
            ? t('Let the running tasks complete, then execute finally tasks')
            : undefined,
        disabledTooltip: hidePLRStop
          ? t('PipelineRun cannot be stopped in its current state')
          : t('Insufficient permissions to update PipelineRun'),
        cta: () => {
          k8sPatch({
            model: PipelineRunModel,
            resource: {
              metadata: { name, namespace },
            },
            data: [
              {
                op: 'replace',
                path: `/spec/status`,
                value: 'StoppedRunFinally',
              },
            ],
          }).catch((err) => {
            launchErrorModal({ error: err.message });
          });
        },
      },
      {
        id: 'cancel-pipelinerun',
        label: t('Cancel'),
        disabled: hidePLRCancel || !canUpdatePipelineRun,
        tooltip:
          !hidePLRCancel && canUpdatePipelineRun
            ? t(
                'Interrupt any executing non finally tasks, then execute finally tasks',
              )
            : undefined,
        disabledTooltip: hidePLRCancel
          ? t('PipelineRun cannot be cancelled in its current state')
          : t('Insufficient permissions to update PipelineRun'),
        cta: () => {
          k8sPatch({
            model: PipelineRunModel,
            resource: {
              metadata: { name, namespace },
            },
            data: [
              {
                op: 'replace',
                path: `/spec/status`,
                value: 'CancelledRunFinally',
              },
            ],
          }).catch((err) => {
            launchErrorModal({ error: err.message });
          });
        },
      },
      {
        id: 'delete-pipelinerun',
        label: t('Delete PipelineRun'),
        disabled: isDeleteDisabled || !canDeletePipelineRun,
        disabledTooltip: isDeleteDisabled
          ? t(
              'This PipelineRun is loaded from Tekton Results and cannot be deleted',
            )
          : t('Insufficient permissions to delete PipelineRun'),
        cta: () => launchDeleteModal(),
      },
    ];
    return [actions, true, undefined];
  }, [
    name,
    namespace,
    resource,
    currentUser,
    hasPipelineRef,
    hidePLRStop,
    hidePLRCancel,
    isDeleteDisabled,
    navigate,
    launchErrorModal,
    launchDeleteModal,
    canCreatePipelineRun,
    canUpdatePipelineRun,
    canDeletePipelineRun,
  ]);
};
