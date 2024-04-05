import {
  ListPageBody,
  ListPageFilter,
  VirtualizedTable,
  useListPageFilter,
} from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';

import { PipelineKind, PipelineRunKind } from '../../types';
import { useGetTaskRuns } from '../hooks/useTektonResult';
import { useTranslation } from 'react-i18next';

import './PipelineRunsList.scss';
import PipelineRunsRow from './PipelineRunsRow';
import usePipelineRunsColumns from './usePipelineRunsColumns';
import { usePipelineRunsFilters } from './usePipelineRunsFilters';
import { usePipelineRuns } from '../hooks/useTaskRuns';

type PipelineRunsListProps = {
  obj: PipelineKind;
};

const PipelineRuns: React.FC<PipelineRunsListProps> = ({ obj }) => {
  const { t } = useTranslation();
  const columns = usePipelineRunsColumns(obj.metadata.namespace);
  const filters = usePipelineRunsFilters();
  const selector = React.useMemo(() => {
    return {
      matchLabels: { 'tekton.dev/pipeline': obj.metadata.name },
    };
  }, [obj.metadata.name]);
  const [pipelineRuns, pipelineRunsLoaded, pipelineRunsLoadError] =
    usePipelineRuns(obj.metadata.namespace, {
      selector,
    });
  const [data, filteredData, onFilterChange] = useListPageFilter(
    pipelineRuns,
    filters,
  );
  const [taskRuns] = useGetTaskRuns(obj.metadata.namespace);
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
        hideColumnManagement={true}
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
        }}
        unfilteredData={data}
      />
    </ListPageBody>
  );
};

export default PipelineRuns;
