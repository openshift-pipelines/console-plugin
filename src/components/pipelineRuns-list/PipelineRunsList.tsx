import * as React from 'react';
import { SortByDirection } from '@patternfly/react-table';
import {
  ListPageBody,
  ListPageFilter,
  VirtualizedTable,
  useListPageFilter,
} from '@openshift-console/dynamic-plugin-sdk';
import usePipelineRunsColumns from './usePipelineRunsColumns';
import { usePipelineRunsFilters } from './usePipelineRunsFilters';
import { PipelineRunKind } from '../../types';
import { useGetPipelineRuns } from '../hooks/useTektonResult';
import PipelineRunsRow from './PipelineRunsRow';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';

import './PipelineRunsList.scss';

type PipelineRunsListProps = {
  namespace?: string;
  hideTextFilter?: boolean;
  repositoryPLRs?: boolean;
  PLRsForName?: string;
  PLRsForKind?: string;
};

const PipelineRunsList: React.FC<PipelineRunsListProps> = ({
  namespace,
  hideTextFilter,
  repositoryPLRs,
  PLRsForName,
  PLRsForKind,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);
  const { ns } = useParams();
  namespace = namespace || ns;
  const columns = usePipelineRunsColumns(namespace, repositoryPLRs);
  const filters = usePipelineRunsFilters();
  const sortColumnIndex = repositoryPLRs
    ? !namespace
      ? 6
      : 5
    : !namespace
    ? 5
    : 4;

  const [
    pipelineRuns,
    pipelineRunsLoaded,
    pipelineRunsLoadError,
    nextPageToken,
  ] = useGetPipelineRuns(namespace, { name: PLRsForName, kind: PLRsForKind });
  const [data, filteredData, onFilterChange] = useListPageFilter(
    pipelineRuns,
    filters,
  );

  // Once OCPBUGS-43538 ticket is closed, use onRowsRendered prop in VirtualizedTable for load more on scroll
  React.useEffect(() => {
    if (!loadMoreRef.current || !pipelineRunsLoaded) return;

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && nextPageToken) {
        nextPageToken();
      }
    });

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [nextPageToken, pipelineRunsLoaded]);

  return (
    <ListPageBody>
      <ListPageFilter
        columnLayout={{
          columns: columns?.map(({ id, title }) => ({ id, title })),
          id: 'pipelineRuns-list',
          type: 'PipelineRun',
          selectedColumns: new Set(['name']),
        }}
        rowFilters={filters}
        onFilterChange={onFilterChange}
        data={data}
        loaded={pipelineRunsLoaded}
        hideColumnManagement
        hideNameLabelFilters={hideTextFilter}
      />
      <VirtualizedTable<PipelineRunKind>
        key={sortColumnIndex}
        EmptyMsg={() => (
          <div
            className="pf-u-text-align-center virtualized-table-empty-msg"
            id="no-templates-msg"
          >
            {t('No PipelineRuns found')}
          </div>
        )}
        columns={columns}
        data={filteredData}
        loaded={pipelineRunsLoaded}
        loadError={pipelineRunsLoadError}
        Row={PipelineRunsRow}
        unfilteredData={data}
        rowData={{
          repositoryPLRs,
        }}
        sortColumnIndex={sortColumnIndex}
        sortDirection={SortByDirection.desc}
      />
      <div ref={loadMoreRef}></div>
    </ListPageBody>
  );
};

export default PipelineRunsList;
