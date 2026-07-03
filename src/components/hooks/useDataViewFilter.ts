import {
  K8sResourceCommon,
  useFlag,
} from '@openshift-console/dynamic-plugin-sdk';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { FLAG_PIPELINE_TEKTON_RESULT_INSTALLED } from '../../consts';
import { ApprovalStatus } from '../../types';
import {
  pipelineApprovalFilter,
  pipelineApprovalFilterReducer,
} from '../approval-tasks/ApprovalTasksList';
import type {
  CheckboxFilterConfig,
  FilterValues,
} from '../common/DataViewFilterToolbar';
import { formatPrometheusDuration } from '../pipelines-overview/dateTime';
import { TimeRangeOptions } from '../pipelines-overview/utils';
import { getApprovalStatusInfo } from '../utils/pipeline-approval-utils';
import {
  isPipelineRunLoadedFromTektonResults,
  pipelineFilterReducer,
  pipelineRunDataSourceFilter,
  pipelineRunFilterReducer,
  pipelineRunStatusFilter,
  pipelineStatusFilter,
} from '../utils/pipeline-filter-reducer';
import { ListFilterId, ListFilterLabels } from '../utils/pipeline-utils';
import { useDatasourcePreference } from './useDatasourcePreference';
import {
  NO_DATE_RANGE_FILTER,
  parseDurationForDateRangeFiltering,
  useDateRangeFilter,
} from './useDateRangeFilter';

export type ResourceType =
  | 'Pipeline'
  | 'PipelineRun'
  | 'TaskRun'
  | 'ApprovalTask';

const SINGLE_SELECT_NO_COUNT = 0;

export interface DataViewFilterOptions<T extends K8sResourceCommon> {
  getName?: (obj: T) => string;
  getLabels?: (obj: T) => Record<string, string> | undefined;
  resourceType?: ResourceType;
  defaultStatusValues?: string[];
  defaultDataSourceValues?: string[];
  customData?: K8sResourceCommon[] | undefined;
}

export interface UseDataViewFilterParams<T extends K8sResourceCommon> {
  data: T[];
  options?: DataViewFilterOptions<T>;
}

const matchesLabels = (
  objLabels: Record<string, string> | undefined,
  labelFilters: string[],
): boolean => {
  if (!labelFilters.length) return true;
  if (!objLabels) return false;
  return labelFilters.every((filter) => {
    const [key, val] = filter.split('=');
    if (val !== undefined) {
      return objLabels[key] === val;
    }
    return key in objLabels;
  });
};

interface ResourceFilterConfig {
  statusOptions: ListFilterId[] | ApprovalStatus[];
  statusFilter: (phases: any, obj: any, customData?: any) => boolean;
  statusReducer: (obj: any, customData?: any) => string;
  hasDataSourceFilter: boolean;
  hasDateRangeFilter: boolean;
  defaultStatusValues?: string[];
  defaultDataSourceValues?: string[];
  getOptionLabel: (id: any) => string;
}

const RESOURCE_FILTER_CONFIG: Record<ResourceType, ResourceFilterConfig> = {
  Pipeline: {
    statusOptions: [
      ListFilterId.Succeeded,
      ListFilterId.Running,
      ListFilterId.Failed,
      ListFilterId.Cancelled,
      ListFilterId.Other,
    ],
    statusFilter: pipelineStatusFilter,
    statusReducer: pipelineFilterReducer,
    hasDataSourceFilter: false,
    hasDateRangeFilter: false,
    getOptionLabel: (id) => ListFilterLabels[id],
  },
  PipelineRun: {
    statusOptions: [
      ListFilterId.Succeeded,
      ListFilterId.Running,
      ListFilterId.Failed,
      ListFilterId.Cancelled,
      ListFilterId.Other,
    ],
    statusFilter: pipelineRunStatusFilter,
    statusReducer: pipelineRunFilterReducer,
    hasDataSourceFilter: true,
    hasDateRangeFilter: true,
    defaultDataSourceValues: ['cluster-data'],
    getOptionLabel: (id) => ListFilterLabels[id],
  },
  TaskRun: {
    statusOptions: [
      ListFilterId.Succeeded,
      ListFilterId.Running,
      ListFilterId.Failed,
      ListFilterId.Cancelled,
    ],
    statusFilter: pipelineRunStatusFilter,
    statusReducer: pipelineRunFilterReducer,
    hasDataSourceFilter: true,
    hasDateRangeFilter: false,
    defaultDataSourceValues: ['cluster-data'],
    getOptionLabel: (id) => ListFilterLabels[id],
  },
  ApprovalTask: {
    statusOptions: [
      ApprovalStatus.Accepted,
      ApprovalStatus.Rejected,
      ApprovalStatus.RequestSent,
      ApprovalStatus.TimedOut,
    ],
    statusFilter: pipelineApprovalFilter,
    statusReducer: pipelineApprovalFilterReducer,
    hasDataSourceFilter: false,
    hasDateRangeFilter: false,
    getOptionLabel: (id) => getApprovalStatusInfo(id).message,
  },
};

