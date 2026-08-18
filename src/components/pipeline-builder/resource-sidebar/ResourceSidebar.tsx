import type { FC } from 'react';
import { Alert, Stack, StackItem, Title } from '@patternfly/react-core';
import { FormikErrors, useField } from 'formik';
import { Trans, useTranslation } from 'react-i18next';
import {
  PipelineKind,
  PipelineTask,
  PipelineTaskParam,
  TektonResource,
  TektonWorkspace,
  TektonParam,
  PipelineTaskResource,
  ResourceTarget,
  TektonResourceGroup,
  SelectedBuilderTask,
  TaskKind,
} from '../../../types';
import { PipelineModel } from '../../../models';
import ResourceSidebarHeader from './ResourceSidebarHeader';
import ResourceSidebarName from './ResourceSidebarName';
import ResourceSidebarParam from './ResourceSidebarParam';
import ResourceSidebarResource from './ResourceSidebarResource';
import TaskSidebarWhenExpression from './TaskSidebarWhenExpression';
import ResourceSidebarWorkspace from './ResourceSidebarWorkspace';
import { getPipelineTaskLinks } from '../../pipelines-details/utils';
import DynamicResourceLinkList from '../../triggers-details/DynamicResourceLinkList';

import './ResourceSidebar.scss';
import { TaskType, UpdateOperationRenameTaskData } from '../types';
import { getTaskParameters, getTaskResources } from '../utils';
import { CloseButton } from '@patternfly/react-component-groups';
import { paramIsRequired } from '../../start-pipeline/validation-utils';

type ResourceSidebarProps = {
  errorMap?: FormikErrors<PipelineTask>[];
  onRemoveTask: (taskName: string) => void;
  onRenameTask: (data: UpdateOperationRenameTaskData) => void;
  resourceList?: TektonResource[];
  workspaceList: TektonWorkspace[];
  selectedData: SelectedBuilderTask;
  onClose: () => void;
  hideOptionalTaskParam: boolean;
};

/** Protect against -1 index for Formik 'name' use-cases */
function safeIndex<T>(list: T[], comparatorFunc: (v: T) => boolean): number {
  const idx = list.findIndex(comparatorFunc);
  return idx === -1 ? list.length : idx;
}

