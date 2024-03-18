import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Card, Tab, Tabs } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import {
  ListPageCreateDropdown,
  ListPageHeader,
  NamespaceBar,
  useActiveNamespace,
} from '@openshift-console/dynamic-plugin-sdk';
import TaskRunsListPage from './TaskRunsListPage';
import ClusterTaskPage from './ClusterTaskListPage';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { ClusterTaskModel, TaskModel, TaskRunModel } from '../../models';
import TasksListPage from './TasksListPage';
import { ALL_NAMESPACES_KEY, DEFAULT_NAMESPACE } from '../../consts';

import './TasksNavigationPage.scss';

const taskModelRef = getReferenceForModel(TaskModel);
const taskRunModelRef = getReferenceForModel(TaskRunModel);
const clusterTaskModelRef = getReferenceForModel(ClusterTaskModel);

const TasksNavigationPage = (...props) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [activeNamespace] = useActiveNamespace();
  const history = useHistory();
  const [activeTabKey, setActiveTabKey] = useState<number>(0);

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

  return (
    <>
      {' '}
      <NamespaceBar></NamespaceBar>
      <ListPageHeader title={t('Tasks')}>
        <ListPageCreateDropdown items={createItems} onClick={onCreate}>
          {t('Create')}
        </ListPageCreateDropdown>
      </ListPageHeader>
      <Card className="tasks-list-page__card">
        <Tabs
          onSelect={(_, tabIndex: number) => {
            setActiveTabKey(tabIndex);
          }}
          activeKey={activeTabKey}
          className="tasks-list-page__tabs"
        >
          <Tab eventKey={0} title={t('Tasks')} className="tasks-list-page__tab">
            <TasksListPage showLabelFilters={true} />
          </Tab>
          <Tab
            eventKey={1}
            title={t('TaskRuns')}
            className="tasks-list-page__tab"
          >
            <TaskRunsListPage showLabelFilters={true} />
          </Tab>
          <Tab
            eventKey={2}
            title={t('ClusterTasks')}
            className="tasks-list-page__tab"
          >
            <ClusterTaskPage showLabelFilters={true} />
          </Tab>
        </Tabs>
      </Card>
    </>
  );
};

export default TasksNavigationPage;
