import * as React from 'react';
import { useTranslation } from 'react-i18next';

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
  unknown?: number;
  cancelled?: number;
  max_duration?: string;
  min_duration?: string;
  total_duration?: string;
  others?: number;
  group_value?: number;
};

export type mainDataType = {
  repoName?: string;
  projectName?: string;
  pipelineName?: string;
  summary?: SummaryProps;
};

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
