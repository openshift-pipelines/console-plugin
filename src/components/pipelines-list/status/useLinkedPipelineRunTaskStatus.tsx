import { TaskStatus } from '../../utils/pipeline-augment';
import { ComputedStatus, PipelineRunKind, TaskRunKind } from '../../../types';
import { pipelineRunStatus } from '../../utils/pipeline-filter-reducer';
import { useTaskRuns } from '../../hooks/useTaskRuns';
import { getPipelineRunStatus } from '../../utils/pipeline-utils';

const TASKRUNS_FOR_PLR_CACHE: { [key: string]: TaskRunKind[] } = {};
const INFLIGHT_STORE_FOR_TASKRUNS_FOR_PLR: { [key: string]: boolean } = {};

interface LinkedPipelineRunTaskStatusData {
  taskRuns: TaskRunKind[];
  taskRunsLoaded: boolean;
  taskRunStatusObj: TaskStatus | undefined;
}
export const useLinkedPipelineRunTaskStatus = (
  pipelineRun: PipelineRunKind,
  propTaskRuns?: TaskRunKind[],
  propTaskRunsLoaded?: boolean,
  propTaskRunStatusObj?: TaskStatus,
): LinkedPipelineRunTaskStatusData => {
  const plrStatus = pipelineRunStatus(pipelineRun);
  const needsTaskRuns =
    plrStatus === ComputedStatus.Cancelled &&
    (pipelineRun.status?.childReferences ?? []).length > 0;

  const cacheKey = `${pipelineRun.metadata.namespace}-${pipelineRun.metadata.name}`;
  const cachedTaskRuns = TASKRUNS_FOR_PLR_CACHE[cacheKey];
  const isInFlight = INFLIGHT_STORE_FOR_TASKRUNS_FOR_PLR[cacheKey];

  const skipFetch =
    !needsTaskRuns || !!propTaskRuns || !!cachedTaskRuns || isInFlight;

  const [fetchedTaskRuns, fetchTaskRunsLoaded] = useTaskRuns(
    pipelineRun.metadata.namespace,
    pipelineRun.metadata.name,
    undefined,
    undefined,
    skipFetch,
  );

  INFLIGHT_STORE_FOR_TASKRUNS_FOR_PLR[cacheKey] = false;
  if (needsTaskRuns && !skipFetch && fetchTaskRunsLoaded) {
    TASKRUNS_FOR_PLR_CACHE[cacheKey] = fetchedTaskRuns;
  }

  return {
    taskRuns: propTaskRuns ?? cachedTaskRuns ?? fetchedTaskRuns ?? [],
    taskRunsLoaded:
      propTaskRunsLoaded ?? (cachedTaskRuns ? true : fetchTaskRunsLoaded),
    taskRunStatusObj:
      propTaskRunStatusObj ??
      (!needsTaskRuns ? getPipelineRunStatus(pipelineRun) : undefined),
  };
};
