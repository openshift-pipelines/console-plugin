import { ComputedStatus, PipelineRunKind } from '../../../types';
import { pipelineRunStatus } from '../../utils/pipeline-filter-reducer';
import { sortPipelineRunsByDuration } from '../pipeline-step-utils';

// Mock the pipeline-filter-reducer module
jest.mock('../../utils/pipeline-filter-reducer', () => ({
  pipelineRunStatus: jest.fn(),
}));

const mockPipelineRunStatus = pipelineRunStatus as jest.MockedFunction<
  typeof pipelineRunStatus
>;

describe('sortPipelineRunsByDuration', () => {
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

      const result = sortPipelineRunsByDuration(pipelineRuns, 'asc');

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

      const result = sortPipelineRunsByDuration(pipelineRuns, 'asc');

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

      const result = sortPipelineRunsByDuration(pipelineRuns, 'desc');

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

      const result = sortPipelineRunsByDuration(pipelineRuns, 'asc');

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

      const result = sortPipelineRunsByDuration(pipelineRuns, 'asc');

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
      sortPipelineRunsByDuration(pipelineRuns, 'asc');

      // Original array should remain unchanged
      expect(pipelineRuns.map((run) => run.metadata.name)).toEqual(
        originalOrder,
      );
    });

    it('should handle empty array', () => {
      const result = sortPipelineRunsByDuration([], 'asc');
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

      const result = sortPipelineRunsByDuration(pipelineRuns, 'asc');

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

      const result = sortPipelineRunsByDuration(pipelineRuns, 'asc');

      // Should handle negative duration gracefully
      expect(result).toHaveLength(2);
    });
  });
});
