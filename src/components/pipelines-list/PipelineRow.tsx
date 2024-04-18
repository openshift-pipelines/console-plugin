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
import PipelineKebab from './PipelineKebab';

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
  taskRunsLoaded: boolean;
};

const PipelineStatus: React.FC<PipelineStatusProps> = ({
  obj,
  taskRuns,
  taskRunsLoaded,
}) => {
  return (
    <PipelineRunStatus
      status={pipelineFilterReducer(obj)}
      title={pipelineTitleFilterReducer(obj)}
      pipelineRun={obj.latestRun}
      taskRuns={taskRuns}
      taskRunsLoaded={taskRunsLoaded}
    />
  );
};

const PipelineRow: React.FC<
  RowProps<
    PipelineWithLatest,
    { taskRuns: TaskRunKind[]; taskRunsLoaded: boolean }
  >
> = ({ obj, activeColumnIDs, rowData: { taskRuns, taskRunsLoaded } }) => {
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
            taskRunsLoaded={taskRunsLoaded}
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
        <PipelineStatus
          obj={obj}
          taskRuns={PLRTaskRuns}
          taskRunsLoaded={taskRunsLoaded}
        />
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
        <PipelineKebab pipeline={obj} />
      </TableData>
    </>
  );
};

export default PipelineRow;
