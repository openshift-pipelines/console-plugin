import { useUserPreference } from '@openshift-console/dynamic-plugin-sdk';
import { testHook } from '../../../test-data/utils/hooks-utils';
import {
  parseDurationForDateRangeFiltering,
  useDateRangeFilter,
} from '../useDateRangeFilter';

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  useUserPreference: jest.fn(),
}));

const useUserPreferenceMock = useUserPreference as jest.Mock;

const ONE_DAY_MS = 86400000;
const ONE_WEEK_MS = 604800000;

describe('useDateRangeFilter', () => {
  let setTimespanDateFilterMock: jest.Mock;

  beforeEach(() => {
    setTimespanDateFilterMock = jest.fn();
    useUserPreferenceMock.mockReturnValue([
      ONE_DAY_MS,
      setTimespanDateFilterMock,
    ]);
  });

  it('should return timespan from user preference', () => {
    const { result } = testHook(() => useDateRangeFilter('pipelineRun'));
    expect(result.current.timespan).toBe(ONE_DAY_MS);
  });

  it('should compute startDate from midnight minus timespan', () => {
    const { result } = testHook(() => useDateRangeFilter('pipelineRun'));
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    const expected = midnight.getTime() - ONE_DAY_MS;
    expect(result.current.startDate).toBe(expected);
  });

  it('should generate a valid CEL expression', () => {
    const { result } = testHook(() => useDateRangeFilter('pipelineRun'));
    expect(result.current.dateFilterCEL).toMatch(
      /^data\.status\.startTime > timestamp\(".*"\)$/,
    );
  });

  it('should default to 0 (no filter) when useUserPreference returns undefined', () => {
    useUserPreferenceMock.mockReturnValue([
      undefined,
      setTimespanDateFilterMock,
    ]);
    const { result } = testHook(() => useDateRangeFilter('pipelineRun'));
    expect(result.current.timespan).toBe(0);
    expect(result.current.dateFilterCEL).toBe('');
    expect(result.current.startDate).toBeUndefined();
  });

  it('should expose setTimespanDateFilter from the preference hook', () => {
    const { result } = testHook(() => useDateRangeFilter('pipelineRun'));
    result.current.setTimespanDateFilter(ONE_WEEK_MS);
    expect(setTimespanDateFilterMock).toHaveBeenCalledWith(ONE_WEEK_MS);
  });

  it('should use a different preference key for taskRun', () => {
    const { result } = testHook(() => useDateRangeFilter('taskRun'));
    expect(result.current.timespan).toBe(ONE_DAY_MS);
    expect(useUserPreferenceMock).toHaveBeenCalledWith(
      'plugin__pipelines-console-plugin.dateRangeFilter.taskRun',
      0,
      true,
    );
  });
});

describe('parseDurationForDateRangeFiltering', () => {
  it('should parse single unit durations', () => {
    expect(parseDurationForDateRangeFiltering('1d')).toBe(ONE_DAY_MS);
    expect(parseDurationForDateRangeFiltering('1w')).toBe(ONE_WEEK_MS);
    expect(parseDurationForDateRangeFiltering('2h')).toBe(7_200_000);
    expect(parseDurationForDateRangeFiltering('30m')).toBe(1_800_000);
    expect(parseDurationForDateRangeFiltering('10s')).toBe(10_000);
  });

  it('should parse multi-unit durations', () => {
    expect(parseDurationForDateRangeFiltering('4w 2d')).toBe(
      4 * ONE_WEEK_MS + 2 * ONE_DAY_MS,
    );
    expect(parseDurationForDateRangeFiltering('1d 12h')).toBe(
      ONE_DAY_MS + 12 * 3_600_000,
    );
  });

  it('should return 0 for invalid input', () => {
    expect(parseDurationForDateRangeFiltering('')).toBe(0);
    expect(parseDurationForDateRangeFiltering('abc')).toBe(0);
    expect(parseDurationForDateRangeFiltering('10x')).toBe(0);
  });
});
