import type { FC } from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { ListPageBody } from '@openshift-console/dynamic-plugin-sdk';
import usePipelineRunsColumns from './usePipelineRunsColumns';
import { PipelineRunKind } from '../../types';
import { useGetPipelineRuns } from '../hooks/useTektonResult';
import { getPipelineRunsListDataViewRows } from './PipelineRunsRow';
import { useGetActiveUser } from '../hooks/hooks';
import { ConsoleDataView } from '@openshift-console/dynamic-plugin-sdk-internal';
import { useTranslation } from 'react-i18next';
import { useDataViewFilter } from '../hooks/useDataViewFilter';
import { DataViewFilterToolbar } from '../common/DataViewFilterToolbar';
import { useDateRangeFilter } from '../hooks/useDateRangeFilter';
import {
  formatPrometheusDuration,
  parsePrometheusDuration,
} from '../pipelines-overview/dateTime';
import {
  TimeRangeOptions,
  TimeRangeOptionsK8s,
} from '../pipelines-overview/utils';

import './PipelineRunsList.scss';

type PipelineRunsListProps = {
  namespace?: string;
  hideTextFilter?: boolean;
  repositoryPLRs?: boolean;
  PLRsForName?: string;
  PLRsForKind?: string;
};

const PipelineRunsList: FC<PipelineRunsListProps> = ({
  namespace,
  hideTextFilter,
  repositoryPLRs,
  PLRsForName,
  PLRsForKind,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const { ns } = useParams();
  const currentUser = useGetActiveUser();
  namespace = namespace || ns;
  const columns = usePipelineRunsColumns(namespace, repositoryPLRs);

  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (!searchParams.has('sortBy')) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('sortBy', t('Started'));
        next.set('orderBy', 'desc');
        return next;
      });
    }
  }, []);

  const {
    dateFilterCEL,
    startDate,
    timespan,
    setTimespan,
    isTektonResultEnabled,
    preferenceLoaded,
  } = useDateRangeFilter();

  const [pipelineRuns, k8sLoaded, trLoaded, pipelineRunsLoadError] =
    useGetPipelineRuns(namespace, {
      name: PLRsForName,
      kind: PLRsForKind,
      filter: dateFilterCEL,
    });

  const dateFilteredRuns = useMemo(() => {
    if (!timespan || !startDate || !pipelineRuns) return pipelineRuns;
    return pipelineRuns.filter((plr) => {
      const st = plr.status?.startTime;
      if (!st) return true;
      return new Date(st).getTime() > startDate;
    });
  }, [pipelineRuns, timespan, startDate]);

  const {
    filterValues: baseFilterValues,
    onFilterChange: baseOnFilterChange,
    onClearAll: baseOnClearAll,
    filteredData,
    updatedCheckboxFilters,
  } = useDataViewFilter<PipelineRunKind>({
    data: dateFilteredRuns || [],
    options: {
      resourceType: 'PipelineRun',
      defaultDataSourceValues: ['cluster-data'],
    },
  });

  const currentKey = formatPrometheusDuration(timespan);
  const timeRangeOptions = isTektonResultEnabled
    ? TimeRangeOptions()
    : TimeRangeOptionsK8s();

  const filterValues = { ...baseFilterValues, timeRange: [currentKey] };

  const checkboxFilters = useMemo(
    () => [
      ...updatedCheckboxFilters,
      {
        id: 'timeRange',
        title: t('Time Range'),
        singleSelect: true,
        defaultValues: [currentKey],
        options: Object.entries(timeRangeOptions).map(([key, label]) => ({
          value: key,
          label,
          count: 0,
        })),
      },
    ],
    [updatedCheckboxFilters, t, currentKey, timeRangeOptions],
  );

  const onFilterChange = useCallback(
    (key: string, value: string | string[]) => {
      if (key === 'timeRange') {
        setTimespan(
          parsePrometheusDuration((value as string[])[0] || '1d'),
        );
        return;
      }
      baseOnFilterChange(key, value);
    },
    [baseOnFilterChange, setTimespan],
  );

  const onClearAll = useCallback(() => {
    baseOnClearAll();
    setTimespan(parsePrometheusDuration('1d'));
  }, [baseOnClearAll, setTimespan]);

  const loaded = useMemo(() => {
    if (!preferenceLoaded) return false;
    const selectedSources = baseFilterValues?.dataSource as
      | string[]
      | undefined;
    const bothOrNone =
      !selectedSources?.length ||
      (selectedSources.includes('cluster-data') &&
        selectedSources.includes('archived-data'));
    if (bothOrNone) return k8sLoaded && trLoaded;
    if (selectedSources.includes('cluster-data')) return k8sLoaded;
    return trLoaded;
  }, [preferenceLoaded, k8sLoaded, trLoaded, baseFilterValues?.dataSource]);

  return (
    <ListPageBody>
      {!hideTextFilter && preferenceLoaded && (
        <DataViewFilterToolbar
          filterValues={filterValues}
          onFilterChange={onFilterChange}
          onClearAll={onClearAll}
          checkboxFilters={checkboxFilters}
        />
      )}
      <ConsoleDataView<PipelineRunKind>
        label={t('PipelineRuns')}
        columns={columns}
        data={filteredData}
        loaded={loaded}
        loadError={pipelineRunsLoadError}
        getDataViewRows={getPipelineRunsListDataViewRows}
        customRowData={{
          repositoryPLRs,
          currentUser,
        }}
        hideColumnManagement
        hideNameLabelFilters
      />
      <div ref={loadMoreRef}></div>
    </ListPageBody>
  );
};

export default PipelineRunsList;
