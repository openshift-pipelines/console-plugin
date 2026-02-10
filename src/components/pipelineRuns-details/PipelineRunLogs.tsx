import * as React from 'react';
import { Alert, Banner, Nav, NavItem, NavList } from '@patternfly/react-core';
import { LogViewer } from '@patternfly/react-log-viewer';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom-v5-compat';
import {
  useFlag,
  WatchK8sResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { PipelineRunModel } from '../../models';
import {
  ComputedStatus,
  FLAGS,
  PipelineRunKind,
  PipelineTask,
  TaskRunKind,
} from '../../types';
import { TektonResourceLabel } from '../../consts';
import { useTaskRuns } from '../hooks/useTaskRuns';
import { useIsHubCluster } from '../hooks/useIsHubCluster';
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

interface PipelineRunLogsProps {
  obj: PipelineRunKind;
  activeTask?: string;
  activeStep?: string;
  taskRuns: TaskRunKind[];
  isDevConsoleProxyAvailable?: boolean;
  isHub?: boolean;
}

type PipelineRunLogsWithActiveTaskProps = {
  obj: PipelineRunKind;
};

const getActiveTaskRun = (
  taskRuns: TaskRunKind[],
  activeTask: string,
): string => {
  const activeTaskRun = activeTask
    ? taskRuns.find(
        (taskRun) =>
          taskRun.metadata?.labels?.[TektonResourceLabel.pipelineTask] ===
          activeTask,
      )
    : taskRuns.find(
        (taskRun) => taskRunStatus(taskRun) === ComputedStatus.Failed,
      ) || taskRuns[taskRuns.length - 1];

  return activeTaskRun?.metadata.name;
};

const getSortedTaskRun = (
  tRuns: TaskRunKind[],
  tasks: PipelineTask[],
): TaskRunKind[] => {
  const taskRuns = tRuns?.sort((a, b) => {
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

  const pipelineTaskNames = tasks?.map((t) => t?.name);
  return (
    taskRuns?.sort(
      (c, d) =>
        pipelineTaskNames?.indexOf(
          c?.metadata?.labels?.[TektonResourceLabel.pipelineTask],
        ) -
        pipelineTaskNames?.indexOf(
          d?.metadata?.labels?.[TektonResourceLabel.pipelineTask],
        ),
    ) || []
  );
};

const PipelineRunLogsComponent: React.FC<PipelineRunLogsProps> = ({
  obj,
  activeTask,
  activeStep,
  taskRuns: tRuns,
  isDevConsoleProxyAvailable,
  isHub,
}) => {
  const { t } = useTranslation();
  const [activeItem, setActiveItem] = React.useState<string>(null);
  const [navUntouched, setNavUntouched] = React.useState(true);

  const pipelineTasks = React.useMemo(
    () => [
      ...(obj?.status?.pipelineSpec?.tasks || []),
      ...(obj?.status?.pipelineSpec?.finally || []),
    ],
    [obj?.status?.pipelineSpec?.tasks, obj?.status?.pipelineSpec?.finally],
  );

  // Set initial active item on mount
  React.useEffect(() => {
    const sortedTaskRuns = getSortedTaskRun(tRuns, pipelineTasks);
    const newActiveItem = getActiveTaskRun(sortedTaskRuns, activeTask);
    setActiveItem(newActiveItem);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update active item when obj or taskRuns change (only if nav is untouched)
  React.useEffect(() => {
    if (navUntouched) {
      const sortedTaskRuns = getSortedTaskRun(tRuns, pipelineTasks);
      const newActiveItem = getActiveTaskRun(sortedTaskRuns, activeTask);
      setActiveItem(newActiveItem);
    }
  }, [obj, tRuns, activeTask, pipelineTasks, navUntouched]);

  const onNavSelect = React.useCallback((_e, item) => {
    setActiveItem(item.itemId);
    setNavUntouched(false);
  }, []);

  const taskRunNames =
    getSortedTaskRun(tRuns, pipelineTasks)?.map((tRun) => tRun.metadata.name) ??
    [];

  const logDetails = getPLRLogSnippet(obj, tRuns) as ErrorDetailsWithStaticLog;
  const pipelineStatus = pipelineRunStatus(obj);
  const taskCount = taskRunNames.length;
  const downloadAllCallback =
    taskCount > 1
      ? isHub
        ? getDownloadAllLogsCallbackMultiCluster(
            taskRunNames,
            tRuns,
            obj.metadata?.namespace,
            obj.metadata?.name,
            isDevConsoleProxyAvailable,
          )
        : getDownloadAllLogsCallback(
            taskRunNames,
            tRuns,
            obj.metadata?.namespace,
            obj.metadata?.name,
            isDevConsoleProxyAvailable,
          )
      : undefined;

  const activeTaskRun = tRuns.find(
    (taskRun) => taskRun.metadata.name === activeItem,
  );
  const podName = activeTaskRun?.status?.podName;
  const taskName =
    activeTaskRun?.metadata?.labels?.[TektonResourceLabel.pipelineTask] || '-';
  const pipelineRunFinished = pipelineStatus !== ComputedStatus.Running;
  const resources: WatchK8sResource = taskCount > 0 &&
    podName && {
      name: podName,
      kind: 'Pod',
      namespace: obj.metadata.namespace,
      isList: false,
    };
  const waitingForPods = !!(activeItem && !resources);

  const selectedItemRef = React.useCallback((item: HTMLSpanElement) => {
    if (item?.scrollIntoView) {
      item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  const logsPath = `${resourcePathFromModel(
    PipelineRunModel,
    obj.metadata.name,
    obj.metadata.namespace,
  )}/logs`;

  return (
    <div className="odc-pipeline-run-logs-main-div pf-v5-u-h-100">
      <div className="odc-pipeline-run-logs pf-v5-u-h-100 pf-v5-u-py-xl">
        <div
          className="odc-pipeline-run-logs__tasklist"
          data-test-id="logs-tasklist"
        >
          {taskCount > 0 ? (
            <Nav onSelect={onNavSelect} theme="light">
              <NavList className="odc-pipeline-run-logs__nav">
                {taskRunNames.map((taskRunName) => {
                  const taskRun = tRuns.find(
                    (tRun) => tRun.metadata.name === taskRunName,
                  );
                  return (
                    <NavItem
                      key={taskRunName}
                      itemId={taskRunName}
                      isActive={activeItem === taskRunName}
                      className="odc-pipeline-run-logs__navitem"
                    >
                      <Link
                        to={`${logsPath}?taskName=${
                          taskRun?.metadata?.labels?.[
                            TektonResourceLabel.pipelineTask
                          ] || '-'
                        }`}
                      >
                        <ColoredStatusIcon status={taskRunStatus(taskRun)} />
                        <span
                          className="odc-pipeline-run-logs__namespan"
                          ref={
                            activeItem === taskRunName
                              ? selectedItemRef
                              : undefined
                          }
                        >
                          {taskRun?.metadata?.labels?.[
                            TektonResourceLabel.pipelineTask
                          ] || '-'}
                        </span>
                      </Link>
                    </NavItem>
                  );
                })}
              </NavList>
            </Nav>
          ) : (
            <div className="odc-pipeline-run-logs__nav pf-v5-u-text-align-center">
              {t('No task runs found')}
            </div>
          )}
        </div>
        {activeItem && resources ? (
          <LogsWrapperComponent
            key={taskName}
            resource={resources}
            downloadAllLabel={t('Download all task logs')}
            onDownloadAll={downloadAllCallback}
            taskRun={activeTaskRun}
            activeStep={activeStep}
            isHub={isHub}
            pipelineRunName={obj.metadata?.name}
            pipelineRunFinished={pipelineRunFinished}
          />
        ) : (
          <div
            className="pf-v5-u-w-100 pf-v5-u-pr-xl"
            data-test-id="task-logs-error"
          >
            <LogViewer
              header={
                <Banner className="pf-v5-u-font-size-md">{taskName}</Banner>
              }
              hasLineNumbers={false}
              isTextWrapped={false}
              theme="dark"
              height="100%"
              data={
                waitingForPods && !pipelineRunFinished
                  ? `Waiting for ${taskName} task to start`
                  : !resources && pipelineRunFinished && !obj.status
                  ? t('No logs found')
                  : logDetails?.staticMessage ?? ''
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};

const PipelineRunLogs: React.FC<PipelineRunLogsProps> = (props) => {
  const isDevConsoleProxyAvailable = useFlag(FLAGS.DEVCONSOLE_PROXY);

  return (
    <PipelineRunLogsComponent
      {...props}
      isDevConsoleProxyAvailable={isDevConsoleProxyAvailable}
    />
  );
};

export const PipelineRunLogsWithActiveTask: React.FC<
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
  const [taskRuns, taskRunsLoaded, , , pendingAdmission, proxyUnavailable] =
    useTaskRuns(obj?.metadata?.namespace, obj?.metadata?.name, {
      pipelineRunFinished,
    });
  const [isHub] = useIsHubCluster();

  return (
    <>
      {proxyUnavailable && (
        <Alert
          isInline
          variant="warning"
          title={t(
            'The multi-cluster connection is unavailable. Logs and status may be delayed until connection is restored.',
          )}
        />
      )}
      {pendingAdmission && (
        <Alert
          isInline
          variant="info"
          title={t('PipelineRun is waiting to be admitted to a worker cluster')}
        />
      )}
      {taskRunsLoaded && (
        <PipelineRunLogs
          obj={obj}
          activeTask={activeTask}
          activeStep={activeStep}
          taskRuns={taskRuns}
          isHub={isHub}
        />
      )}
    </>
  );
};

export default PipelineRunLogs;
