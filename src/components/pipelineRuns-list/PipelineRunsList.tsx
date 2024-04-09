import {
  ListPageBody,
  ListPageFilter,
  VirtualizedTable,
  useListPageFilter,
} from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import usePipelineRunsColumns from './usePipelineRunsColumns';
import { usePipelineRunsFilters } from './usePipelineRunsFilters';
import { PipelineRunKind } from '../../types';
import { useGetPipelineRuns, useGetTaskRuns } from '../hooks/useTektonResult';
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
  const { t } = useTranslation();
  const { ns } = useParams();
  namespace = namespace || ns;
  const columns = usePipelineRunsColumns(namespace, repositoryPLRs);
  const filters = usePipelineRunsFilters();

  const [pipelineRuns, pipelineRunsLoaded, pipelineRunsLoadError] =
    useGetPipelineRuns(namespace, { name: PLRsForName, kind: PLRsForKind });
  const [data, filteredData, onFilterChange] = useListPageFilter(
    pipelineRuns,
    filters,
  );
  const [taskRuns, taskRunsLoaded] = useGetTaskRuns(namespace);
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
        rowData={{
          taskRuns,
          taskRunsLoaded,
          repositoryPLRs,
        }}
        unfilteredData={data}
      />
    </ListPageBody>
  );
};

export default PipelineRunsList;