const ResourceSidebar: FC<ResourceSidebarProps> = (props) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const {
    onRemoveTask,
    onRenameTask,
    resourceList = [],
    workspaceList,
    selectedData,
    onClose,
    hideOptionalTaskParam,
  } = props;
  const { isFinallyTask, taskIndex, resource } = selectedData;
  const isPipeline = resource.kind === PipelineModel.kind;
  const pipelineResource = isPipeline ? (resource as PipelineKind) : null;
  const taskResource = isPipeline ? null : (resource as TaskKind);
  const taskType: TaskType = isFinallyTask ? 'finallyTasks' : 'tasks';
  const formikTaskReference = `formData.${taskType}.${taskIndex}`;
  const [{ value: thisTask }] = useField<PipelineTask>(formikTaskReference);

  const params: TektonParam[] = getTaskParameters(resource as TaskKind) || [];
  const resources: TektonResourceGroup<TektonResource> = isPipeline
    ? { inputs: [], outputs: [] }
    : getTaskResources(taskResource);
  const inputResources: TektonResource[] = resources.inputs || [];
  const outputResources: TektonResource[] = resources.outputs || [];
  const workspaces: TektonWorkspace[] = isPipeline
    ? pipelineResource.spec?.workspaces || []
    : taskResource.spec?.workspaces || [];
  const displayTaskParams: boolean =
    !hideOptionalTaskParam || params?.some((param) => paramIsRequired(param));

  const { pipelineLinks, taskLinks, finallyTaskLinks } = isPipeline
    ? getPipelineTaskLinks(pipelineResource)
    : { pipelineLinks: [], taskLinks: [], finallyTaskLinks: [] };
  const namespace = resource.metadata?.namespace;

  const renderResource =
    (type: ResourceTarget) => (resourceItem: TektonResource) => {
      const taskResources: PipelineTaskResource[] =
        thisTask.resources?.[type] || [];
      const resourceIdx = safeIndex(
        taskResources,
        (thisParam) => thisParam.name === resourceItem.name,
      );
      return (
        <div key={resourceItem.name} className="odc-task-sidebar__resource">
          <ResourceSidebarResource
            availableResources={resourceList}
            hasResource={!!taskResources[resourceIdx]}
            name={`${formikTaskReference}.resources.${type}.${resourceIdx}`}
            resource={resourceItem}
          />
        </div>
      );
    };

  return (
    <Stack className="opp-task-sidebar">
      <StackItem className="co-sidebar-dismiss  clearfix">
        <CloseButton onClick={onClose} dataTestID="sidebar-close-button" />
      </StackItem>
      <StackItem className="opp-task-sidebar__header">
        <ResourceSidebarHeader
          resource={resource}
          removeThisTask={() => onRemoveTask(thisTask.name)}
        />
      </StackItem>
      <StackItem className="opp-task-sidebar__content pf-v6-c-form">
        <ResourceSidebarName
          name={`${formikTaskReference}.name`}
          taskName={resource.metadata.name}
          onChange={(newName) =>
            onRenameTask({ preChangePipelineTask: thisTask, newName })
          }
        />

        {params.length > 0 && (
          <div>
            <Title headingLevel="h2">{t('Parameters')}</Title>
            {displayTaskParams ? (
              <>
                <p className="co-help-text opp-task-sidebar__paragraph">
                  <Trans ns="plugin__pipelines-console-plugin">
                    Use this format when you reference variables in this form:{' '}
                    <code className="co-code">$(</code>
                  </Trans>
                </p>
                {params.map((param) => {
                  const taskParams: PipelineTaskParam[] = thisTask.params || [];
                  const paramIdx = safeIndex(
                    taskParams,
                    (thisParam) => thisParam.name === param.name,
                  );
                  if (hideOptionalTaskParam && !paramIsRequired(param)) {
                    return null;
                  }
                  return (
                    <div key={param.name} className="opp-task-sidebar__param">
                      <ResourceSidebarParam
                        hasParam={!!taskParams[paramIdx]}
                        name={`${formikTaskReference}.params.${paramIdx}`}
                        resourceParam={param}
                        selectedData={selectedData}
                      />
                    </div>
                  );
                })}
              </>
            ) : (
              <Alert
                isInline
                variant="warning"
                className="pf-v6-u-mt-md"
                title={
                  isPipeline
                    ? t('There are no required params for this pipeline')
                    : t('There are no required params for this task')
                }
              />
            )}
          </div>
        )}

        {workspaces.length > 0 && (
          <div>
            <h2>{t('Workspaces')}</h2>
            {workspaces.map((workspace) => {
              const taskWorkspaces: TektonWorkspace[] =
                thisTask.workspaces || [];
              const workspaceIdx = safeIndex(
                taskWorkspaces,
                (thisWorkspace) => thisWorkspace.name === workspace.name,
              );
              return (
                <div
                  key={workspace.name}
                  className="opp-task-sidebar__workspace"
                >
                  <ResourceSidebarWorkspace
                    availableWorkspaces={workspaceList}
                    hasWorkspace={!!taskWorkspaces[workspaceIdx]}
                    name={`${formikTaskReference}.workspaces.${workspaceIdx}`}
                    resourceWorkspace={workspace}
                  />
                </div>
              );
            })}
          </div>
        )}

        {!isPipeline && inputResources.length > 0 && (
          <div>
            <h2>{t('Input resources')}</h2>
            {inputResources.map(renderResource('inputs'))}
          </div>
        )}
        {!isPipeline && outputResources.length > 0 && (
          <div>
            <h2>{t('Output resources')}</h2>
            {outputResources.map(renderResource('outputs'))}
          </div>
        )}

        {isPipeline &&
          (pipelineLinks.length > 0 ||
            taskLinks.length > 0 ||
            finallyTaskLinks.length > 0) && (
            <div className="opp-task-sidebar__param">
              <Title headingLevel="h2">{t('Pipeline tasks')}</Title>
              {pipelineLinks.length > 0 && (
                <DynamicResourceLinkList
                  namespace={namespace}
                  links={pipelineLinks}
                  title={t('Pipelines')}
                />
              )}
              {taskLinks.length > 0 && (
                <DynamicResourceLinkList
                  namespace={namespace}
                  links={taskLinks}
                  title={t('Tasks')}
                />
              )}
              {finallyTaskLinks.length > 0 && (
                <DynamicResourceLinkList
                  namespace={namespace}
                  links={finallyTaskLinks}
                  title={t('Finally tasks')}
                />
              )}
            </div>
          )}

        {!isPipeline && (
          <div className="opp-task-sidebar__when-expressions">
            <TaskSidebarWhenExpression
              hasParam={false}
              name={`${formikTaskReference}.when`}
              selectedData={selectedData}
            />
          </div>
        )}
      </StackItem>
    </Stack>
  );
};

export default ResourceSidebar;
