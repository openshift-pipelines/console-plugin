import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  NamespaceBar,
  NavPage,
} from '@openshift-console/dynamic-plugin-sdk';
import TasksList from './TasksList';
import TaskRunsList from './TaskRunsList';
import { TaskModel, TaskRunModel } from '../../models';
import { MenuActions } from '../multi-tab-list/multi-tab-list-page-types';
import { MultiTabListPage } from '../multi-tab-list';

import './TasksNavigationPage.scss';


const TasksNavigationPage = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  
  const menuActions: MenuActions = {
    tasks: {
      model: TaskModel
    },
    taskRun: {
      model: TaskRunModel
    },
  };

  const pages: NavPage[] = [
    {
      href: '',
      name: t('Tasks'),
      component: TasksList,
    },
    {
      href: 'task-runs',
      name: t('TaskRuns'),
      component: TaskRunsList,
    },
  ];

  return (
    <>
      <NamespaceBar />
      <MultiTabListPage
        title={t('Tasks')}
        pages={pages}
        menuActions={menuActions}
      />
    </>
  );
};

export default TasksNavigationPage;
