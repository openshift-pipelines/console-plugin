import {
  K8sResourceCommon,
  useFlag,
} from '@openshift-console/dynamic-plugin-sdk';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { FLAG_PIPELINE_TEKTON_RESULT_INSTALLED } from '../../consts';
import type {
  CheckboxFilterConfig,
  FilterValues,
} from '../common/DataViewFilterToolbar';
import {
  isPipelineRunLoadedFromTektonResults,
  pipelineFilterReducer,
  pipelineRunDataSourceFilter,
  pipelineRunFilterReducer,
  pipelineRunStatusFilter,
  pipelineStatusFilter,
} from '../utils/pipeline-filter-reducer';
import { ListFilterId, ListFilterLabels } from '../utils/pipeline-utils';

export type ResourceType = 'Pipeline' | 'PipelineRun' | 'TaskRun';

interface UseDataViewFilterOptions<T extends K8sResourceCommon> {
  data: T[];
  getName?: (obj: T) => string;
  getLabels?: (obj: T) => Record<string, string> | undefined;
  resourceType?: ResourceType;
  defaultStatusValues?: string[];
  defaultDataSourceValues?: string[];
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
  statusOptions: ListFilterId[];
  statusFilter: (phases: any, obj: any) => boolean;
  statusReducer: (obj: any) => string;
  hasDataSourceFilter: boolean;
  defaultStatusValues?: string[];
  defaultDataSourceValues?: string[];
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
    defaultDataSourceValues: ['cluster-data'],
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
    defaultDataSourceValues: ['cluster-data'],
  },
};

const defaultGetName = <T extends K8sResourceCommon>(obj: T): string =>
  obj.metadata?.name || '';

const defaultGetLabels = <T extends K8sResourceCommon>(
  obj: T,
): Record<string, string> | undefined => obj.metadata?.labels;

export const useDataViewFilter = <T extends K8sResourceCommon>({
  data,
  getName = defaultGetName,
  getLabels = defaultGetLabels,
  resourceType,
  defaultStatusValues,
  defaultDataSourceValues,
}: UseDataViewFilterOptions<T>) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const isTektonResultEnabled = useFlag(FLAG_PIPELINE_TEKTON_RESULT_INSTALLED);
  const allStatusIds = useMemo(() => Object.values(ListFilterId), []);
  const resetFilterState = { name: '', labels: [] };

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
          label: ListFilterLabels[id],
          count: 0,
        })),
      },
    ];
    if (config.hasDataSourceFilter && isTektonResultEnabled) {
      filters.push({
        id: 'dataSource',
        title: t('Data source'),
        placeholder: t('Filter by data source'),
        defaultValues:
          defaultDataSourceValues ?? config.defaultDataSourceValues,
        options: [
          { value: 'cluster-data', label: t('Cluster'), count: 0 },
          { value: 'archived-data', label: t('Archived'), count: 0 },
        ],
      });
    }
    return filters;
  }, [
    resourceType,
    isTektonResultEnabled,
    t,
    defaultStatusValues,
    defaultDataSourceValues,
  ]);

  const config = resourceType
    ? RESOURCE_FILTER_CONFIG[resourceType]
    : undefined;

  const matchesCheckboxFilter = useCallback(
    (obj: T, filterId: string, selectedValues: string[]) => {
      if (filterId === 'status' && config) {
        return config.statusFilter(
          { selected: selectedValues, all: allStatusIds },
          obj,
        );
      }
      if (filterId === 'dataSource') {
        return pipelineRunDataSourceFilter({ selected: selectedValues }, obj);
      }
      return true;
    },
    [allStatusIds, config],
  );

  const getCheckboxFilterValue = useCallback(
    (obj: T, filterId: string): string | undefined => {
      if (filterId === 'status' && config) return config.statusReducer(obj);
      if (filterId === 'dataSource') {
        return isPipelineRunLoadedFromTektonResults(obj)
          ? 'archived-data'
          : 'cluster-data';
      }
      return undefined;
    },
    [config],
  );

  const initialValues = useMemo(() => {
    const values: FilterValues = { name: '', labels: [] };
    checkboxFilters.forEach((f) => {
      values[f.id] = f.defaultValues ?? [];
    });
    return values;
  }, [checkboxFilters]);

  const [filterValues, setFilterValues] = useState<FilterValues>(initialValues);
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
      setFilterValues((prev) => ({ ...prev, [key]: value }));
      resetPage();
    },
    [resetPage],
  );

  const onClearAll = useCallback(() => {
    setFilterValues(resetFilterState);
    resetPage();
  }, [resetPage]);

  const passesNameAndLabelFilters = useCallback(
    (obj: T): boolean => {
      const name = getName(obj);
      if (
        filterValues.name &&
        !name?.toLowerCase().includes(filterValues.name.toLowerCase())
      ) {
        return false;
      }
      const labelFilters = filterValues.labels || [];
      if (labelFilters.length > 0 && getLabels) {
        if (!matchesLabels(getLabels(obj), labelFilters)) {
          return false;
        }
      }
      return true;
    },
    [filterValues.name, filterValues.labels, getName, getLabels],
  );

  const passesCheckboxFilter = useCallback(
    (obj: T, excludeFilterId?: string): boolean => {
      if (!resourceType) return true;
      for (const filter of checkboxFilters) {
        if (filter.id === excludeFilterId) continue;
        const selected = (filterValues[filter.id] as string[]) || [];
        if (
          selected.length > 0 &&
          !matchesCheckboxFilter(obj, filter.id, selected)
        ) {
          return false;
        }
      }
      return true;
    },
    [resourceType, checkboxFilters, filterValues, matchesCheckboxFilter],
  );

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter(
      (obj) => passesNameAndLabelFilters(obj) && passesCheckboxFilter(obj),
    );
  }, [data, passesNameAndLabelFilters, passesCheckboxFilter]);

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
  };
};
