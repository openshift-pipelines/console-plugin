import {
  K8sGroupVersionKind,
  K8sModel,
  K8sResourceKindReference,
  PrometheusResponse,
} from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { ALL_NAMESPACES_KEY } from '../../consts';
import { adjustToStartOfWeek } from '../pipelines-metrics/utils';

export const alphanumericCompare = (a: string, b: string): number => {
  return a.localeCompare(b, undefined, {
    numeric: true,
    sensitivity: 'base',
  });
};

export type SummaryProps = {
  total?: number;
  avg_duration?: string;
  succeeded?: number;
  failed?: number;
  running?: number;
  cancelled?: number;
  max_duration?: string;
  min_duration?: string;
  total_duration?: string;
  others?: number;
  group_value?: string;
  last_runtime?: number;
};

export type mainDataType = {
  repoName?: string;
  projectName?: string;
  pipelineName?: string;
  summary?: SummaryProps;
};

export const listPageTableColumnClasses = [
  '', //name
  '', //namespace
  'pf-m-hidden pf-m-visible-on-md', //total plr
  'pf-m-hidden pf-m-visible-on-md', //total duration
  'pf-m-hidden pf-m-visible-on-xl', //avg duration
  'pf-m-hidden pf-m-visible-on-xl', //success rate
  'pf-m-hidden pf-m-visible-on-xl', //last run time
];

export const TimeRangeOptions = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return {
    '1d': t('Last day'),
    '2w': t('Last weeks'),
    '4w 2d': t('Last month'),
    '12w': t('Last quarter'),
    '52w': t('Last year'),
  };
};

export const TimeRangeOptionsK8s = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return {
    '1d': t('Last day'),
    '2w': t('Last weeks'),
    '4w 2d': t('Last month'),
    '12w': t('Last quarter'),
  };
};

export const StatusOptions = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return {
    Succeeded: t('Succeeded'),
    Failed: t('Failed'),
    Running: t('Running'),
    Pending: t('Pending'),
    Cancelled: t('Cancelled'),
  };
};

export const IntervalOptions = () => {
  const OFF_KEY = 'OFF_KEY';
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return {
    [OFF_KEY]: t('Refresh off'),
    '15s': t('{{count}} second', { count: 15 }),
    '30s': t('{{count}} second', { count: 30 }),
    '1m': t('{{count}} minute', { count: 1 }),
    '5m': t('{{count}} minute', { count: 5 }),
    '15m': t('{{count}} minute', { count: 15 }),
    '30m': t('{{count}} minute', { count: 30 }),
    '1h': t('{{count}} hour', { count: 1 }),
    '2h': t('{{count}} hour', { count: 2 }),
    '1d': t('{{count}} day', { count: 1 }),
  };
};

export const useBoolean = (
  initialValue: boolean,
): [boolean, () => void, () => void, () => void] => {
  const [value, setValue] = React.useState(initialValue);
  const toggle = React.useCallback(() => setValue((v) => !v), []);
  const setTrue = React.useCallback(() => setValue(true), []);
  const setFalse = React.useCallback(() => setValue(false), []);
  return [value, toggle, setTrue, setFalse];
};

export const LAST_LANGUAGE_LOCAL_STORAGE_KEY = 'bridge/last-language';

export const getLastLanguage = (): string =>
  localStorage.getItem(LAST_LANGUAGE_LOCAL_STORAGE_KEY);

export const getReferenceForModel = (
  model: K8sModel,
): K8sResourceKindReference =>
  getReference({
    group: model.apiGroup,
    version: model.apiVersion,
    kind: model.kind,
  });

export const getReference = ({
  group,
  version,
  kind,
}: K8sGroupVersionKind): K8sResourceKindReference =>
  [group || 'core', version, kind].join('~');

export const sortByProperty = (
  array: SummaryProps[],
  prop: string,
  direction: string,
) => {
  return array.sort((a: SummaryProps, b: SummaryProps) => {
    const nameA =
      prop === 'namespace'
        ? a.group_value.split('/')[0].toLowerCase()
        : a.group_value.split('/')[1].toLowerCase();
    const nameB =
      prop === 'namespace'
        ? b.group_value.split('/')[0].toLowerCase()
        : b.group_value.split('/')[1].toLowerCase();

    const numberA = parseInt(nameA.replace(/^\D+/g, '')) || 0;
    const numberB = parseInt(nameB.replace(/^\D+/g, '')) || 0;

    const nameComparison = nameA.localeCompare(nameB);

    if (nameComparison === 0) {
      return direction === 'desc' ? numberB - numberA : numberA - numberB;
    }

    return direction === 'desc' ? nameComparison * -1 : nameComparison;
  });
};

