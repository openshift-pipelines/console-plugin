import {
  Action,
  useAccessReview,
  useDeleteModal,
} from '@openshift-console/dynamic-plugin-sdk';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { ClusterQueueModel } from '../models';
import { ClusterQueueKind } from '../types';
import { resourcePathFromModel } from '../components/utils/utils';

export const useClusterQueueActionsProvider = (resource: ClusterQueueKind) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const navigate = useNavigate();
  const launchDeleteModal = useDeleteModal(resource);
  const { name } = resource.metadata;

  const [canEditClusterQueue] = useAccessReview({
    group: ClusterQueueModel.apiGroup,
    resource: ClusterQueueModel.plural,
    verb: 'update',
    name,
  });
  const [canDeleteClusterQueue] = useAccessReview({
    group: ClusterQueueModel.apiGroup,
    resource: ClusterQueueModel.plural,
    verb: 'delete',
    name,
  });

  const editURL = useMemo(
    () => `${resourcePathFromModel(ClusterQueueModel, name)}/yaml`,
    [name],
  );

  return useMemo<[Action[], boolean, any]>(
    () => [
      [
        {
          id: 'edit-clusterqueue',
          label: t('Edit'),
          cta: () => navigate(editURL),
          disabled: !canEditClusterQueue,
          disabledTooltip: t(
            'Insufficient permissions to edit {{resourceKind}}',
            { resourceKind: ClusterQueueModel.label },
          ),
        },
        {
          id: 'delete-clusterqueue',
          label: t('Delete'),
          cta: () => launchDeleteModal(),
          disabled: !canDeleteClusterQueue,
          disabledTooltip: t(
            'Insufficient permissions to delete {{resourceKind}}',
            { resourceKind: ClusterQueueModel.label },
          ),
        },
      ],
      true,
      undefined,
    ],
    [
      canDeleteClusterQueue,
      canEditClusterQueue,
      editURL,
      launchDeleteModal,
      navigate,
      t,
    ],
  );
};
