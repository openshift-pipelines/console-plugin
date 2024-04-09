import {
  ResourceLink,
  RowProps,
  TableData,
  Timestamp,
  getGroupVersionKindForModel,
} from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import { ArchiveIcon } from '@patternfly/react-icons';
import { PipelineRunKind, TaskRunKind } from '../../types';
import { ResourceLinkWithIcon } from '../utils/resource-link';
import { PipelineRunModel } from '../../models';
import { Tooltip } from '@patternfly/react-core';
import {
  DELETED_RESOURCE_IN_K8S_ANNOTATION,
  RESOURCE_LOADED_FROM_RESULTS_ANNOTATION,
  chainsSignedAnnotation,
} from '../../consts';
import { useTranslation } from 'react-i18next';
import SignedBadgeIcon from '../../images/SignedBadge';
import PipelineRunVulnerabilities from '../pipelines-list/status/PipelineRunVulnerabilities';
import PipelineRunStatus from '../pipelines-list/status/PipelineRunStatus';
import { getTaskRunsOfPipelineRun } from '../hooks/useTaskRuns';
import {
  pipelineRunFilterReducer,
  pipelineRunTitleFilterReducer,
} from '../utils/pipeline-filter-reducer';
import LinkedPipelineRunTaskStatus from '../pipelines-list/status/LinkedPipelineRunTaskStatus';
import { pipelineRunDuration } from '../utils/pipelines-utils';
import PipelineRunsKebab from './PipelineRunsKebab';

export const tableColumnClasses = {
  name: 'pf-m-width-20',
  namespace: '',
  vulnerabilities: 'pf-m-hidden pf-m-visible-on-md',
  status: 'pf-m-hidden pf-m-visible-on-sm pf-m-width-10',
  taskStatus: 'pf-m-hidden pf-m-visible-on-lg',
  started: 'pf-m-hidden pf-m-visible-on-lg',
  duration: 'pf-m-hidden pf-m-visible-on-xl',
  actions: 'dropdown-kebab-pf pf-v5-c-table__action',
};

type PLRStatusProps = {
  obj: PipelineRunKind;
  taskRuns: TaskRunKind[];
  taskRunsLoaded: boolean;
};

const PLRStatus: React.FC<PLRStatusProps> = ({
  obj,
  taskRuns,
  taskRunsLoaded,
}) => {
  return (
    <PipelineRunStatus
      status={pipelineRunFilterReducer(obj)}
      title={pipelineRunTitleFilterReducer(obj)}
      pipelineRun={obj}
      taskRuns={taskRuns}
      taskRunsLoaded={taskRunsLoaded}
    />
  );
};

const PipelineRunsRow: React.FC<
  RowProps<
    PipelineRunKind,
    { taskRuns: TaskRunKind[]; taskRunsLoaded: boolean }
  >
> = ({ obj, activeColumnIDs, rowData: { taskRuns, taskRunsLoaded } }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const PLRTaskRuns = getTaskRunsOfPipelineRun(taskRuns, obj?.metadata?.name);
  return (
    <>
      <TableData
        className={tableColumnClasses.name}
        id="name"
        activeColumnIDs={activeColumnIDs}
      >
        <ResourceLinkWithIcon
          groupVersionKind={getGroupVersionKindForModel(PipelineRunModel)}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
          data-test-id={obj.metadata.name}
          model={PipelineRunModel}
          nameSuffix={
            <>
              {obj?.metadata?.annotations?.[chainsSignedAnnotation] ===
              'true' ? (
                <Tooltip content={t('Signed')}>
                  <div className="opp-pipeline-run-list__signed-indicator">
                    <SignedBadgeIcon />
                  </div>
                </Tooltip>
              ) : null}
              {obj?.metadata?.annotations?.[
                DELETED_RESOURCE_IN_K8S_ANNOTATION
              ] === 'true' ||
              obj?.metadata?.annotations?.[
                RESOURCE_LOADED_FROM_RESULTS_ANNOTATION
              ] === 'true' ? (
                <Tooltip content={t('Archived in Tekton results')}>
                  <div className="opp-pipeline-run-list__results-indicator">
                    <ArchiveIcon />
                  </div>
                </Tooltip>
              ) : null}
            </>
          }
        />
      </TableData>
      <TableData
        className={tableColumnClasses.namespace}
        id="namespace"
        activeColumnIDs={activeColumnIDs}
      >
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData
        className={tableColumnClasses.vulnerabilities}
        id="vulnerabilities"
        activeColumnIDs={activeColumnIDs}
      >
        <PipelineRunVulnerabilities pipelineRun={obj} condensed />
      </TableData>
      <TableData
        className={tableColumnClasses.status}
        id="status"
        activeColumnIDs={activeColumnIDs}
      >
        <PLRStatus
          obj={obj}
          taskRuns={PLRTaskRuns}
          taskRunsLoaded={taskRunsLoaded}
        />
      </TableData>
      <TableData
        className={tableColumnClasses.taskStatus}
        id="task-status"
        activeColumnIDs={activeColumnIDs}
      >
        <LinkedPipelineRunTaskStatus
          pipelineRun={obj}
          taskRuns={PLRTaskRuns}
          taskRunsLoaded={taskRunsLoaded}
        />
      </TableData>
      <TableData
        className={tableColumnClasses.started}
        id="started"
        activeColumnIDs={activeColumnIDs}
      >
        <Timestamp timestamp={obj.status && obj.status.startTime} />
      </TableData>
      <TableData
        className={tableColumnClasses.duration}
        id="duration"
        activeColumnIDs={activeColumnIDs}
      >
        {pipelineRunDuration(obj)}
      </TableData>
      <TableData
        className={tableColumnClasses.actions}
        id="kebab-menu"
        activeColumnIDs={activeColumnIDs}
      >
        <PipelineRunsKebab obj={obj} taskRuns={taskRuns} />
      </TableData>
    </>
  );
};

export default PipelineRunsRow;
