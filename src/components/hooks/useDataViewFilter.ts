import { useCallback, useMemo, useState } from 'react';
import type {
  CheckboxFilterConfig,
  FilterValues,
} from '../common/DataViewFilterToolbar';

interface UseDataViewFilterOptions<T> {
  data: T[];
  getName: (obj: T) => string;
  getLabels?: (obj: T) => Record<string, string> | undefined;
  checkboxFilters?: CheckboxFilterConfig[];
  matchesCheckboxFilter?: (
    obj: T,
    filterId: string,
    selectedValues: string[],
  ) => boolean;
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

export const useDataViewFilter = <T>({
  data,
  getName,
  getLabels,
  checkboxFilters = [],
  matchesCheckboxFilter,
}: UseDataViewFilterOptions<T>) => {
  const initialValues = useMemo(() => {
    const values: FilterValues = { name: '', labels: [] };
    checkboxFilters.forEach((f) => {
      values[f.id] = [];
    });
    return values;
  }, [checkboxFilters]);

  const [filterValues, setFilterValues] = useState<FilterValues>(initialValues);

  const onFilterChange = useCallback(
    (key: string, value: string | string[]) => {
      setFilterValues((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const onClearAll = useCallback(() => {
    setFilterValues(initialValues);
  }, [initialValues]);

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter((obj) => {
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

      if (matchesCheckboxFilter) {
        for (const filter of checkboxFilters) {
          const selected = (filterValues[filter.id] as string[]) || [];
          if (
            selected.length > 0 &&
            !matchesCheckboxFilter(obj, filter.id, selected)
          ) {
            return false;
          }
        }
      }

      return true;
    });
  }, [
    data,
    filterValues,
    getName,
    getLabels,
    checkboxFilters,
    matchesCheckboxFilter,
  ]);

  return { filterValues, onFilterChange, onClearAll, filteredData };
};
