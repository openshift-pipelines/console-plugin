import {
  ResourceLink,
  RowProps,
  TableData,
  Timestamp,
  getGroupVersionKindForModel,
} from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import { PipelineWithLatest } from '../../types/pipelineRun';
import { ComputedStatus, TaskRunKind } from '../../types';
import { useTaskRuns } from '../hooks/useTaskRuns';
import LinkedPipelineRunTaskStatus from './status/LinkedPipelineRunTaskStatus';
import {
  pipelineFilterReducer,
  pipelineRunStatus,
  pipelineTitleFilterReducer,
} from '../utils/pipeline-filter-reducer';
import { PipelineModel, PipelineRunModel } from '../../models';
import { getPipelineRunStatus } from '../utils/pipeline-utils';
import { TaskStatus } from '../utils/pipeline-augment';
import PipelineRunStatusContent from '../status/PipelineRunStatusContent';
import { LazyActionMenu } from '@openshift-console/dynamic-plugin-sdk-internal';
import { getReferenceForModel } from '../pipelines-overview/utils';

export const tableColumnClasses = [
  'pf-v6-u-w-16-on-xl pf-v6-u-w-25-on-lg pf-v6-u-w-33-on-xs', // name
  'pf-v6-u-w-8-on-xl pf-v6-u-w-16-on-xs', // namespace
  'pf-v6-u-w-16-on-xl pf-v6-u-w-25-on-lg pf-v6-u-w-33-on-xs', // last run
  'pf-v6-m-hidden pf-m-visible-on-lg', // task status
  'pf-v6-m-hidden pf-m-visible-on-xl', // last run status
  'pf-v6-m-hidden pf-m-visible-on-xl', // last run time
];

type PipelineStatusProps = {
  obj: PipelineWithLatest;
};

type PipelineRowWithoutTaskRunsProps = {
  obj: PipelineWithLatest;
  taskRunStatusObj: TaskStatus;
  activeColumnIDs: Set<string>;
};

type PipelineRowWithTaskRunsProps = {
  obj: PipelineWithLatest;
  activeColumnIDs: Set<string>;
};

const TASKRUNSFORPLRCACHE: { [key: string]: TaskRunKind[] } = {};
const InFlightStoreForTaskRunsForPLR: { [key: string]: boolean } = {};

const PipelineStatus: React.FC<PipelineStatusProps> = ({ obj }) => {
  return (
    <PipelineRunStatusContent
      status={pipelineFilterReducer(obj)}
      title={pipelineTitleFilterReducer(obj)}
      pipelineRun={obj.latestRun}
    />
  );
};

const PipelineRowTable = ({
  obj,
  PLRTaskRuns,
  taskRunsLoaded,
  taskRunStatusObj,
  activeColumnIDs,
}) => {
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
            taskRunStatusObj={taskRunStatusObj}
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
        <PipelineStatus obj={obj} />
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
        className="dropdown-kebab-pf pf-v6-c-table__action"
        id=""
        activeColumnIDs={activeColumnIDs}
      >
        <LazyActionMenu
          context={{ [getReferenceForModel(PipelineModel)]: obj }}
        />
      </TableData>
    </>
  );
};

const PipelineRowWithoutTaskRuns: React.FC<PipelineRowWithoutTaskRunsProps> =
  React.memo(({ obj, taskRunStatusObj, activeColumnIDs }) => {
    return (
      <PipelineRowTable
        obj={obj}
        PLRTaskRuns={[]}
        taskRunsLoaded
        taskRunStatusObj={taskRunStatusObj}
        activeColumnIDs={activeColumnIDs}
      />
    );
  });

const PipelineRowWithTaskRunsFetch: React.FC<PipelineRowWithTaskRunsProps> =
  React.memo(({ obj, activeColumnIDs }) => {
    const cacheKey = `${obj.latestRun.metadata.namespace}-${obj.latestRun.metadata.name}`;
    const [PLRTaskRuns, taskRunsLoaded] = useTaskRuns(
      obj.latestRun.metadata.namespace,
      obj.latestRun.metadata.name,
      undefined,
      `${obj.latestRun.metadata.namespace}-${obj.latestRun.metadata.name}`,
    );
    InFlightStoreForTaskRunsForPLR[cacheKey] = false;
    if (taskRunsLoaded) {
      TASKRUNSFORPLRCACHE[cacheKey] = PLRTaskRuns;
    }
    return (
      <PipelineRowTable
        obj={obj}
        PLRTaskRuns={PLRTaskRuns}
        taskRunsLoaded={taskRunsLoaded}
        taskRunStatusObj={undefined}
        activeColumnIDs={activeColumnIDs}
      />
    );
  });

const PipelineRowWithTaskRuns: React.FC<PipelineRowWithTaskRunsProps> =
  React.memo(({ obj, activeColumnIDs }) => {
    let PLRTaskRuns: TaskRunKind[];
    let taskRunsLoaded: boolean;
    const cacheKey = `${obj.latestRun.metadata.namespace}-${obj.latestRun.metadata.name}`;
    const result = TASKRUNSFORPLRCACHE[cacheKey];
    if (result) {
      PLRTaskRuns = result;
      taskRunsLoaded = true;
    } else if (InFlightStoreForTaskRunsForPLR[cacheKey]) {
      PLRTaskRuns = [];
      taskRunsLoaded = true;
      InFlightStoreForTaskRunsForPLR[cacheKey] = true;
    } else {
      return (
        <PipelineRowWithTaskRunsFetch
          obj={obj}
          activeColumnIDs={activeColumnIDs}
        />
      );
    }
    return (
      <PipelineRowTable
        obj={obj}
        PLRTaskRuns={PLRTaskRuns}
        taskRunsLoaded={taskRunsLoaded}
        taskRunStatusObj={undefined}
        activeColumnIDs={activeColumnIDs}
      />
    );
  });

const PipelineRow: React.FC<RowProps<PipelineWithLatest>> = ({
  obj,
  activeColumnIDs,
}) => {
  const plrStatus = pipelineRunStatus(obj.latestRun);
  if (
    plrStatus === ComputedStatus.Cancelled &&
    (obj?.latestRun?.status?.childReferences ?? []).length > 0
  ) {
    return (
      <PipelineRowWithTaskRuns obj={obj} activeColumnIDs={activeColumnIDs} />
    );
  }

  const taskRunStatusObj = getPipelineRunStatus(obj.latestRun);
  return (
    <PipelineRowWithoutTaskRuns
      obj={obj}
      taskRunStatusObj={taskRunStatusObj}
      activeColumnIDs={activeColumnIDs}
    />
  );
};

export default PipelineRow;
