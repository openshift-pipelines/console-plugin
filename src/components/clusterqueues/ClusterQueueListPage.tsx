import {
  getGroupVersionKindForModel,
  ListPageCreateButton,
  ListPageHeader,
} from '@openshift-console/dynamic-plugin-sdk';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { ClusterQueueModel } from '../../models';
import { getReferenceForModel } from '../pipelines-overview/utils';
import ClusterQueuesList from './ClusterQueuesList';

const ClusterQueueListPage: FC = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const navigate = useNavigate();

  return (
    <>
      <ListPageHeader title={t('ClusterQueues')}>
        <ListPageCreateButton
          createAccessReview={{
            groupVersionKind: getGroupVersionKindForModel(ClusterQueueModel),
          }}
          onClick={() =>
            navigate(
              `/k8s/cluster/${getReferenceForModel(
                ClusterQueueModel,
              )}/~new/builder`,
            )
          }
        >
          {t('Create ClusterQueue')}
        </ListPageCreateButton>
      </ListPageHeader>
      <ClusterQueuesList hideCreateButton />
    </>
  );
};

export default ClusterQueueListPage;
