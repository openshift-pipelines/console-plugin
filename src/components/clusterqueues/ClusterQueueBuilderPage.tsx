import type { FC } from 'react';
import {
  getGroupVersionKindForModel,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { Alert } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { ClusterQueueModel } from '../../models';
import { LoadingBox } from '../status/status-box';
import { SyncedResourceEditor } from '../synced-resource-editor';
import ClusterQueueFields from './ClusterQueueFields';
import {
  clusterQueueAdapter,
  initialClusterQueueResource,
} from './clusterQueueAdapter';
import type { ClusterQueueResource } from './clusterQueueAdapter';
import './ClusterQueueBuilderPage.scss';

const ClusterQueueBuilderPage: FC = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { clusterQueueName } = useParams<{ clusterQueueName?: string }>();
  const isEdit = Boolean(clusterQueueName);
  const [existingResource, loaded, loadError] =
    useK8sWatchResource<ClusterQueueResource>(
      clusterQueueName
        ? {
            groupVersionKind: getGroupVersionKindForModel(ClusterQueueModel),
            name: clusterQueueName,
          }
        : null,
    );

  if (isEdit && loadError) {
    return (
      <div className="pipelines-console-plugin-clusterqueue-page">
        <Alert
          isInline
          title={t('Unable to load ClusterQueue')}
          variant="danger"
        />
      </div>
    );
  }

  if (isEdit && (!loaded || !existingResource)) return <LoadingBox />;

  const title = isEdit ? t('Edit ClusterQueue') : t('Create ClusterQueue');
  const initialResource = existingResource ?? initialClusterQueueResource;

  return (
    <div className="pipelines-console-plugin-clusterqueue-page">
      <SyncedResourceEditor
        adapter={clusterQueueAdapter}
        initialResource={initialResource}
        isCreate={!isEdit}
        title={title}
      >
        <ClusterQueueFields isEdit={isEdit} />
      </SyncedResourceEditor>
    </div>
  );
};

export default ClusterQueueBuilderPage;
