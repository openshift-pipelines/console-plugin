import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  K8sGroupVersionKind,
  K8sModel,
  K8sResourceKindReference,
} from '@openshift-console/dynamic-plugin-sdk';

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
  group_value?: any;
  last_runtime?: string;
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
  const { t } = useTranslation('plugin__pipeline-console-plugin');
  return {
    '1d': t('1 day'),
    '3d': t('3 days'),
    '1w': t('1 week'),
    '2w': t('2 weeks'),
    '3w': t('3 weeks'),
    '4w': t('4 weeks'),
  };
};

export const StatusOptions = () => {
  const { t } = useTranslation('plugin__pipeline-console-plugin');
  return {
    Succeeded: t('Succeeded'),
    Failed: t('Failed'),
    Running: t('Running'),
    Pending: t('Pending'),
    Cancelled: t('Cancelled'),
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
  let filter = `data.status.startTime>timestamp("${date}")`;
  if (parentName) {
    if (kind === 'Repository') {
      filter = `data.status.startTime>timestamp("${date}")&&data.metadata.labels['pipelinesascode.tekton.dev/repository']=="${parentName}"`;
    } else {
      filter = `data.status.startTime>timestamp("${date}")&&!data.metadata.labels.contains('pipelinesascode.tekton.dev/repository')&&data.metadata.labels['tekton.dev/pipeline']=="${parentName}"`;
    }
  } else {
    filter = `data.status.startTime>timestamp("${date}")`;
  }
  return filter;
};
