import {
  ResourceIcon,
  ResourceLink,
  RowProps,
  TableData,
  Timestamp,
  getGroupVersionKindForModel,
} from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import { PipelineRunKind, RepositoryKind, TaskRunKind } from '../../types';
import { Link } from 'react-router-dom-v5-compat';
import { PipelineRunModel, RepositoryModel } from '../../models';
import { getLatestRun } from '../utils/pipeline-augment';
import { getTaskRunsOfPipelineRun } from '../hooks/useTaskRuns';
import { pipelineRunDuration } from '../utils/pipeline-utils';
import PipelineRunStatus from '../pipelines-list/status/PipelineRunStatus';
import {
  pipelineRunFilterReducer,
  pipelineRunTitleFilterReducer,
} from '../utils/pipeline-filter-reducer';
import { getReferenceForModel } from '../pipelines-overview/utils';
import LinkedPipelineRunTaskStatus from '../pipelines-list/status/LinkedPipelineRunTaskStatus';
import { RepositoryFields, RepositoryLabels } from '../../consts';
import { LazyActionMenu } from '@openshift-console/dynamic-plugin-sdk-internal';

export const repositoriesTableColumnClasses = [
  'pf-v6-u-w-16-on-xl pf-v6-u-w-25-on-lg pf-v6-u-w-33-on-xs', // name
  'pf-v6-u-w-12-on-xl pf-v6-u-w-20-on-lg pf-v6-u-w-30-on-xs', // namespace
  'pf-v6-u-w-12-on-xl pf-v6-u-w-20-on-lg pf-v6-u-w-30-on-xs', // Event type
  'pf-v6-u-w-12-on-xl pf-v6-u-w-20-on-lg pf-v6-u-w-30-on-xs', // Last run
  'pf-v6-u-w-16-on-xl pf-v6-u-w-25-on-lg pf-v6-u-w-33-on-xs', // Task status
  'pf-v6-m-hidden pf-m-visible-on-xl', // last run status
  'pf-v6-m-hidden pf-v6-u-w-12-on-xl pf-v6-u-w-20-on-lg pf-v6-u-w-33-on-xs pf-m-visible-on-xl', // Last run time
  'pf-v6-m-hidden pf-m-visible-on-xl', // Last run duration
  'dropdown-kebab-pf pf-v6-c-table__action',
];

const RepositoriesRow: React.FC<
  RowProps<
    RepositoryKind,
    {
      taskRuns: TaskRunKind[];
      pipelineRuns: PipelineRunKind[];
      taskRunsLoaded: boolean;
    }
  >
> = ({
  obj,
  activeColumnIDs,
  rowData: { taskRuns, pipelineRuns, taskRunsLoaded },
}) => {
  const {
    metadata: { name, namespace },
  } = obj;
  const plrs = pipelineRuns.filter((plr) => {
    return (
      plr.metadata?.labels?.[RepositoryLabels[RepositoryFields.REPOSITORY]] ===
      obj.metadata.name
    );
  });
  const latestRun = getLatestRun(plrs, 'creationTimestamp');

  const latestPLREventType =
    latestRun &&
    latestRun?.metadata?.labels?.[
      RepositoryLabels[RepositoryFields.EVENT_TYPE]
    ];

  const PLRTaskRuns = getTaskRunsOfPipelineRun(
    taskRuns,
    latestRun?.metadata?.name,
  );
  return (
    <>
      <TableData
        className={repositoriesTableColumnClasses[0]}
        id="name"
        activeColumnIDs={activeColumnIDs}
      >
        <ResourceIcon
          groupVersionKind={getGroupVersionKindForModel(RepositoryModel)}
        />
        <Link
          to={`/k8s/ns/${namespace}/${getReferenceForModel(
            RepositoryModel,
          )}/${name}/Runs`}
          className="co-resource-item__resource-name"
          data-test-id={name}
        >
          {name}
        </Link>
      </TableData>
      <TableData
        className={repositoriesTableColumnClasses[1]}
        id="namespace"
        activeColumnIDs={activeColumnIDs}
      >
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData
        className={repositoriesTableColumnClasses[2]}
        id="event-type"
        activeColumnIDs={activeColumnIDs}
      >
        {latestPLREventType || '-'}
      </TableData>
      <TableData
        className={repositoriesTableColumnClasses[3]}
        id="last-run"
        activeColumnIDs={activeColumnIDs}
      >
        {latestRun ? (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(PipelineRunModel)}
            name={latestRun?.metadata.name}
            namespace={namespace}
          />
        ) : (
          '-'
        )}
      </TableData>
      <TableData
        className={repositoriesTableColumnClasses[4]}
        id="task-status"
        activeColumnIDs={activeColumnIDs}
      >
        {}
        {latestRun ? (
          <LinkedPipelineRunTaskStatus
            pipelineRun={latestRun}
            taskRuns={PLRTaskRuns}
            taskRunsLoaded={taskRunsLoaded}
          />
        ) : (
          '-'
        )}
      </TableData>
      <TableData
        className={repositoriesTableColumnClasses[5]}
        id="last-run-status"
        activeColumnIDs={activeColumnIDs}
      >
        {
          <PipelineRunStatus
            status={pipelineRunFilterReducer(latestRun)}
            title={pipelineRunTitleFilterReducer(latestRun)}
            pipelineRun={latestRun}
            taskRuns={PLRTaskRuns}
            taskRunsLoaded={taskRunsLoaded}
          />
        }
      </TableData>
      <TableData
        className={repositoriesTableColumnClasses[6]}
        id="last-runtime"
        activeColumnIDs={activeColumnIDs}
      >
        {<Timestamp timestamp={latestRun?.status.startTime} />}
      </TableData>
      <TableData
        className={repositoriesTableColumnClasses[7]}
        id="last-run-duration"
        activeColumnIDs={activeColumnIDs}
      >
        {pipelineRunDuration(latestRun)}
      </TableData>
      <TableData
        className={repositoriesTableColumnClasses[8]}
        id="kebab-menu"
        activeColumnIDs={activeColumnIDs}
      >
        <LazyActionMenu
          context={{ [getReferenceForModel(RepositoryModel)]: obj }}
        />
      </TableData>
    </>
  );
};

export default RepositoriesRow;
