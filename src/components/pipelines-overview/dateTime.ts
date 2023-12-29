import * as _ from 'lodash-es';
import { getLastLanguage } from './utils';

// Conversions between units and milliseconds
const s = 1000;
const m = s * 60;
const h = m * 60;
const d = h * 24;
const w = d * 7;
const units = { w, d, h, m, s };

// Converts a duration like "1h 10m 23s" to milliseconds or returns 0 if the duration could not be
// parsed
export const parsePrometheusDuration = (duration: string): number => {
  try {
    const parts = duration
      .trim()
      .split(/\s+/)
      .map((p) => p.match(/^(\d+)([wdhms])$/));
    return _.sumBy(parts, (p) => parseInt(p[1], 10) * units[p[2]]);
  } catch (ignored) {
    // Invalid duration format
    return 0;
  }
};

/**
 * Converts a duration in milliseconds to a Prometheus time duration string like "1h 10m"
 * @param {number} ms - Time duration in milliseconds
 * @returns {string} The duration converted to a Prometheus time duration string
 * @example
 * ```
 * formatPrometheusDuration(65000) // Returns "1m 5s"
 * ```
 */
export const formatPrometheusDuration = (ms: number) => {
  if (!_.isFinite(ms) || ms < 0) {
    return '';
  }
  let remaining = ms;
  let str = '';
  _.each(units, (factor, unit) => {
    const n = Math.floor(remaining / factor);
    if (n > 0) {
      str += `${n}${unit} `;
      remaining -= n * factor;
    }
  });
  return _.trim(str);
};

export const getXaxisValues = (timespan: number): number[] => {
  const xValues = [];
  if (!timespan) return xValues;
  const oneDayDuration = parsePrometheusDuration('1d');
  const numDays = Math.round(timespan / oneDayDuration);
  const d = new Date(Date.now());
  d.setHours(0, 0, 0, 0);
  while (xValues.length - 1 < numDays) {
    xValues.push(d.getTime());
    d.setDate(d.getDate() - 1);
  }
  return xValues.slice(0, numDays);
};

export const getDropDownDate = (timespan: number): Date => {
  if (!timespan) return new Date();
  const oneDayDuration = parsePrometheusDuration('1d');
  const numDays = Math.round(timespan / oneDayDuration);
  const d = new Date(Date.now());
  d.setHours(0, 0, 0, 0);
  if (numDays != 1) {
    d.setDate(d.getDate() - numDays);
  }
  return d;
};

export const formatTime = (time: string): string => {
  const t = time?.split(/[:.]+/);
  if (t === undefined) {
    return '-';
  }

  let timestring = '';
  if (t[0] != '00') {
    timestring = t[0].replace(/^0+/, '') + 'h ';
  }
  if (t[1] != '00') {
    timestring += t[1].replace(/^0+/, '') + 'm ';
  }
  if (t[2] != '00') {
    timestring += t[2].replace(/^0+/, '') + 's ';
  }
  if (timestring == '') {
    timestring = 'less than a sec';
  }
  return timestring;
};

export const formatTimeLastRunTime = (time: number): string => {
  if (!time) {
    return '-';
  }
  const currentTimestamp = Math.floor(Date.now() / 1000); // Current timestamp in seconds
  const timeDifference = currentTimestamp - time;

  // Convert the time difference into seconds, minutes, hours, etc.
  const minutes = Math.floor(timeDifference / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30); // Approximate months (30 days)
  const years = Math.floor(months / 12); // Approximate years (12 months)

  // Determine the output based on the time difference
  if (years > 0) {
    return `${years} year${years > 1 ? 's' : ''} ago`;
  } else if (months > 0) {
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return `${timeDifference} second${timeDifference !== 1 ? 's' : ''} ago`;
  }
};

export const dateFormatterNoYear = new Intl.DateTimeFormat(
  getLastLanguage() || undefined,
  {
    month: 'short',
    day: 'numeric',
  },
);

export const formatDate = (date: Date) => {
  return dateFormatterNoYear.format(date);
};

export const timeToMinutes = (timeString: string): number => {
  // Parse the time string
  const match = timeString?.split(/[:]+/);

  if (match) {
    // Extract components
    const hours = parseInt(match[0]);
    const minutes = parseInt(match[1]);
    const seconds = parseInt(match[2]);

    // Calculate total minutes
    const totalMinutes = hours * 60 + minutes + seconds / 60;

    return totalMinutes;
  } else {
    // Handle invalid time string
    console.error('Invalid time format');
    return null;
  }
};
