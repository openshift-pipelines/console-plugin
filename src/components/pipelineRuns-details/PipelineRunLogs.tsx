import type { FC } from 'react';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { Nav, NavItem, NavList, Alert, Banner } from '@patternfly/react-core';
import { LogViewer } from '@patternfly/react-log-viewer';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import {
  ResourceIcon,
  WatchK8sResource,
  getGroupVersionKindForModel,
  useOverlay,
} from '@openshift-console/dynamic-plugin-sdk';
import { PipelineRunModel, TaskRunModel } from '../../models';
import {
  ComputedStatus,
  PipelineRunKind,
  PipelineTask,
  TaskRunKind,
} from '../../types';
import { TektonResourceLabel } from '../../consts';
import { useTaskRuns } from '../hooks/useTaskRuns';
import { useMultiClusterProxyService } from '../hooks/useMultiClusterProxyService';
import { ErrorDetailsWithStaticLog } from '../logs/log-snippet-types';
import {
  getDownloadAllLogsCallback,
  getDownloadAllLogsCallbackMultiCluster,
} from '../logs/logs-utils';
import LogsWrapperComponent from '../logs/LogsWrapperComponent';
import { getPLRLogSnippet } from '../logs/pipelineRunLogSnippet';
import { taskRunStatus } from '../utils/pipeline-utils';
import { pipelineRunStatus } from '../utils/pipeline-filter-reducer';
import { ColoredStatusIcon } from '../pipeline-topology/StatusIcons';
import { resourcePathFromModel } from '../utils/utils';
import './PipelineRunLogs.scss';
import { Loading } from '../Loading';
import {
  useChildPipelineRunReferences,
  useChildPipelineRuns,
} from '../hooks/useChildPipelineRuns';
interface PipelineRunLogsProps {
  obj: PipelineRunKind;
  activeTask?: string;
  activeStep?: string;
  taskRuns: TaskRunKind[];
  isResourceManagedByKueue?: boolean;
  childPipelineRuns?: PipelineRunKind[];
}

type PipelineRunLogsWithActiveTaskProps = {
  obj: PipelineRunKind;
};

const isTaskRun = (run: TaskRunKind | PipelineRunKind): run is TaskRunKind =>
  run && run.kind === 'TaskRun';

const isPipelineRun = (
  run: TaskRunKind | PipelineRunKind,
): run is PipelineRunKind => run && run.kind === 'PipelineRun';

const getActiveRun = (
  runs: Array<TaskRunKind | PipelineRunKind>,
  activeTask?: string,
): string | undefined => {
  const activeRun = activeTask
    ? runs.find(
        (run) =>
          run.metadata?.labels?.[TektonResourceLabel.pipelineTask] ===
          activeTask,
      )
    : runs.find((run) =>
        isTaskRun(run)
          ? taskRunStatus(run) === ComputedStatus.Failed
          : pipelineRunStatus(run) === ComputedStatus.Failed,
      ) ?? runs.at(-1);

  return activeRun?.metadata?.labels?.[TektonResourceLabel.pipelineTask];
};

