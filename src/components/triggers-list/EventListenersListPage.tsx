import { ListPageHeader } from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { EventListenerModel } from '../../models';
import EventListenersList from './EventListenersList';
import ListPageCreateButton from '../list-pages/ListPageCreateButton';

type EventListenersListPageProps = {
  namespace: string;
  hideNameLabelFilters?: boolean;
};

const EventListenersListPage: React.FC<EventListenersListPageProps> = (
  props,
) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { hideNameLabelFilters, namespace } = props;
  return (
    <>
      {hideNameLabelFilters ? (
        <>
          <ListPageCreateButton
            model={EventListenerModel}
            namespace={namespace}
            hideTitle={hideNameLabelFilters}
          />
          <EventListenersList {...props} />
        </>
      ) : (
        <>
          <ListPageHeader title={t('EventListeners')}>
            <ListPageCreateButton
              model={EventListenerModel}
              namespace={namespace}
              hideTitle={hideNameLabelFilters}
            />
          </ListPageHeader>
          <EventListenersList {...props} />
        </>
      )}
    </>
  );
};

export default EventListenersListPage;
