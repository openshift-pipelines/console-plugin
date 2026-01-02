import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  BreadcrumbItem,
  Content,
  ContentVariants,
} from '@patternfly/react-core';
import { Link, useParams } from 'react-router-dom-v5-compat';
import {
  getGroupVersionKindForModel,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { LazyActionMenu } from '@openshift-console/dynamic-plugin-sdk-internal';
import { ActionMenuVariant } from '@openshift-console/dynamic-plugin-sdk-internal/lib/api/internal-types';
import TaskDetails from './TaskDetails';
import DetailsPage from '../details-page/DetailsPage';
import { navFactory } from '../utils/horizontal-nav';
import { TaskModel } from '../../models';
import { TaskKind } from '../../types';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { getTaskName } from '../utils/pipeline-augment';
import { ErrorPage404 } from '../common/error';
import { LoadingBox } from '../status/status-box';
import ResourceYAMLEditorTab from '../yaml-editor/ResourceYAMLEditorTab';

type TaskDetailsPageProps = {
  name: string;
  namespace: string;
};

const TaskDetailsPage: React.FC<TaskDetailsPageProps> = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const params = useParams();
  const { name, ns: namespace } = params;
  const [task, loaded, loadError] = useK8sWatchResource<TaskKind>({
    groupVersionKind: getGroupVersionKindForModel(TaskModel),
    namespace,
    name,
  });

  const resourceTitleFunc = React.useMemo(() => {
    return <div className="task-details-page">{getTaskName(task)} </div>;
  }, [task]);

  const customActionMenu = React.useCallback((_kindObj, obj) => {
    const reference = getReferenceForModel(TaskModel);
    const context = { [reference]: obj };
    return (
      <LazyActionMenu
        context={context}
        variant={ActionMenuVariant.DROPDOWN}
        label={t('Actions')}
      />
    );
  }, []);

  if (!loaded) {
    return loadError ? <ErrorPage404 /> : <LoadingBox />;
  }

  return (
    <DetailsPage
      obj={task}
      model={TaskModel}
      title={
        <Content component={ContentVariants.h1}>{resourceTitleFunc}</Content>
      }
      customActionMenu={customActionMenu}
      pages={[
        navFactory.details(TaskDetails),
        navFactory.editYaml(ResourceYAMLEditorTab),
      ]}
      breadcrumbs={[
        <BreadcrumbItem key="app-link" component="div">
          <Link
            data-test="breadcrumb-link"
            className="pf-v6-c-breadcrumb__link"
            to={`/tasks/ns/${namespace}/`}
          >
            {t('Tasks')}
          </Link>
        </BreadcrumbItem>,
        {
          path: `/tasks/ns/${namespace}/`,
          name: t('Task details'),
        },
      ]}
    />
  );
};

export default TaskDetailsPage;
