import { ComputedStatus, PipelineRunKind } from '../../../types';
import { pipelineRunStatus } from '../../utils/pipeline-filter-reducer';
import {
  sortPipelineAndTaskRunsByDuration,
  sortRunsByComputedStatus,
} from '../pipeline-step-utils';

// Mock the pipeline-filter-reducer module
jest.mock('../../utils/pipeline-filter-reducer', () => ({
  pipelineRunStatus: jest.fn(),
}));

const mockPipelineRunStatus = pipelineRunStatus as jest.MockedFunction<
  typeof pipelineRunStatus
>;

describe('sortPipelineAndTaskRunsByDuration', () => {
  const createMockPipelineRun = (
    name: string,
    startTime?: string,
    completionTime?: string,
    status?: ComputedStatus,
  ): PipelineRunKind => ({
    metadata: {
      name,
      namespace: 'test-namespace',
    },
    spec: {},
    status: {
      pipelineSpec: {
        tasks: [],
      },
      ...(startTime && { startTime }),
      ...(completionTime && { completionTime }),
      ...(status && { status }),
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPipelineRunStatus.mockReturnValue(ComputedStatus.Succeeded);
  });

  describe('ascending order', () => {
    it('should sort pipeline runs by duration in ascending order', () => {
      const pipelineRuns: PipelineRunKind[] = [
        createMockPipelineRun(
          'run-long',
          '2023-01-01T10:00:00Z',
          '2023-01-01T10:10:00Z', // 10 minutes
        ),
        createMockPipelineRun(
          'run-short',
          '2023-01-01T10:00:00Z',
          '2023-01-01T10:05:00Z', // 5 minutes
        ),
        createMockPipelineRun(
          'run-very-short',
          '2023-01-01T10:00:00Z',
          '2023-01-01T10:00:30Z', // 30 seconds
        ),
        createMockPipelineRun(
          'run-medium',
          '2023-01-01T10:00:00Z',
          '2023-01-01T10:07:00Z', // 7 minutes
        ),
      ];

      const result = sortPipelineAndTaskRunsByDuration(pipelineRuns, 'asc');

      expect(result[0].metadata.name).toBe('run-very-short');
      expect(result[1].metadata.name).toBe('run-short');
      expect(result[2].metadata.name).toBe('run-medium');
      expect(result[3].metadata.name).toBe('run-long');
    });

    it('should handle running pipeline runs by using current time for duration calculation', () => {
      const now = new Date('2023-01-01T10:30:00Z');
      jest.spyOn(Date, 'now').mockReturnValue(now.getTime());
      mockPipelineRunStatus.mockReturnValue(ComputedStatus.Running);

      const pipelineRuns: PipelineRunKind[] = [
        createMockPipelineRun(
          'run-completed',
          '2023-01-01T10:00:00Z',
          '2023-01-01T10:05:00Z', // 5 minutes
        ),
        createMockPipelineRun(
          'run-running',
          '2023-01-01T10:00:00Z', // 30 minutes from start to now
        ),
      ];

      const result = sortPipelineAndTaskRunsByDuration(pipelineRuns, 'asc');

      expect(result[0].metadata.name).toBe('run-completed');
      expect(result[1].metadata.name).toBe('run-running');

      jest.restoreAllMocks();
    });
  });

  describe('descending order', () => {
    it('should sort pipeline runs by duration in descending order', () => {
      const pipelineRuns: PipelineRunKind[] = [
        createMockPipelineRun(
          'run-short',
          '2023-01-01T10:00:00Z',
          '2023-01-01T10:05:00Z', // 5 minutes
        ),
        createMockPipelineRun(
          'run-long',
          '2023-01-01T10:00:00Z',
          '2023-01-01T10:10:00Z', // 10 minutes
        ),
        createMockPipelineRun(
          'run-medium',
          '2023-01-01T10:00:00Z',
          '2023-01-01T10:07:00Z', // 7 minutes
        ),
      ];

      const result = sortPipelineAndTaskRunsByDuration(pipelineRuns, 'desc');

      expect(result[0].metadata.name).toBe('run-long');
      expect(result[1].metadata.name).toBe('run-medium');
      expect(result[2].metadata.name).toBe('run-short');
    });
  });

  describe('edge cases', () => {
    it('should handle pipeline runs without completion time (but not running)', () => {
      mockPipelineRunStatus.mockReturnValue(ComputedStatus.Failed);

      const pipelineRuns: PipelineRunKind[] = [
        createMockPipelineRun('run-no-completion', '2023-01-01T10:00:00Z'),
        createMockPipelineRun(
          'run-normal',
          '2023-01-01T10:00:00Z',
          '2023-01-01T10:05:00Z',
        ),
      ];

      const result = sortPipelineAndTaskRunsByDuration(pipelineRuns, 'asc');

      expect(result[0].metadata.name).toBe('run-no-completion');
      expect(result[1].metadata.name).toBe('run-normal');
    });

    it('should sort by name when durations are equal', () => {
      const pipelineRuns: PipelineRunKind[] = [
        createMockPipelineRun(
          'run-z',
          '2023-01-01T10:00:00Z',
          '2023-01-01T10:05:00Z', // 5 minutes
        ),
        createMockPipelineRun(
          'run-a',
          '2023-01-01T10:00:00Z',
          '2023-01-01T10:05:00Z', // 5 minutes
        ),
        createMockPipelineRun(
          'run-m',
          '2023-01-01T10:00:00Z',
          '2023-01-01T10:05:00Z', // 5 minutes
        ),
      ];

      const result = sortPipelineAndTaskRunsByDuration(pipelineRuns, 'asc');

      expect(result[0].metadata.name).toBe('run-a');
      expect(result[1].metadata.name).toBe('run-m');
      expect(result[2].metadata.name).toBe('run-z');
    });

    it('should not mutate the original array', () => {
      const pipelineRuns: PipelineRunKind[] = [
        createMockPipelineRun(
          'run-b',
          '2023-01-01T10:00:00Z',
          '2023-01-01T10:10:00Z',
        ),
        createMockPipelineRun(
          'run-a',
          '2023-01-01T10:00:00Z',
          '2023-01-01T10:05:00Z',
        ),
      ];

      const originalOrder = pipelineRuns.map((run) => run.metadata.name);
      sortPipelineAndTaskRunsByDuration(pipelineRuns, 'asc');

      // Original array should remain unchanged
      expect(pipelineRuns.map((run) => run.metadata.name)).toEqual(
        originalOrder,
      );
    });

    it('should handle empty array', () => {
      const result = sortPipelineAndTaskRunsByDuration([], 'asc');
      expect(result).toEqual([]);
    });

    it('should handle single pipeline run', () => {
      const pipelineRuns: PipelineRunKind[] = [
        createMockPipelineRun(
          'single-run',
          '2023-01-01T10:00:00Z',
          '2023-01-01T10:05:00Z',
        ),
      ];

      const result = sortPipelineAndTaskRunsByDuration(pipelineRuns, 'asc');

      expect(result).toHaveLength(1);
      expect(result[0].metadata.name).toBe('single-run');
    });
  });

  describe('duration calculation edge cases', () => {
    it('should handle pipeline runs with completion time before start time', () => {
      const pipelineRuns: PipelineRunKind[] = [
        createMockPipelineRun(
          'run-time-anomaly',
          '2023-01-01T10:10:00Z', // start time after completion
          '2023-01-01T10:05:00Z', // completion time before start
        ),
        createMockPipelineRun(
          'run-normal',
          '2023-01-01T10:00:00Z',
          '2023-01-01T10:05:00Z',
        ),
      ];

      const result = sortPipelineAndTaskRunsByDuration(pipelineRuns, 'asc');

      // Should handle negative duration gracefully
      expect(result).toHaveLength(2);
    });
  });
});

describe('sortRunsByComputedStatus', () => {
  const createMockRun = (name: string): PipelineRunKind => ({
    metadata: { name, namespace: 'test-namespace' },
    spec: {},
    status: { pipelineSpec: { tasks: [] } },
  });

  describe('ascending order', () => {
    it('should sort items alphabetically by computed status', () => {
      const runs = [
        createMockRun('run-c'),
        createMockRun('run-a'),
        createMockRun('run-b'),
      ];
      const reducer = (run: PipelineRunKind) => {
        if (run.metadata.name === 'run-a') return 'Failed';
        if (run.metadata.name === 'run-b') return 'Running';
        return 'Succeeded';
      };

      const result = sortRunsByComputedStatus(runs, 'asc', reducer);

      expect(result.map((r) => r.metadata.name)).toEqual([
        'run-a', // Failed
        'run-b', // Running
        'run-c', // Succeeded
      ]);
    });
  });

  describe('descending order', () => {
    it('should sort items in reverse alphabetical order by computed status', () => {
      const runs = [
        createMockRun('run-failed'),
        createMockRun('run-succeeded'),
        createMockRun('run-running'),
      ];
      const reducer = (run: PipelineRunKind) => {
        if (run.metadata.name === 'run-failed') return 'Failed';
        if (run.metadata.name === 'run-running') return 'Running';
        return 'Succeeded';
      };

      const result = sortRunsByComputedStatus(runs, 'desc', reducer);

      expect(result.map((r) => r.metadata.name)).toEqual([
        'run-succeeded', // Succeeded
        'run-running', // Running
        'run-failed', // Failed
      ]);
    });
  });

  describe('multiple raw reasons mapping to one computed status', () => {
    it('should group items with different raw reasons but same computed status', () => {
      const runs = [
        createMockRun('run-timeout'),
        createMockRun('run-succeeded'),
        createMockRun('run-failed-normal'),
        createMockRun('run-cancelled'),
      ];
      const reducer = (run: PipelineRunKind) => {
        switch (run.metadata.name) {
          case 'run-timeout':
            return 'Failed';
          case 'run-failed-normal':
            return 'Failed';
          case 'run-cancelled':
            return 'Cancelled';
          default:
            return 'Succeeded';
        }
      };

      const result = sortRunsByComputedStatus(runs, 'asc', reducer);

      expect(result.map((r) => r.metadata.name)).toEqual([
        'run-cancelled', // Cancelled
        'run-timeout', // Failed
        'run-failed-normal', // Failed
        'run-succeeded', // Succeeded
      ]);
    });
  });

  describe('missing status conditions', () => {
    it('should handle runs where reducer returns a fallback value', () => {
      const runs = [
        createMockRun('run-ok'),
        createMockRun('run-no-status'),
        createMockRun('run-failed'),
      ];
      const reducer = (run: PipelineRunKind) => {
        if (run.metadata.name === 'run-no-status') return '-';
        if (run.metadata.name === 'run-failed') return 'Failed';
        return 'Succeeded';
      };

      const result = sortRunsByComputedStatus(runs, 'asc', reducer);

      expect(result.map((r) => r.metadata.name)).toEqual([
        'run-no-status', // '-' (ComputedStatus.Other)
        'run-failed', // Failed
        'run-ok', // Succeeded
      ]);
    });
  });

  describe('deterministic behavior', () => {
    it('should maintain relative order of items with equal computed status', () => {
      const runs = [
        createMockRun('run-z'),
        createMockRun('run-a'),
        createMockRun('run-m'),
      ];
      const reducer = () => 'Failed';

      const result1 = sortRunsByComputedStatus(runs, 'asc', reducer);
      const result2 = sortRunsByComputedStatus(runs, 'asc', reducer);

      expect(result1.map((r) => r.metadata.name)).toEqual(
        result2.map((r) => r.metadata.name),
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty array', () => {
      const result = sortRunsByComputedStatus([], 'asc', () => 'Failed');
      expect(result).toEqual([]);
    });

    it('should handle single item', () => {
      const runs = [createMockRun('only-run')];
      const result = sortRunsByComputedStatus(runs, 'asc', () => 'Succeeded');

      expect(result).toHaveLength(1);
      expect(result[0].metadata.name).toBe('only-run');
    });
  });
});
