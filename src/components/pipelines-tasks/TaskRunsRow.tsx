import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip } from '@patternfly/react-core';
import { ArchiveIcon } from '@patternfly/react-icons';
import {
  ResourceLink,
  RowProps,
  TableData,
  Timestamp,
} from '@openshift-console/dynamic-plugin-sdk';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { PipelineModel, TaskRunModel } from '../../models';
import {
  DELETED_RESOURCE_IN_K8S_ANNOTATION,
  TektonResourceLabel,
} from '../../consts';
import { TaskRunKind } from '../../types';
import {
  getModelReferenceFromTaskKind,
  pipelineRunDuration,
} from '../utils/pipelines-utils';
import { taskRunFilterReducer } from '../utils/pipeline-filter-reducer';
import TaskRunStatus from './TaskRunStatus';
import { ResourceLinkWithIcon } from '../utils/resource-link';
import TaskRunActionDropdown from './TaskRunActionDropdown';

import './TasksNavigationPage.scss';

const taskRunsReference = getReferenceForModel(TaskRunModel);
const pipelineReference = getReferenceForModel(PipelineModel);

const TaskRunsRow: React.FC<RowProps<TaskRunKind>> = ({
  activeColumnIDs,
  obj,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return (
    <>
      <TableData activeColumnIDs={activeColumnIDs} id="name">
        <ResourceLinkWithIcon
          kind={taskRunsReference}
          model={TaskRunModel}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
          data-test-id={obj.metadata.name}
          nameSuffix={
            <>
              {obj?.metadata?.annotations?.[
                DELETED_RESOURCE_IN_K8S_ANNOTATION
              ] === 'true' ? (
                <Tooltip content={t('Archived in Tekton results')}>
                  <div className="task-run-list__results-indicator">
                    <ArchiveIcon />
                  </div>
                </Tooltip>
              ) : null}
            </>
          }
        />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="namespace">
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="pipeline">
        {obj.metadata.labels[TektonResourceLabel.pipeline] ? (
          <ResourceLink
            kind={pipelineReference}
            name={obj.metadata.labels[TektonResourceLabel.pipeline]}
            namespace={obj.metadata.namespace}
          />
        ) : (
          '-'
        )}
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="task">
        {obj.spec.taskRef?.name ? (
          <ResourceLink
            kind={getModelReferenceFromTaskKind(obj.spec.taskRef?.kind)}
            displayName={obj.metadata.labels[TektonResourceLabel.pipelineTask]}
            name={obj.spec.taskRef.name}
            namespace={obj.metadata.namespace}
          />
        ) : (
          '-'
        )}
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="pod">
        {obj.status?.podName ? (
          <ResourceLink
            kind="Pod"
            name={obj.status.podName}
            namespace={obj.metadata.namespace}
          />
        ) : (
          '-'
        )}
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="taskrunstatus">
        <TaskRunStatus status={taskRunFilterReducer(obj)} taskRun={obj} />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="starttime">
        <Timestamp timestamp={obj?.status?.startTime} />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="duration">
        {pipelineRunDuration(obj)}
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        id=""
        className="dropdown-kebab-pf pf-v5-c-table__action"
      >
        <TaskRunActionDropdown resource={obj} model={TaskRunModel} />
      </TableData>
    </>
  );
};

export default TaskRunsRow;
