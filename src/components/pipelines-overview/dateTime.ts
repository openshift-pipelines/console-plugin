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

export const formatTimeLastRunTime = (time: string): string => {
  let timeValue = time?.split(/\s+/);
  if (timeValue === undefined) {
    return '-';
  }
  if(timeValue.length > 1){
    // Check for the presence of each component
    const hasYear = timeValue.includes('year') || timeValue.includes('years');
    const hasMonth = timeValue.includes('month') || timeValue.includes('months');
    const hasDay = timeValue.includes('day') || timeValue.includes('days');

    // Return the most significant time component
    if (hasYear) {
      return timeValue.includes('year') ? timeValue[timeValue.indexOf('year') - 1] + ' year ago' : timeValue[timeValue.indexOf('years') - 1] + ' years ago';
    } else if (hasMonth) {
      return timeValue.includes('month') ? timeValue[timeValue.indexOf('month') - 1] + ' month ago' : timeValue[timeValue.indexOf('months') - 1] + ' months ago';
    } else if (hasDay) {
      return timeValue.includes('day') ? timeValue[timeValue.indexOf('day') - 1] + ' day ago' : timeValue[timeValue.indexOf('days') - 1] + ' days ago';
    }
    else {
      return `${timeValue.pop()} ago`;
    }
  }
  else{
    const [hours, minutes, seconds] = time.split(/[:.]/).map(Number);
    if (!isNaN(hours) && hours > 0) {
      return hours === 1 ? `${hours} hour ago` : `${hours} hours ago`;
    } else if (!isNaN(minutes) && minutes > 0) {
      return minutes === 1 ? `${minutes} min ago` : `${minutes} mins ago`;
    } else if (!isNaN(seconds) && seconds > 0) {
      return seconds === 1 ? `${seconds} sec ago` : `${seconds} secs ago`;
    } else {
      return null; // No significant time component found
    }
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
