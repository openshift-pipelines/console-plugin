import { TektonResourceLabel } from '../../../consts';
import { ComputedStatus, TaskRunKind } from '../../../types';
import { taskRunStatus } from '../../utils/pipeline-utils';

jest.mock('../../utils/pipeline-utils', () => ({
  taskRunStatus: jest.fn(),
}));

class PipelineRunLogsTest {
  getActiveTaskRun = (taskRuns: TaskRunKind[], activeTask: string): string => {
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
}

describe('PipelineRunLogs - getActiveTaskRun', () => {
  const mockTaskRuns: TaskRunKind[] = [
    {
      kind: 'TaskRun',
      apiVersion: 'tekton.dev/v1',
      metadata: {
        name: 'pipeline-test-tkn-abc',
        namespace: 'test-ns',
        labels: {
          [TektonResourceLabel.pipelineTask]: 'tkn',
        },
      },
      spec: {},
      status: {},
    } as TaskRunKind,
    {
      kind: 'TaskRun',
      apiVersion: 'tekton.dev/v1',
      metadata: {
        name: 'pipeline-test-kn-def',
        namespace: 'test-ns',
        labels: {
          [TektonResourceLabel.pipelineTask]: 'kn',
        },
      },
      spec: {},
      status: {},
    } as TaskRunKind,
    {
      kind: 'TaskRun',
      apiVersion: 'tekton.dev/v1',
      metadata: {
        name: 'pipeline-test-kn-1hr-ghi',
        namespace: 'test-ns',
        labels: {
          [TektonResourceLabel.pipelineTask]: 'kn-1hr',
        },
      },
      spec: {},
      status: {},
    } as TaskRunKind,
  ];

  let instance: PipelineRunLogsTest;

  beforeEach(() => {
    instance = new PipelineRunLogsTest();
    jest.clearAllMocks();
  });

  it('should return exact match for activeTask "kn" and not match "tkn" containing "kn"', () => {
    const result = instance.getActiveTaskRun(mockTaskRuns, 'kn');
    expect(result).toBe('pipeline-test-kn-def');
    // Ensure it doesn't return tkn which contains 'kn'
    expect(result).not.toBe('pipeline-test-tkn-abc');
  });

  it('should return exact match for activeTask "tkn" and not partially match other tasks', () => {
    const result = instance.getActiveTaskRun(mockTaskRuns, 'tkn');
    expect(result).toBe('pipeline-test-tkn-abc');
    // Ensure it doesn't match kn or kn-1hr
    expect(result).not.toBe('pipeline-test-kn-def');
    expect(result).not.toBe('pipeline-test-kn-1hr-ghi');
  });

  it('should return the failed task when no activeTask is provided', () => {
    const failedTaskRun: TaskRunKind = {
      kind: 'TaskRun',
      apiVersion: 'tekton.dev/v1',
      metadata: {
        name: 'pipeline-test-failed-task',
        namespace: 'test-ns',
        labels: {
          [TektonResourceLabel.pipelineTask]: 'failed-task',
        },
      },
      spec: {},
      status: {},
    } as TaskRunKind;

    const taskRunsWithFailed = [...mockTaskRuns, failedTaskRun];

    (taskRunStatus as jest.Mock).mockImplementation((taskRun: TaskRunKind) => {
      if (taskRun.metadata.name === 'pipeline-test-failed-task') {
        return ComputedStatus.Failed;
      }
      return ComputedStatus.Succeeded;
    });

    const result = instance.getActiveTaskRun(taskRunsWithFailed, '');
    expect(result).toBe('pipeline-test-failed-task');
  });
});