const PipelineRunLogs: FC<PipelineRunLogsProps> = ({
  obj,
  activeTask,
  activeStep,
  taskRuns: tRuns = [],
  isResourceManagedByKueue,
  childPipelineRuns = [],
}) => {
  const { t } = useTranslation();
  const [activeItem, setActiveItem] = useState<string>(null);
  const [navUntouched, setNavUntouched] = useState(true);

  const launchOverlay = useOverlay();
  const tasks = obj?.status?.pipelineSpec?.tasks ?? [];
  const finallytasks = obj?.status?.pipelineSpec?.finally ?? [];
  const runs = useMemo(
    () => [...tRuns, ...childPipelineRuns],
    [tRuns, childPipelineRuns],
  );
  const pipelineTasks: PipelineTask[] = useMemo(
    () => [...tasks, ...finallytasks],
    [tasks, finallytasks],
  );

  const sortedRuns = useMemo(() => {
    const completedRuns = [...runs].sort((a, b) => {
      if (_.get(a, ['status', 'completionTime'], false)) {
        return b.status?.completionTime &&
          new Date(a.status.completionTime) > new Date(b.status.completionTime)
          ? 1
          : -1;
      }
      return b.status?.completionTime ||
        new Date(a.status?.startTime) > new Date(b.status?.startTime)
        ? 1
        : -1;
    });
    const pipelineTaskNames = pipelineTasks.map((t) => t.name);
    return completedRuns.sort(
      (c, d) =>
        pipelineTaskNames.indexOf(
          c?.metadata?.labels?.[TektonResourceLabel.pipelineTask],
        ) -
        pipelineTaskNames.indexOf(
          d?.metadata?.labels?.[TektonResourceLabel.pipelineTask],
        ),
    );
  }, [runs, pipelineTasks]);

  const onNavSelect = useCallback((_, item) => {
    setActiveItem(item.itemId);
    setNavUntouched(false);
  }, []);
  const taskRunNames = pipelineTasks
    .filter((item) => !item?.pipelineRef)
    .map((item) => item.name);
  const logDetails = getPLRLogSnippet(obj, tRuns) as ErrorDetailsWithStaticLog;
  const pipelineStatus = pipelineRunStatus(obj);
  const taskCount = sortedRuns ? sortedRuns.filter(isTaskRun).length : 0;
  const downloadAllCallback =
    taskCount > 1
      ? isResourceManagedByKueue
        ? getDownloadAllLogsCallbackMultiCluster(
            taskRunNames,
            tRuns,
            obj?.metadata?.namespace,
            obj?.metadata?.name,
          )
        : getDownloadAllLogsCallback(
            taskRunNames,
            tRuns,
            obj?.metadata?.namespace,
            obj?.metadata?.name,
            launchOverlay,
          )
      : undefined;

  const runByPipelineTaskName = useMemo(() => {
    const map = new Map<string, TaskRunKind | PipelineRunKind>();
    runs.forEach((run) => {
      const taskName = run.metadata.labels?.[TektonResourceLabel.pipelineTask];
      if (taskName) {
        map.set(taskName, run);
      }
    });
    return map;
  }, [runs]);

  const activeRun = runByPipelineTaskName.get(activeItem);

  const activeTaskRun = isTaskRun(activeRun) ? activeRun : undefined;

  const activePipelineRun = isPipelineRun(activeRun) ? activeRun : undefined;

  const podName = activeTaskRun?.status?.podName;
  const pipelineRunFinished = pipelineStatus !== ComputedStatus.Running;
  const resources: WatchK8sResource = taskCount > 0 &&
    podName && {
      name: podName,
      kind: 'Pod',
      namespace: obj.metadata.namespace,
      isList: false,
    };
  const waitingForPods = obj && activeRun?.kind === 'TaskRun' && !resources;

  const selectedItemRef = useCallback((item: HTMLSpanElement) => {
    if (item?.scrollIntoView) {
      item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  const logsPath = `${resourcePathFromModel(
    PipelineRunModel,
    obj?.metadata?.name,
    obj?.metadata?.namespace,
  )}/logs`;

  useEffect(() => {
    if (!navUntouched) return;
    const next = getActiveRun(sortedRuns, activeTask);
    if (next !== activeItem) {
      setActiveItem(next);
    }
  }, [sortedRuns, activeTask, navUntouched, activeItem]);

  return (
    <div className="odc-pipeline-run-logs-main-div pf-v6-u-h-100">
      <div className="odc-pipeline-run-logs pf-v6-u-h-100 pf-v6-u-py-xl">
        <div
          className="odc-pipeline-run-logs__tasklist"
          data-test-id="logs-tasklist"
        >
          <Nav onSelect={onNavSelect}>
            <NavList className="odc-pipeline-run-logs__nav">
              {pipelineTasks?.length > 0 ? (
                pipelineTasks.map((run) => {
                  const currRun = runByPipelineTaskName.get(run.name);

                  return (
                    <NavItem
                      key={run.name}
                      itemId={run.name}
                      isActive={activeItem === run.name}
                      className="odc-pipeline-run-logs__navitem"
                    >
                      <Link
                        to={
                          currRun && currRun.kind === 'PipelineRun'
                            ? `${resourcePathFromModel(
                                PipelineRunModel,
                                currRun.metadata.name,
                                currRun.metadata.namespace,
                              )}/logs`
                            : `${logsPath}?taskName=${run.name}`
                        }
                      >
                        <ColoredStatusIcon
                          status={
                            currRun
                              ? currRun?.kind === 'TaskRun'
                                ? taskRunStatus(currRun as TaskRunKind)
                                : pipelineRunStatus(currRun as PipelineRunKind)
                              : ComputedStatus.Pending
                          }
                        />
                        <ResourceIcon
                          groupVersionKind={
                            currRun
                              ? currRun?.kind === 'TaskRun'
                                ? getGroupVersionKindForModel(TaskRunModel)
                                : getGroupVersionKindForModel(PipelineRunModel)
                              : null
                          }
                        />
                        <span
                          className="odc-pipeline-run-logs__namespan"
                          ref={
                            activeItem === run.name
                              ? selectedItemRef
                              : undefined
                          }
                        >
                          {run.name}
                        </span>
                      </Link>
                    </NavItem>
                  );
                })
              ) : (
                <div className="odc-pipeline-run-logs__nav pf-v6-u-text-align-center">
                  {t('No task runs found')}
                </div>
              )}
            </NavList>
          </Nav>
        </div>
        {activePipelineRun ? (
          <div className="pf-v6-u-w-100 pf-v6-u-pr-xl">
            <LogViewer
              header={
                <Banner className="pf-v6-u-font-size-md">{activeItem}</Banner>
              }
              hasLineNumbers={false}
              isTextWrapped={false}
              theme="dark"
              height="100%"
              data={t(
                'Please select the navigation item to view the PipelineRun logs',
              )}
            />
          </div>
        ) : activeTaskRun && resources ? (
          <LogsWrapperComponent
            key={activeItem}
            resource={resources}
            downloadAllLabel={t('Download all task logs')}
            onDownloadAll={downloadAllCallback}
            taskRun={activeTaskRun as TaskRunKind}
            activeStep={activeStep}
            isResourceManagedByKueue={isResourceManagedByKueue}
            pipelineRunName={obj.metadata?.name}
            pipelineRunFinished={pipelineRunFinished}
          />
        ) : pipelineRunFinished && taskCount == 0 ? (
          <div
            className="pf-v6-u-w-100 pf-v6-u-pr-xl"
            data-test-id="task-logs-error"
          >
            <LogViewer
              header={
                <Banner className="pf-v6-u-font-size-md">
                  {activeItem ?? '-'}
                </Banner>
              }
              hasLineNumbers={false}
              isTextWrapped={false}
              theme="dark"
              height="100%"
              data={
                waitingForPods && !pipelineRunFinished
                  ? `Waiting for ${activeItem ?? '-'} task to start`
                  : !resources && pipelineRunFinished && !obj?.status
                  ? t('No logs found')
                  : logDetails?.staticMessage ?? ''
              }
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export const PipelineRunLogsWithActiveTask: FC<
  PipelineRunLogsWithActiveTaskProps
> = ({ obj }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const activeTask = params?.get('taskName');
  const activeStep = params?.get('step');
  const plrStatus = pipelineRunStatus(obj);
  const pipelineRunFinished =
    plrStatus !== ComputedStatus.Running &&
    plrStatus !== ComputedStatus.Pending &&
    plrStatus !== ComputedStatus.Cancelling;
  const [taskRuns, k8sLoaded, trLoaded, , pendingAdmission, proxyUnavailable] =
    useTaskRuns(
      obj?.metadata?.namespace,
      obj?.metadata?.name,
      undefined,
      undefined,
      {
        pipelineRunFinished,
        pipelineRunManagedBy: obj?.spec?.managedBy,
      },
    );
  const { isResourceManagedByKueue } = useMultiClusterProxyService({
    managedBy: obj?.spec?.managedBy,
  });
  const childPipelineRunRefs = useChildPipelineRunReferences(obj);
  const [childPipelineRuns] = useChildPipelineRuns(
    obj?.metadata?.namespace,
    obj?.metadata?.name,
    childPipelineRunRefs,
    { depth: 1 },
  );
  const taskRunsLoaded = (k8sLoaded && taskRuns.length > 0) || trLoaded;
  /* const logsLoaded =
    taskRunsLoaded && (!childPipelineRunRefs.length || childPipelineRunsLoaded); */
  return (
    <>
      {proxyUnavailable && (
        <Alert
          isInline
          variant="warning"
          className="pf-v6-u-mt-md"
          title={t(
            'The multi-cluster connection is unavailable. Logs and status may be delayed until connection is restored.',
          )}
        />
      )}
      {pendingAdmission && (
        <Alert
          isInline
          variant="info"
          className="pf-v6-u-mt-md"
          title={t('PipelineRun is waiting to be admitted to a worker cluster')}
        />
      )}
      {taskRunsLoaded ? (
        <PipelineRunLogs
          key={obj?.metadata?.name}
          obj={obj}
          activeTask={activeTask}
          activeStep={activeStep}
          taskRuns={taskRuns}
          isResourceManagedByKueue={isResourceManagedByKueue}
          childPipelineRuns={childPipelineRuns}
        />
      ) : (
        <Loading />
      )}
    </>
  );
};

export default PipelineRunLogs;
