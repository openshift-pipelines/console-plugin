import {
  ResourceLink,
  RowProps,
  TableData,
  Timestamp,
  getGroupVersionKindForModel,
} from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import { PipelineWithLatest } from '../../types/pipelineRun';
import { TaskRunKind } from 'src/types';
import { getTaskRunsOfPipelineRun } from '../hooks/useTaskRuns';
import LinkedPipelineRunTaskStatus from './status/LinkedPipelineRunTaskStatus';
import PipelineRunStatus from './status/PipelineRunStatus';
import {
  pipelineFilterReducer,
  pipelineTitleFilterReducer,
} from '../utils/pipeline-filter-reducer';
import { PipelineModel, PipelineRunModel } from '../../models';

export const tableColumnClasses = [
  'pf-v5-u-w-16-on-xl pf-v5-u-w-25-on-lg pf-v5-u-w-33-on-xs', // name
  'pf-v5-u-w-8-on-xl pf-v5-u-w-16-on-xs', // namespace
  'pf-v5-u-w-16-on-xl pf-v5-u-w-25-on-lg pf-v5-u-w-33-on-xs', // last run
  'pf-m-hidden pf-m-visible-on-lg', // task status
  'pf-m-hidden pf-m-visible-on-xl', // last run status
  'pf-m-hidden pf-m-visible-on-xl', // last run time
];

type PipelineStatusProps = {
  obj: PipelineWithLatest;
  taskRuns: TaskRunKind[];
};

const PipelineStatus: React.FC<PipelineStatusProps> = ({ obj, taskRuns }) => {
  return (
    <PipelineRunStatus
      status={pipelineFilterReducer(obj)}
      title={pipelineTitleFilterReducer(obj)}
      pipelineRun={obj.latestRun}
      taskRuns={taskRuns}
    />
  );
};

const PipelineRow: React.FC<
  RowProps<PipelineWithLatest, { taskRuns: TaskRunKind[] }>
> = ({ obj, activeColumnIDs, rowData: { taskRuns } }) => {
  const PLRTaskRuns = getTaskRunsOfPipelineRun(
    taskRuns,
    obj?.latestRun?.metadata?.name,
  );
  return (
    <>
      <TableData
        className={tableColumnClasses[0]}
        id="name"
        activeColumnIDs={activeColumnIDs}
      >
        <ResourceLink
          groupVersionKind={getGroupVersionKindForModel(PipelineModel)}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
        />
      </TableData>
      <TableData
        className={tableColumnClasses[1]}
        id="namespace"
        activeColumnIDs={activeColumnIDs}
      >
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData
        className={tableColumnClasses[2]}
        id="last-run"
        activeColumnIDs={activeColumnIDs}
      >
        {obj?.latestRun?.metadata?.name ? (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(PipelineRunModel)}
            name={obj.latestRun.metadata.name}
            namespace={obj.latestRun.metadata.namespace}
          />
        ) : (
          '-'
        )}
      </TableData>
      <TableData
        className={tableColumnClasses[3]}
        id="task-run"
        activeColumnIDs={activeColumnIDs}
      >
        {obj.latestRun ? (
          <LinkedPipelineRunTaskStatus
            pipelineRun={obj.latestRun}
            taskRuns={PLRTaskRuns}
          />
        ) : (
          '-'
        )}
      </TableData>
      <TableData
        className={tableColumnClasses[4]}
        id="last-run-status"
        activeColumnIDs={activeColumnIDs}
      >
        <PipelineStatus obj={obj} taskRuns={PLRTaskRuns} />
      </TableData>
      <TableData
        className={tableColumnClasses[5]}
        id="last-run-time"
        activeColumnIDs={activeColumnIDs}
      >
        {(obj.latestRun?.status?.startTime && (
          <Timestamp timestamp={obj.latestRun.status.startTime} />
        )) ||
          '-'}
      </TableData>
      <TableData
        className="dropdown-kebab-pf pf-v5-c-table__action"
        id=""
        activeColumnIDs={activeColumnIDs}
      >
        {/* <PipelineRowKebabActions pipeline={obj} /> */}
        {'-'}
      </TableData>
    </>
  );
};

export default PipelineRow;
