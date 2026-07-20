import type { FC } from 'react';
import { useMemo, useRef, useEffect } from 'react';
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

import './PipelineRunsList.scss';
import { isChildPipelineRun } from '../utils/pipeline-utils';

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

  const { dateFilterCEL } = useDateRangeFilter('PipelineRun');

  const [pipelineRuns, k8sLoaded, trLoaded, pipelineRunsLoadError] =
    useGetPipelineRuns(namespace, {
      name: PLRsForName,
      kind: PLRsForKind,
      dateRangeFilter: dateFilterCEL,
    });

  const {
    filterValues,
    onFilterChange,
    onClearAll,
    filteredData,
    updatedCheckboxFilters,
  } = useDataViewFilter<PipelineRunKind>({
    data: (pipelineRuns || []).filter((r) => !isChildPipelineRun(r)),
    options: {
      resourceType: 'PipelineRun',
    },
  });

  const loaded = useMemo(() => {
    const selectedSources = filterValues?.dataSource as string[] | undefined;
    const bothOrNone =
      !selectedSources?.length ||
      (selectedSources.includes('cluster-data') &&
        selectedSources.includes('archived-data'));
    if (bothOrNone) return k8sLoaded && trLoaded;
    if (selectedSources.includes('cluster-data')) return k8sLoaded;
    return trLoaded;
  }, [k8sLoaded, trLoaded, filterValues?.dataSource]);

  return (
    <ListPageBody>
      {!hideTextFilter && (
        <DataViewFilterToolbar
          filterValues={filterValues}
          onFilterChange={onFilterChange}
          onClearAll={onClearAll}
          checkboxFilters={updatedCheckboxFilters}
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
