import {
  useFlag,
  useUserPreference,
} from '@openshift-console/dynamic-plugin-sdk';
import { testHook } from '../../../test-data/utils/hooks-utils';
import { useDateRangeFilter } from '../useDateRangeFilter';

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  useFlag: jest.fn(),
  useUserPreference: jest.fn(),
}));

const useFlagMock = useFlag as jest.Mock;
const useUserPreferenceMock = useUserPreference as jest.Mock;

const ONE_DAY_MS = 86400000;
const ONE_WEEK_MS = 604800000;

describe('useDateRangeFilter', () => {
  let setTimespanMock: jest.Mock;

  beforeEach(() => {
    setTimespanMock = jest.fn();
    useFlagMock.mockReturnValue(true);
    useUserPreferenceMock.mockReturnValue([ONE_DAY_MS, setTimespanMock]);
  });

  it('should return timespan from user preference', () => {
    const { result } = testHook(() => useDateRangeFilter());
    expect(result.current.timespan).toBe(ONE_DAY_MS);
  });

  it('should compute startDate as Date.now() - timespan', () => {
    const now = Date.now();
    const { result } = testHook(() => useDateRangeFilter());
    const diff = now - result.current.timespan;
    expect(result.current.startDate).toBeGreaterThanOrEqual(diff - 100);
    expect(result.current.startDate).toBeLessThanOrEqual(diff + 100);
  });

  it('should generate a valid CEL expression', () => {
    const { result } = testHook(() => useDateRangeFilter());
    expect(result.current.dateFilterCEL).toMatch(
      /^data\.status\.startTime > timestamp\(".*"\)$/,
    );
  });

  it('should default to 1 day when useUserPreference returns undefined', () => {
    useUserPreferenceMock.mockReturnValue([undefined, setTimespanMock]);
    const { result } = testHook(() => useDateRangeFilter());
    expect(result.current.timespan).toBe(ONE_DAY_MS);
    expect(result.current.dateFilterCEL).not.toBe('');
  });

  it('should expose setTimespan from the preference hook', () => {
    const { result } = testHook(() => useDateRangeFilter());
    result.current.setTimespan(ONE_WEEK_MS);
    expect(setTimespanMock).toHaveBeenCalledWith(ONE_WEEK_MS);
  });

  it('should reflect the isTektonResultEnabled flag', () => {
    useFlagMock.mockReturnValue(false);
    const { result } = testHook(() => useDateRangeFilter());
    expect(result.current.isTektonResultEnabled).toBe(false);
  });
});
