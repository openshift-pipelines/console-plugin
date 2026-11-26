import {
  Action,
  useAccessReview,
  useDeleteModal,
} from '@openshift-console/dynamic-plugin-sdk';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { LocalQueueModel } from '../models';
import { LocalQueueKind } from '../types';

export const useLocalQueueActionsProvider = (resource: LocalQueueKind) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const launchDeleteModal = useDeleteModal(resource);
  const { name, namespace } = resource.metadata;

  const [canDeleteLocalQueue] = useAccessReview({
    group: LocalQueueModel.apiGroup,
    resource: LocalQueueModel.plural,
    verb: 'delete',
    name,
    namespace,
  });

  return useMemo<[Action[], boolean, any]>(
    () => [
      [
        {
          id: 'delete-localqueue',
          label: t('Delete'),
          cta: () => launchDeleteModal(),
          disabled: !canDeleteLocalQueue,
          disabledTooltip: t(
            'Insufficient permissions to delete {{resourceKind}}',
            { resourceKind: LocalQueueModel.label },
          ),
        },
      ],
      true,
      undefined,
    ],
    [canDeleteLocalQueue, launchDeleteModal, t],
  );
};
