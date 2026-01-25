import {
  ResourceLink,
  RowProps,
  TableData,
  Timestamp,
  getGroupVersionKindForModel,
} from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import { ArchiveIcon } from '@patternfly/react-icons';
import { ComputedStatus, PipelineRunKind, TaskRunKind } from '../../types';
import { ResourceLinkWithIcon } from '../utils/resource-link';
import { PipelineRunModel } from '../../models';
import { Tooltip } from '@patternfly/react-core';
import {
  DELETED_RESOURCE_IN_K8S_ANNOTATION,
  RESOURCE_LOADED_FROM_RESULTS_ANNOTATION,
  RepoAnnotationFields,
  RepositoryAnnotations,
  RepositoryFields,
  RepositoryLabels,
  chainsSignedAnnotation,
} from '../../consts';
import { useTranslation } from 'react-i18next';
import SignedBadgeIcon from '../../images/SignedBadge';
import PipelineRunVulnerabilities from '../pipelines-list/status/PipelineRunVulnerabilities';
import { useTaskRuns } from '../hooks/useTaskRuns';
import {
  pipelineRunFilterReducer,
  pipelineRunStatus,
  pipelineRunTitleFilterReducer,
} from '../utils/pipeline-filter-reducer';
import LinkedPipelineRunTaskStatus from '../pipelines-list/status/LinkedPipelineRunTaskStatus';
import PipelineRunsKebab from './PipelineRunsKebab';
import { ExternalLink } from '../utils/link';
import { truncateMiddle } from '../utils/common-utils';
import { sanitizeBranchName } from '../utils/repository-utils';
import { TaskStatus } from '../utils/pipeline-augment';
import {
  getPipelineRunStatus,
  pipelineRunDuration,
} from '../utils/pipeline-utils';
import PipelineRunStatusContent from '../status/PipelineRunStatusContent';

export const tableColumnClasses = {
  name: 'pf-m-width-20',
  commit: 'pf-m-hidden pf-m-visible-on-sm pf-m-width-10',
  namespace: '',
  vulnerabilities: 'pf-m-hidden pf-m-visible-on-md',
  status: 'pf-m-hidden pf-m-visible-on-sm pf-m-width-10',
  taskStatus: 'pf-m-hidden pf-m-visible-on-lg',
  started: 'pf-m-hidden pf-m-visible-on-lg',
  duration: 'pf-m-hidden pf-m-visible-on-xl',
  branch: 'pf-m-hidden pf-m-visible-on-xl pf-m-width-5',
  actions: 'dropdown-kebab-pf pf-v5-c-table__action',
};

type PLRStatusProps = {
  obj: PipelineRunKind;
};

type PipelineRunRowWithoutTaskRunsProps = {
  obj: PipelineRunKind;
  taskRunStatusObj: TaskStatus;
  activeColumnIDs: Set<string>;
  currentUser: string;
  repositoryPLRs?: boolean;
};

type PipelineRunRowWithTaskRunsProps = {
  obj: PipelineRunKind;
  activeColumnIDs: Set<string>;
  currentUser: string;
  repositoryPLRs?: boolean;
};

const TASKRUNSFORPLRCACHE: { [key: string]: TaskRunKind[] } = {};
const InFlightStoreForTaskRunsForPLR: { [key: string]: boolean } = {};

const PLRStatus: React.FC<PLRStatusProps> = React.memo(({ obj }) => {
  return (
    <PipelineRunStatusContent
      status={pipelineRunFilterReducer(obj)}
      title={pipelineRunTitleFilterReducer(obj)}
      pipelineRun={obj}
    />
  );
});

const PipelineRunRowTable = ({
  obj,
  PLRTaskRuns,
  taskRunsLoaded,
  taskRunStatusObj,
  activeColumnIDs,
  repositoryPLRs,
  currentUser,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const plrLabels = obj.metadata.labels;
  const plrAnnotations = obj.metadata.annotations;
  const branchName =
    plrLabels?.[RepositoryAnnotations[RepoAnnotationFields.BRANCH]] ||
    plrAnnotations?.[RepositoryAnnotations[RepoAnnotationFields.BRANCH]];
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
      {repositoryPLRs && (
        <TableData
          id="commit-id"
          className={tableColumnClasses.commit}
          activeColumnIDs={activeColumnIDs}
        >
          <Tooltip
            data-test="tooltip-msg"
            content={
              <>
                {plrAnnotations?.[
                  RepositoryAnnotations[RepoAnnotationFields.SHA_MESSAGE]
                ] ?? plrLabels?.[RepositoryLabels[RepositoryFields.SHA]]}
              </>
            }
          >
            <ExternalLink
              href={
                plrAnnotations?.[
                  RepositoryAnnotations[RepoAnnotationFields.SHA_URL]
                ]
              }
            >
              {truncateMiddle(
                plrLabels[RepositoryLabels[RepositoryFields.SHA]],
                {
                  length: 7,
                  truncateEnd: true,
                  omission: '',
                },
              )}
            </ExternalLink>
          </Tooltip>
        </TableData>
      )}
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
        <PLRStatus obj={obj} />
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
          taskRunStatusObj={taskRunStatusObj}
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
      {repositoryPLRs && (
        <TableData
          id="branch-tag"
          className={tableColumnClasses.branch}
          activeColumnIDs={activeColumnIDs}
        >
          {sanitizeBranchName(branchName)}
        </TableData>
      )}
      <TableData
        className={tableColumnClasses.actions}
        id="kebab-menu"
        activeColumnIDs={activeColumnIDs}
      >
        <PipelineRunsKebab
          obj={obj}
          taskRuns={PLRTaskRuns}
          taskRunStatusObj={taskRunStatusObj}
          currentUser={currentUser}
        />
      </TableData>
    </>
  );
};

