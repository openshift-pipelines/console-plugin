import { useMemo } from 'react';
import {
  Action,
  useAccessReview,
  useDeleteModal,
} from '@openshift-console/dynamic-plugin-sdk';
import { useTranslation } from 'react-i18next';
import { DELETED_RESOURCE_IN_K8S_ANNOTATION } from '../consts';
import { TaskRunModel } from '../models';
import { TaskRunKind } from '../types';
import {
  isResourceLoadedFromTR,
  tektonResultsFlag,
} from '../components/utils/common-utils';

export const useTaskRunActionsProvider = (resource: TaskRunKind) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const message = useMemo(
    () => (
      <p>
        {t(
          'This action will delete resource from k8s but still the resource can be fetched from Tekton Results',
        )}
      </p>
    ),
    [t],
  );

  const shouldShowMessage =
    !isResourceLoadedFromTR(resource) && tektonResultsFlag(resource);
  const launchDeleteModal = useDeleteModal(
    resource,
    undefined,
    shouldShowMessage ? message : undefined,
  );

  const { name, namespace } = resource.metadata || {};

  const [canDeleteResource] = useAccessReview({
    group: TaskRunModel.apiGroup,
    resource: TaskRunModel.plural,
    verb: 'delete',
    name,
    namespace,
  });

  const isDeleteDisabledByAnnotation =
    resource?.metadata?.annotations?.[DELETED_RESOURCE_IN_K8S_ANNOTATION] ===
    'true';

  return useMemo<[Action[], boolean, any]>(() => {
    const actions: Action[] = [
      {
        id: 'delete',
        label: t('Delete {{resourceKind}}', {
          resourceKind: TaskRunModel.kind,
        }),
        cta: () => launchDeleteModal(),
        disabled: isDeleteDisabledByAnnotation || !canDeleteResource,
        disabledTooltip: isDeleteDisabledByAnnotation
          ? t('Resource is being fetched from Tekton Results.')
          : t('Insufficient permissions to delete {{resourceKind}}', {
              resourceKind: TaskRunModel.kind,
            }),
      },
    ];
    return [actions, true, undefined];
  }, [canDeleteResource, isDeleteDisabledByAnnotation, launchDeleteModal, t]);
};
