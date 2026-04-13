import {
  ResourceIcon,
  ResourceLink,
  Timestamp,
  getGroupVersionKindForModel,
} from '@openshift-console/dynamic-plugin-sdk';
import { PipelineRunKind, RepositoryKind, TaskRunKind } from '../../types';
import { Link } from 'react-router';
import {
  NamespaceModel,
  PipelineRunModel,
  RepositoryModel,
} from '../../models';
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
import { DASH, RepositoryFields, RepositoryLabels } from '../../consts';
import {
  actionsCellProps,
  getNameCellProps,
  LazyActionMenu,
} from '@openshift-console/dynamic-plugin-sdk-internal';
import { GetDataViewRows } from '@openshift-console/dynamic-plugin-sdk-internal/lib/api/internal-types';

export const getRepositoriesListDataViewRows: GetDataViewRows<
  RepositoryKind,
  {
    taskRuns: TaskRunKind[];
    pipelineRuns: PipelineRunKind[];
    taskRunsLoaded: boolean;
  }
> = (data, columns) => {
  return data.map(
    ({ obj, rowData: { taskRuns, pipelineRuns, taskRunsLoaded } }) => {
      const { name, namespace } = obj.metadata;
      const plrs = pipelineRuns.filter(
        (plr) =>
          plr.metadata?.labels?.[
            RepositoryLabels[RepositoryFields.REPOSITORY]
          ] === obj.metadata.name,
      );
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

      const rowCells = {
        ['name']: {
          cell: (
            <>
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
            </>
          ),
          props: {
            ...getNameCellProps('repositories-list'),
            modifier: 'nowrap',
          },
        },
        ['namespace']: {
          cell: (
            <ResourceLink
              groupVersionKind={getGroupVersionKindForModel(NamespaceModel)}
              name={namespace}
            />
          ),
          props: { modifier: 'nowrap' },
        },
        ['event-type']: {
          cell: latestPLREventType || DASH,
        },
        ['last-run']: {
          cell: latestRun ? (
            <ResourceLink
              groupVersionKind={getGroupVersionKindForModel(PipelineRunModel)}
              name={latestRun.metadata.name}
              namespace={namespace}
            />
          ) : (
            DASH
          ),
          props: { modifier: 'nowrap' },
        },
        ['task-status']: {
          cell: latestRun ? (
            <LinkedPipelineRunTaskStatus
              pipelineRun={latestRun}
              taskRuns={PLRTaskRuns}
              taskRunsLoaded={taskRunsLoaded}
            />
          ) : (
            DASH
          ),
        },
        ['last-run-status']: {
          cell: (
            <PipelineRunStatus
              status={pipelineRunFilterReducer(latestRun)}
              title={pipelineRunTitleFilterReducer(latestRun)}
              pipelineRun={latestRun}
              taskRuns={PLRTaskRuns}
              taskRunsLoaded={taskRunsLoaded}
            />
          ),
        },
        ['last-runtime']: {
          cell: latestRun?.status?.startTime ? (
            <Timestamp timestamp={latestRun.status.startTime} />
          ) : (
            DASH
          ),
        },
        ['last-run-duration']: {
          cell: pipelineRunDuration(latestRun),
        },
        ['kebab-menu']: {
          cell: (
            <LazyActionMenu
              context={{ [getReferenceForModel(RepositoryModel)]: obj }}
            />
          ),
          props: actionsCellProps,
        },
      };

      return columns.map(({ id }) => {
        const cell = rowCells[id]?.cell;
        const props = rowCells[id]?.props || undefined;
        return { id, props, cell };
      });
    },
  );
};