const PipelineRunRowWithoutTaskRuns: React.FC<PipelineRunRowWithoutTaskRunsProps> =
  React.memo(
    ({
      obj,
      taskRunStatusObj,
      activeColumnIDs,
      repositoryPLRs,
      currentUser,
    }) => {
      return (
        <PipelineRunRowTable
          obj={obj}
          PLRTaskRuns={[]}
          taskRunsLoaded
          taskRunStatusObj={taskRunStatusObj}
          activeColumnIDs={activeColumnIDs}
          repositoryPLRs={repositoryPLRs}
          currentUser={currentUser}
        />
      );
    },
  );

const PipelineRunRowWithTaskRunsFetch: React.FC<PipelineRunRowWithTaskRunsProps> =
  React.memo(({ obj, activeColumnIDs, repositoryPLRs, currentUser }) => {
    const cacheKey = `${obj.metadata.namespace}-${obj.metadata.name}`;
    const plrStatus = pipelineRunStatus(obj);
    const pipelineRunFinished =
      plrStatus !== ComputedStatus.Running &&
      plrStatus !== ComputedStatus.Pending &&
      plrStatus !== ComputedStatus.Cancelling;
    const [PLRTaskRuns, taskRunsLoaded] = useTaskRuns(
      obj.metadata.namespace,
      obj.metadata.name,
      {
        cacheKey: `${obj.metadata.namespace}-${obj.metadata.name}`,
        pipelineRunFinished,
      },
    );
    InFlightStoreForTaskRunsForPLR[cacheKey] = false;
    if (taskRunsLoaded) {
      TASKRUNSFORPLRCACHE[cacheKey] = PLRTaskRuns;
    }
    return (
      <PipelineRunRowTable
        obj={obj}
        PLRTaskRuns={PLRTaskRuns}
        taskRunsLoaded={taskRunsLoaded}
        taskRunStatusObj={undefined}
        activeColumnIDs={activeColumnIDs}
        repositoryPLRs={repositoryPLRs}
        currentUser={currentUser}
      />
    );
  });

const PipelineRunRowWithTaskRuns: React.FC<PipelineRunRowWithTaskRunsProps> =
  React.memo(({ obj, activeColumnIDs, repositoryPLRs, currentUser }) => {
    let PLRTaskRuns: TaskRunKind[];
    let taskRunsLoaded: boolean;
    const cacheKey = `${obj.metadata.namespace}-${obj.metadata.name}`;
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
        <PipelineRunRowWithTaskRunsFetch
          obj={obj}
          activeColumnIDs={activeColumnIDs}
          currentUser={currentUser}
        />
      );
    }
    return (
      <PipelineRunRowTable
        obj={obj}
        PLRTaskRuns={PLRTaskRuns}
        taskRunsLoaded={taskRunsLoaded}
        taskRunStatusObj={undefined}
        activeColumnIDs={activeColumnIDs}
        repositoryPLRs={repositoryPLRs}
        currentUser={currentUser}
      />
    );
  });

const PipelineRunRow: React.FC<
  RowProps<
    PipelineRunKind,
    {
      repositoryPLRs?: boolean;
      currentUser?: string;
    }
  >
> = ({ obj, activeColumnIDs, rowData: { repositoryPLRs, currentUser } }) => {
  const plrStatus = pipelineRunStatus(obj);
  if (
    plrStatus === ComputedStatus.Cancelled &&
    (obj?.status?.childReferences ?? []).length > 0
  ) {
    return (
      <PipelineRunRowWithTaskRuns
        obj={obj}
        activeColumnIDs={activeColumnIDs}
        repositoryPLRs={repositoryPLRs}
        currentUser={currentUser}
      />
    );
  }
  const taskRunStatusObj = getPipelineRunStatus(obj);
  return (
    <PipelineRunRowWithoutTaskRuns
      obj={obj}
      taskRunStatusObj={taskRunStatusObj}
      activeColumnIDs={activeColumnIDs}
      repositoryPLRs={repositoryPLRs}
      currentUser={currentUser}
    />
  );
};

export default PipelineRunRow;
