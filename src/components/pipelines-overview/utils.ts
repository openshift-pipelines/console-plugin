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
  'avg-duration'?: string;
  success?: number;
  failed?: number;
  pending?: number;
  running?: number;
  cancelled?: number;
  'max-duration'?: string;
  'total-duration'?: string;
  'runs-in-pipelines'?: number;
  'runs-in-repositories'?: number;
  'last-runtime'?: string;
  'success-rate'?: number;
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
