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
  hideNameLabelFilters?: boolean;
};

const EventListenersListPage: React.FC<EventListenersListPageProps> = (
  props,
) => {
  const { t } = useTranslation();
  const { hideNameLabelFilters, namespace } = props;
  return (
    <>
      <ListPageHeader title={!hideNameLabelFilters && t('EventListeners')}>
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
      <EventListenersList {...props} />
    </>
  );
};

export default EventListenersListPage;
