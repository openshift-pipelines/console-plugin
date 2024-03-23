import {
  ListPageCreateLink,
  ListPageHeader,
  getGroupVersionKindForModel,
} from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { EventListenerModel } from '../../models';
import { getReferenceForModel } from '../pipelines-overview/utils';
import EventListenersList from './EventListenersList';

type EventListenersListPageProps = {
  namespace: string;
};

const EventListenersListPage: React.FC<EventListenersListPageProps> = ({
  namespace,
}) => {
  const { t } = useTranslation();
  return (
    <>
      <ListPageHeader title={t('EventListeners')}>
        <ListPageCreateLink
          createAccessReview={{
            groupVersionKind: getGroupVersionKindForModel(EventListenerModel),
            namespace,
          }}
          to={`/k8s/ns/${namespace}/${getReferenceForModel(
            EventListenerModel,
          )}/~new`}
        >
          {t('Create EventListener')}
        </ListPageCreateLink>
      </ListPageHeader>
      <EventListenersList namespace={namespace} />
    </>
  );
};

export default EventListenersListPage;