export const sortTimeStrings = (
  array: SummaryProps[],
  prop: string,
  direction: string,
) => {
  return array.slice().sort((a, b) => {
    const getTimeValue = (timeString) => {
      const components = timeString?.split(/\s+/);
      let totalSeconds = 0;

      for (const component of components) {
        const value = parseInt(component);
        if (!isNaN(value)) {
          if (component.includes('year')) {
            totalSeconds += value * 365 * 24 * 3600; // Assuming 1 year = 365 days
          } else if (component.includes('month')) {
            totalSeconds += value * 30 * 24 * 3600; // Assuming 1 month = 30 days
          } else if (component.includes('day')) {
            totalSeconds += value * 24 * 3600;
          } else if (component.includes(':')) {
            // Parse HH:mm:ss.ms
            const timeParts = component.split(':').map(Number);
            totalSeconds +=
              timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
            if (timeParts.length === 4) {
              totalSeconds += timeParts[3] / 1000;
            }
          }
        }
      }

      return totalSeconds;
    };

    const timeA = getTimeValue(a[prop]);
    const timeB = getTimeValue(b[prop]);

    return direction === 'asc' ? timeA - timeB : timeB - timeA;
  });
};

export const sortByTimestamp = (
  items: SummaryProps[],
  prop: string,
  direction: string,
) => {
  const compareTimestamps = (a: SummaryProps, b: SummaryProps) => {
    const timestampA = a[prop];
    const timestampB = b[prop];

    return direction === 'asc'
      ? timestampA - timestampB
      : timestampB - timestampA;
  };

  const sortedItems = [...items].sort(compareTimestamps);

  return sortedItems;
};

export const sortByNumbers = (
  array: SummaryProps[],
  prop: string,
  direction: string,
) => {
  const modifier = direction === 'desc' ? -1 : 1;

  return array.slice().sort((a, b) => {
    const valueA = a[prop];
    const valueB = b[prop];

    // If 0 is a valid value, handle it separately
    if (valueA === 0 || valueB === 0) {
      return modifier * (valueA - valueB);
    }

    return modifier * (valueA || Infinity) - (valueB || Infinity);
  });
};

export const useInterval = (
  getData: () => void,
  interval: number,
  namespace: string,
  date: string,
  pageFlag?: number,
) => {
  React.useEffect(() => {
    getData();
    if (interval !== null) {
      const intervalID = setInterval(() => getData(), interval);
      return () => clearInterval(intervalID);
    }
  }, [interval, namespace, date, pageFlag]);
};

export const getFilter = (date, parentName, kind): string => {
  const filter = [`data.status.startTime>timestamp("${date}")`];
  if (kind === 'Pipeline') {
    filter.push(`data.spec.pipelineRef.contains("name")`);
  } else if (kind === 'Repository') {
    filter.push(
      `data.metadata.labels.contains('pipelinesascode.tekton.dev/repository')`,
    );
  }
  if (parentName) {
    if (kind === 'Pipeline') {
      filter.push(
        `data.metadata.labels['tekton.dev/pipeline']=="${parentName}"`,
      );
    } else if (kind === 'Repository') {
      filter.push(
        `data.metadata.labels['pipelinesascode.tekton.dev/repository']=="${parentName}"`,
      );
    }
  }
  return filter.join(' && ');
};

export const useQueryParams = (param) => {
  const {
    key,
    setValue,
    defaultValue,
    options,
    displayFormat,
    loadFormat,
    value,
  } = param;
  const [isLoaded, setIsLoaded] = React.useState(0);
  const history = useHistory();
  const queryParams = {};
  history.location.search
    .substring(1)
    ?.split('&')
    .forEach((_) => {
      const [key, value] = _.split('=');
      if (key) queryParams[key] = value;
    });

  function setQueryParams(key?: string, value?: string) {
    const path = history.location.pathname;

    if (key && value) queryParams[key] = value;
    history.push(
      `${path}?${Object.keys(queryParams)
        .map((k) => {
          const v = queryParams[k];
          if (k) return k + '=' + v;
        })
        .join('&')}`,
    );
  }

  //Loads Url Params Data
  React.useEffect(() => {
    if (queryParams[key]) {
      const paramValue = queryParams[key];
      if (!options || options[paramValue])
        setValue(loadFormat ? loadFormat(paramValue) : paramValue);
    }
  }, []);
  //If Url Params doesn't contain a key, initializes with defaultValue
  React.useEffect(() => {
    if (isLoaded >= 0) {
      if (!queryParams[key]) {
        const newValue = displayFormat
          ? displayFormat(defaultValue)
          : defaultValue;
        if (newValue) {
          setQueryParams(key, newValue);
          setIsLoaded(isLoaded + 1);
        }
      } else {
        setIsLoaded(-1);
      }
    }
  }, [isLoaded]);
  //Updating Url Params when values of filter changes
  React.useEffect(() => {
    const newValue = displayFormat ? displayFormat(value) : value;
    if (newValue) {
      setQueryParams(key, newValue);
    } else if (queryParams[key]) {
      delete queryParams[key];
      setQueryParams();
    }
  }, [value]);
};

