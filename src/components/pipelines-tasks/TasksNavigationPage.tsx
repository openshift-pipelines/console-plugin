import React from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HorizontalNav,
  ListPageCreateDropdown,
  ListPageHeader,
  NamespaceBar,
  NavPage,
  useActiveNamespace,
} from '@openshift-console/dynamic-plugin-sdk';
import TasksList from './TasksList';
import TaskRunsList from './TaskRunsList';
import ClusterTaskList from './ClusterTaskList';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { ClusterTaskModel, TaskModel, TaskRunModel } from '../../models';
import { ALL_NAMESPACES_KEY, DEFAULT_NAMESPACE } from '../../consts';

import './TasksNavigationPage.scss';

const taskModelRef = getReferenceForModel(TaskModel);
const taskRunModelRef = getReferenceForModel(TaskRunModel);
const clusterTaskModelRef = getReferenceForModel(ClusterTaskModel);

const TasksNavigationPage = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [activeNamespace] = useActiveNamespace();
  const history = useHistory();

  const createItems = {
    tasks: TaskModel.labelKey || TaskModel.label,
    taskRun: TaskRunModel.labelKey || TaskRunModel.label,
    clusterTask: ClusterTaskModel.labelKey || ClusterTaskModel.label,
  };

  const onCreate = (type: string) => {
    return type === 'tasks'
      ? history.push(
          `/k8s/ns/${
            activeNamespace === ALL_NAMESPACES_KEY
              ? DEFAULT_NAMESPACE
              : activeNamespace
          }/${taskModelRef}/~new`,
        )
      : type === 'taskRun'
      ? history.push(
          `/k8s/ns/${
            activeNamespace === ALL_NAMESPACES_KEY
              ? DEFAULT_NAMESPACE
              : activeNamespace
          }/${taskRunModelRef}/~new`,
        )
      : history.push(
          `/k8s/ns/${
            activeNamespace === ALL_NAMESPACES_KEY
              ? DEFAULT_NAMESPACE
              : activeNamespace
          }/${clusterTaskModelRef}/~new`,
        );
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
    {
      href: 'cluster-tasks',
      name: t('ClusterTasks'),
      component: ClusterTaskList,
    },
  ];

  return (
    <>
      {' '}
      <NamespaceBar></NamespaceBar>
      <ListPageHeader title={t('Tasks')}>
        <ListPageCreateDropdown items={createItems} onClick={onCreate}>
          {t('Create')}
        </ListPageCreateDropdown>
      </ListPageHeader>
      <HorizontalNav pages={pages} />
    </>
  );
};

export default TasksNavigationPage;
