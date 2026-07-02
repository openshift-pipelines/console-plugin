import { useMemo } from 'react';
import {
  useFlag,
  useUserPreference,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  FLAG_PIPELINE_TEKTON_RESULT_INSTALLED,
  USER_PREFERENCE_PREFIX,
} from '../../consts';
import { parsePrometheusDuration } from '../pipelines-overview/dateTime';

export type DateRangeFilterResult = {
  timespan: number;
  setTimespan: (ms: number) => void;
  startDate: number | undefined;
  dateFilterCEL: string;
  isTektonResultEnabled: boolean;
  preferenceLoaded: boolean;
};

type PageType = 'pipelineRun' | 'taskRun';

export const useDateRangeFilter = (
  pageType: PageType,
): DateRangeFilterResult => {
  const isTektonResultEnabled = useFlag(FLAG_PIPELINE_TEKTON_RESULT_INSTALLED);
  const [timespan, setTimespan, preferenceLoaded] = useUserPreference<number>(
    `${USER_PREFERENCE_PREFIX}.dateRangeFilter.${pageType}`,
    parsePrometheusDuration('1d'),
    true,
  );

  const ts = timespan ?? parsePrometheusDuration('1d');

  const startDate = useMemo(() => {
    if (!ts) return undefined;
    return Date.now() - ts;
  }, [ts]);

  const dateFilterCEL = useMemo(() => {
    if (!startDate) return '';
    return `data.status.startTime > timestamp("${new Date(
      startDate,
    ).toISOString()}")`;
  }, [startDate]);

  return {
    timespan: ts,
    setTimespan,
    startDate,
    dateFilterCEL,
    isTektonResultEnabled,
    preferenceLoaded,
  };
};