export const formatNamespaceRoute = (
  activeNamespace,
  originalPath,
  location?,
  forceList?: boolean,
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let path = originalPath.substr((window as any).SERVER_FLAGS.basePath.length);

  let parts = path.split('/').filter((p) => p);
  const prefix = parts.shift();

  let previousNS;
  if (parts[0] === 'all-namespaces') {
    parts.shift();
    previousNS = ALL_NAMESPACES_KEY;
  } else if (parts[0] === 'ns') {
    parts.shift();
    previousNS = parts.shift();
  }

  if (!previousNS) {
    return originalPath;
  }

  if (
    (previousNS !== activeNamespace &&
      (parts[1] !== 'new' || activeNamespace !== ALL_NAMESPACES_KEY)) ||
    (activeNamespace === ALL_NAMESPACES_KEY && parts[1] === 'new') ||
    forceList
  ) {
    // a given resource will not exist when we switch namespaces, so pop off the tail end
    parts = parts.slice(0, 1);
  }

  const namespacePrefix =
    activeNamespace === ALL_NAMESPACES_KEY
      ? 'all-namespaces'
      : `ns/${activeNamespace}`;

  path = `/${prefix}/${namespacePrefix}`;
  if (parts.length) {
    path += `/${parts.join('/')}`;
  }

  if (location) {
    path += `${location.search}${location.hash}`;
  }

  return path;
};

export const isMatchingFirstTickValue = (
  firstTickValue: number | Date,
  firstPrometheusValue: number | Date,
  type: string,
) => {
  const group_date = new Date(Number(firstPrometheusValue) * 1000);
  const tickDate =
    typeof firstTickValue === 'number'
      ? new Date(firstTickValue * 1000)
      : firstTickValue;
  let isMatch = false;
  if (type === 'hour') {
    isMatch = group_date.getHours() === tickDate.getHours();
  } else if (type === 'week') {
    const adjustedGroupDate = adjustToStartOfWeek(new Date(group_date));
    isMatch = adjustedGroupDate.toDateString() === tickDate.toDateString();
  } else if (type === 'day') {
    isMatch = group_date.toDateString() === tickDate.toDateString();
  } else if (type === 'month') {
    isMatch = group_date.getMonth() === tickDate.getMonth();
  }
  return isMatch;
};

export const getTotalPipelineRuns = (
  prometheusResult: PrometheusResponse,
  tickValues: number[] | Date[],
  type: string,
): number => {
  let totalPLRCount = 0;

  if (prometheusResult?.data?.result[0]?.values) {
    const values = prometheusResult.data.result[0].values;
    let lastValue = parseInt(values[0][1], 10);
    let hasDecrement = false;
    let sum = 0;

    for (let i = 1; i < values.length; i++) {
      const currentValue = parseInt(values[i][1], 10);
      if (currentValue < lastValue) {
        hasDecrement = true;
        sum += lastValue;
      }
      lastValue = currentValue;
    }

    // If there's any decrement, add the last value to the sum
    if (hasDecrement) {
      sum += lastValue;
      totalPLRCount = sum;
    } else {
      // If no decrement, just take the last value
      totalPLRCount = lastValue;
    }

    // Check if the first tick element matches the first Prometheus value
    const firstTickValue = tickValues[0];
    const firstPrometheusValue = values[0];
    const isMatch = isMatchingFirstTickValue(
      firstTickValue,
      firstPrometheusValue[0],
      type,
    );
    if (isMatch) {
      totalPLRCount -= parseInt(firstPrometheusValue[1], 10);
    }
  }

  return totalPLRCount;
};

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  let formatted = '';
  if (hours > 0) {
    formatted += `${hours}h `;
  }
  if (minutes > 0 || hours > 0) {
    formatted += `${minutes}m `;
  }
  formatted += `${remainingSeconds}s`;

  return formatted.trim();
};

export const getTotalPipelineRunsDuration = (
  prometheusResult: PrometheusResponse,
  tickValues: number[] | Date[],
  type: string,
): [string, number] => {
  let totalPLRDuration = 0;

  if (prometheusResult?.data?.result[0]?.values) {
    const values = prometheusResult.data.result[0].values;

    // Calculate total duration and check for decrements
    let lastValue = parseFloat(values[0][1]);
    let hasDecrement = false;
    let sum = 0;

    for (let i = 1; i < values.length; i++) {
      const currentValue = parseFloat(values[i][1]);
      if (currentValue < lastValue) {
        hasDecrement = true;
        sum += lastValue;
      }
      lastValue = currentValue;
    }

    // If there's any decrement, add the last value to the sum
    if (hasDecrement) {
      sum += lastValue;
      totalPLRDuration = sum;
    } else {
      // If no decrement, just take the last value
      totalPLRDuration = lastValue;
    }

    // Adjust total duration if the first tick element matches the first Prometheus value
    const firstTickValue = tickValues[0];
    const firstPrometheusValue = values[0];
    const isMatch = isMatchingFirstTickValue(
      firstTickValue,
      firstPrometheusValue[0],
      type,
    );
    if (isMatch) {
      totalPLRDuration -= parseFloat(firstPrometheusValue[1]);
    }
  }

  return [formatDuration(totalPLRDuration), totalPLRDuration];
};

export const getPipelineRunAverageDuration = (
  totalDuration: number,
  totalPLRRuns: number,
): string => {
  if (totalPLRRuns === 0) return '-';

  const averageDuration = totalDuration / totalPLRRuns;
  return formatDuration(averageDuration);
};

export const roundToNearestSecond = (timestamp) => {
  return Math.round(timestamp);
};
