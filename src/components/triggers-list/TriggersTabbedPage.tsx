import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  EventListenerModel,
  TriggerTemplateModel,
  TriggerBindingModel,
  ClusterTriggerBindingModel,
} from '../../models';
import EventListenersList from './EventListenersList';
import TriggerTemplatesList from './TriggerTemplatesList';
import TriggerBindingsList from './TriggerBindingsList';
import ClusterTriggerBindingsList from './ClusterTriggerBindingsList';
import { MultiTabListPage } from '../multi-tab-list';
import { NamespaceBar, NavPage } from '@openshift-console/dynamic-plugin-sdk';

const TriggersTabbedPage: React.FC = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const menuActions = {
    eventListener: { model: EventListenerModel },
    triggerTemplate: { model: TriggerTemplateModel },
    triggerBinding: { model: TriggerBindingModel },
    clusterTriggerBinding: { model: ClusterTriggerBindingModel },
  };
  const pages: NavPage[] = [
    {
      href: '',
      name: t('EventListeners'),
      component: EventListenersList,
    },
    {
      href: 'trigger-templates',
      name: t('TriggerTemplates'),
      component: TriggerTemplatesList,
    },
    {
      href: 'trigger-bindings',
      name: t('TriggerBindings'),
      component: TriggerBindingsList,
    },
    {
      href: 'cluster-trigger-bindings',
      name: t('ClusterTriggerBindings'),
      component: ClusterTriggerBindingsList,
    },
  ];

  return (
    <>
      <NamespaceBar />
      <MultiTabListPage
        pages={pages}
        title={t('Triggers')}
        menuActions={menuActions}
      />
    </>
  );
};

export default TriggersTabbedPage;