const defaultGetName = <T extends K8sResourceCommon>(obj: T): string =>
  obj.metadata?.name || '';

const defaultGetLabels = <T extends K8sResourceCommon>(
  obj: T,
): Record<string, string> | undefined => obj.metadata?.labels;

export const useDataViewFilter = <T extends K8sResourceCommon>({
  data,
  options,
}: UseDataViewFilterParams<T>) => {
  const {
    getName = defaultGetName,
    getLabels = defaultGetLabels,
    resourceType,
    defaultStatusValues,
    customData,
  } = options ?? {};
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const isTektonResultEnabled = useFlag(FLAG_PIPELINE_TEKTON_RESULT_INSTALLED);

  const config = resourceType
    ? RESOURCE_FILTER_CONFIG[resourceType]
    : undefined;

  // true only for resource types with a datasource filter (PipelineRun, TaskRun)
  const shouldPersistDataSource = !!config?.hasDataSourceFilter;

  const {
    preference: datasourcePreference,
    setPreference: setDatasourcePreference,
    resetPreference: resetDatasourcePreference,
  } = useDatasourcePreference(resourceType, shouldPersistDataSource);
  const allStatusIds = useMemo(() => Object.values(ListFilterId), []);

  // true only for resource types with a date range filter (PipelinRun, TaskRun)
  const shouldPersistDateRangeFilter = !!config?.hasDateRangeFilter;

  const {
    startDate,
    timespan,
    setTimespanDateFilter,
    dateFilterCEL,
    preferenceLoaded,
  } = useDateRangeFilter(resourceType, shouldPersistDateRangeFilter);

  const timeRangeOptions = TimeRangeOptions();
  const currentKey = timespan ? formatPrometheusDuration(timespan) : '';

  const checkboxFilters = useMemo<CheckboxFilterConfig[]>(() => {
    if (!resourceType) return [];
    const config = RESOURCE_FILTER_CONFIG[resourceType];
    if (!config?.statusOptions?.length) return [];
    const filters: CheckboxFilterConfig[] = [
      {
        id: 'status',
        title: t('Status'),
        placeholder: t('Filter by status'),
        defaultValues: defaultStatusValues ?? config.defaultStatusValues,
        options: config.statusOptions.map((id) => ({
          value: id,
          label: config.getOptionLabel(id),
          count: 0,
        })),
      },
    ];
    if (config.hasDataSourceFilter && isTektonResultEnabled) {
      filters.push({
        id: 'dataSource',
        title: t('Data source'),
        placeholder: t('Filter by data source'),
        defaultValues: datasourcePreference,
        options: [
          { value: 'cluster-data', label: t('Cluster'), count: 0 },
          { value: 'archived-data', label: t('Archived'), count: 0 },
        ],
      });
    }
    if (config.hasDateRangeFilter && preferenceLoaded) {
      filters.push({
        id: 'timeRange',
        title: t('Time Range'),
        placeholder: t('Filter by time range'),
        singleSelect: true,
        defaultValues: [],
        options: Object.entries(timeRangeOptions).map(([key, label]) => ({
          value: key,
          label,
          count: SINGLE_SELECT_NO_COUNT,
        })),
      });
    }
    return filters;
  }, [
    resourceType,
    isTektonResultEnabled,
    t,
    defaultStatusValues,
    datasourcePreference,
    preferenceLoaded,
    timeRangeOptions,
  ]);

  const matchesCheckboxFilter = useCallback(
    (obj: T, filterId: string, selectedValues: string[]) => {
      if (filterId === 'status' && config) {
        return config.statusFilter(
          { selected: selectedValues, all: allStatusIds },
          obj,
          customData,
        );
      }
      if (filterId === 'dataSource') {
        return pipelineRunDataSourceFilter({ selected: selectedValues }, obj);
      }
      return true;
    },
    [allStatusIds, config, customData],
  );

  const getCheckboxFilterValue = useCallback(
    (obj: T, filterId: string): string | undefined => {
      if (filterId === 'status' && config)
        return config.statusReducer(obj, customData);
      if (filterId === 'dataSource') {
        return isPipelineRunLoadedFromTektonResults(obj)
          ? 'archived-data'
          : 'cluster-data';
      }
      return undefined;
    },
    [config, customData],
  );

  const initialValues = useMemo(() => {
    const values: FilterValues = { name: '', labels: [] };
    checkboxFilters.forEach((f) => {
      values[f.id] = f.defaultValues ?? [];
    });
    return values;
  }, [checkboxFilters]);

  const [filterOverrides, setFilterOverrides] = useState<Partial<FilterValues>>(
    {},
  );

  const filterState = useMemo<FilterValues>(
    () => ({ ...initialValues, ...filterOverrides }),
    [initialValues, filterOverrides],
  );
  const [, setSearchParams] = useSearchParams();

  const resetPage = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', '1');
      return next;
    });
  }, [setSearchParams]);

  const onFilterChange = useCallback(
    (key: string, value: string | string[]) => {
      if (key === 'timeRange') {
        setTimespanDateFilter(
          value
            ? parseDurationForDateRangeFiltering(value as string)
            : NO_DATE_RANGE_FILTER,
        );
        resetPage();
        return;
      }
      if (key === 'dataSource') {
        setDatasourcePreference(Array.isArray(value) ? value : [value]);
        resetPage();
        return;
      }
      setFilterOverrides((prev) => ({ ...prev, [key]: value }));
      resetPage();
    },
    [resetPage, setTimespanDateFilter, setDatasourcePreference],
  );

  const onClearAll = useCallback(() => {
    setFilterOverrides({ name: '', labels: [] });
    if (config?.hasDateRangeFilter) {
      setTimespanDateFilter(NO_DATE_RANGE_FILTER);
    }
    if (config?.hasDataSourceFilter) {
      resetDatasourcePreference();
    }
    resetPage();
  }, [resetPage, setTimespanDateFilter, resetDatasourcePreference, config]);

  const labelSuggestions = useMemo(() => {
    if (!data) return [];
    const labelsSet = new Set<string>();
    const getLabelsFn = getLabels ?? defaultGetLabels;
    data.forEach((obj) => {
      const labels = getLabelsFn(obj);
      if (labels) {
        Object.entries(labels).forEach(([key, value]) => {
          labelsSet.add(`${key}=${value}`);
        });
      }
    });
    return Array.from(labelsSet).sort();
  }, [data, getLabels]);

  const filterValues = useMemo<FilterValues>(
    () => ({
      ...filterState,
      labelSuggestions,
      timeRange: currentKey ? [currentKey] : [],
    }),
    [filterState, labelSuggestions, currentKey],
  );

  const passesNameAndLabelFilters = useCallback(
    (obj: T): boolean => {
      const name = getName(obj);
      if (
        filterState.name &&
        !name?.toLowerCase().includes(filterState.name.toLowerCase())
      ) {
        return false;
      }
      const labelFilters = filterState.labels || [];
      if (labelFilters.length > 0 && getLabels) {
        if (!matchesLabels(getLabels(obj), labelFilters)) {
          return false;
        }
      }
      return true;
    },
    [filterState.name, filterState.labels, getName, getLabels],
  );

  const passesCheckboxFilter = useCallback(
    (obj: T, excludeFilterId?: string): boolean => {
      if (!resourceType) return true;
      for (const filter of checkboxFilters) {
        if (filter.id === excludeFilterId) continue;
        const selected = (filterState[filter.id] as string[]) || [];
        if (
          selected.length > 0 &&
          !matchesCheckboxFilter(obj, filter.id, selected)
        ) {
          return false;
        }
      }
      return true;
    },
    [resourceType, checkboxFilters, filterState, matchesCheckboxFilter],
  );

  const passesDateRangeFilter = useCallback(
    (obj: T): boolean => {
      if (!startDate) return true;
      if (isPipelineRunLoadedFromTektonResults(obj)) return true;
      const pipelineRunStartTime = (obj as any).status?.startTime;
      if (!pipelineRunStartTime) return true;
      return new Date(pipelineRunStartTime).getTime() > startDate;
    },
    [startDate],
  );

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter(
      (obj) =>
        passesNameAndLabelFilters(obj) &&
        passesCheckboxFilter(obj) &&
        passesDateRangeFilter(obj),
    );
  }, [
    data,
    passesNameAndLabelFilters,
    passesCheckboxFilter,
    passesDateRangeFilter,
  ]);

  const updatedCheckboxFilters = useMemo(() => {
    if (!resourceType || !data) return checkboxFilters;
    return checkboxFilters.map((filter) => ({
      ...filter,
      options: filter.options.map((opt) => {
        let count = 0;
        data.forEach((obj) => {
          if (
            passesNameAndLabelFilters(obj) &&
            passesCheckboxFilter(obj, filter.id) &&
            getCheckboxFilterValue(obj, filter.id) === opt.value
          ) {
            count++;
          }
        });
        return { ...opt, count };
      }),
    }));
  }, [
    resourceType,
    checkboxFilters,
    data,
    getCheckboxFilterValue,
    passesNameAndLabelFilters,
    passesCheckboxFilter,
  ]);

  return {
    filterValues,
    onFilterChange,
    onClearAll,
    filteredData,
    updatedCheckboxFilters,
    dateFilterCEL,
    preferenceLoaded,
  };
};
