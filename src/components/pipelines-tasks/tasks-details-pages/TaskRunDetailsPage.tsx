import {
  BreadcrumbItem,
  Text,
  TextVariants,
  Tooltip,
} from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import * as React from 'react';
import { useParams } from 'react-router-dom-v5-compat';
import { ArchiveIcon } from '@patternfly/react-icons';
import { ResourceStatus } from '@openshift-console/dynamic-plugin-sdk';
import DetailsPage from '../../details-page/DetailsPage';
import { getReferenceForModel } from '../../pipelines-overview/utils';
import { TaskRunModel } from '../../../models';
import { useTranslation } from 'react-i18next';
import TaskRunDetails from './TaskRunDetails';
import TaskRunLogsTab from './TaskRunLogsTab';
import TaskRunEvents from './events/TaskRunEvents';
import { useTaskRun } from '../../hooks/useTaskRuns';
import { navFactory } from '../../utils/horizontal-nav';
import ResourceYAMLEditorViewOnly from '../../yaml-editor/ResourceYAMLEditorViewOnly';
import {
  DELETED_RESOURCE_IN_K8S_ANNOTATION,
  RESOURCE_LOADED_FROM_RESULTS_ANNOTATION,
} from '../../../consts';
import { LoadingBox } from '../../status/status-box';
import { taskRunStatus } from '../../utils/pipeline-utils';
import Status from '../../status/Status';

const TaskRunDetailsPage = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const params = useParams();
  const { name, ns: namespace } = params;
  const [data, loaded] = useTaskRun(namespace, name);
  const trStatus = React.useMemo(
    () => loaded && data && taskRunStatus(data),
    [loaded, data],
  );
  const resourceTitleFunc = React.useMemo(() => {
    return (
      <div className="taskrun-details-page">
        {data?.metadata?.name}{' '}
        {(data?.metadata?.annotations?.[DELETED_RESOURCE_IN_K8S_ANNOTATION] ===
          'true' ||
          data?.metadata?.annotations?.[
            RESOURCE_LOADED_FROM_RESULTS_ANNOTATION
          ] === 'true') && (
          <Tooltip content={t('Archived in Tekton results')}>
            <ArchiveIcon className="pipelinerun-details-page__results-indicator" />
          </Tooltip>
        )}
        <ResourceStatus>
          <Status status={trStatus}></Status>
        </ResourceStatus>
      </div>
    );
  }, [data]);

  if (!loaded) {
    return <LoadingBox />;
  }
  return (
    <DetailsPage
      obj={data}
      headTitle={name}
      title={<Text component={TextVariants.h1}>{resourceTitleFunc}</Text>}
      baseURL={`/tasks/ns/${namespace}/${getReferenceForModel(
        TaskRunModel,
      )}/${name}/task-runs`}
      model={TaskRunModel}
      breadcrumbs={[
        <BreadcrumbItem key="app-link" component="div">
          <Link
            data-test="breadcrumb-link"
            className="pf-v5-c-breadcrumb__link"
            to={`/tasks/ns/${namespace}/task-runs`}
          >
            {t('TaskRuns')}
          </Link>
        </BreadcrumbItem>,
        {
          path: `/tasks/ns/${namespace}/task-runs`,
          name: t('TaskRun details'),
        },
      ]}
      pages={[
        navFactory.details(TaskRunDetails),
        navFactory.editYaml(ResourceYAMLEditorViewOnly),
        {
          href: 'logs',
          path: 'logs/:name?',
          // t('Logs')
          name: 'Logs',
          component: TaskRunLogsTab,
        },
        navFactory.events(TaskRunEvents),
      ]}
    />
  );
};

export default TaskRunDetailsPage;
