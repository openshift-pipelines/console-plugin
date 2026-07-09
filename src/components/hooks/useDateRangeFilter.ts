import { useUserPreference } from '@openshift-console/dynamic-plugin-sdk';
import { useMemo } from 'react';
import { USER_PREFERENCE_PREFIX } from '../../consts';

const s = 1000;
const m = 60 * s;
const h = 60 * m;
const d = 24 * h;
const w = 7 * d;

const DURATION_MS: Record<string, number> = { s, m, h, d, w };

/** Parse a duration string like "1d", "1w", "4w 2d" into milliseconds. */
export const parseDurationForDateRangeFiltering = (
  duration: string,
): number => {
  let total = 0;
  for (const part of duration.trim().split(/\s+/)) {
    const match = part.match(/^(\d+)([wdhms])$/);
    if (!match) return 0;
    total += parseInt(match[1], 10) * DURATION_MS[match[2]];
  }
  return total;
};

/** Midnight (00:00) of the current day in local time. */
const startOfToday = (): number => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.getTime();
};

export type DateRangeFilterResult = {
  timespan: number;
  setTimespanDateFilter: (ms: number) => void;
  startDate: number | undefined;
  dateFilterCEL: string;
  preferenceLoaded: boolean;
};

export const NO_DATE_RANGE_FILTER = 0;

export const useDateRangeFilter = (
  resourceType: string | undefined,
  enabled = true,
): DateRangeFilterResult => {
  const [timespan, setTimespanDateFilter, preferenceLoaded] =
    useUserPreference<number>(
      `${USER_PREFERENCE_PREFIX}.dateRangeFilter.${resourceType}`,
      enabled ? NO_DATE_RANGE_FILTER : undefined,
      !!resourceType,
    );

  const selectedTimespan = timespan ?? NO_DATE_RANGE_FILTER;

  // Normalize to midnight so "Last day" means from 00:00 yesterday, not 24h ago
  const startDate = useMemo(() => {
    if (!selectedTimespan) return undefined;
    return startOfToday() - selectedTimespan;
  }, [selectedTimespan]);

  const dateFilterCEL = useMemo(() => {
    if (!startDate) return '';
    return `data.status.startTime > timestamp("${new Date(
      startDate,
    ).toISOString()}")`;
  }, [startDate]);

  return {
    timespan: selectedTimespan,
    setTimespanDateFilter,
    startDate,
    dateFilterCEL,
    preferenceLoaded,
  };
};
