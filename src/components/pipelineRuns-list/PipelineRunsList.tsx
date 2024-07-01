import * as React from 'react';
import {
  ListPageBody,
  ListPageFilter,
  VirtualizedTable,
  useFlag,
  useListPageFilter,
} from '@openshift-console/dynamic-plugin-sdk';
import { usePipelineRunsForPipelineOrRepository } from '@aonic-ui/pipelines';
import usePipelineRunsColumns from './usePipelineRunsColumns';
import { usePipelineRunsFilters } from './usePipelineRunsFilters';
import { PipelineRunKind } from '../../types';
import PipelineRunsRow from './PipelineRunsRow';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { FLAG_PIPELINE_TEKTON_RESULT_INSTALLED } from '../../consts';
import { aonicFetchUtils } from '../utils/common-utils';
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
  const { ns } = useParams();
  namespace = namespace || ns;
  const columns = usePipelineRunsColumns(namespace, repositoryPLRs);
  const filters = usePipelineRunsFilters();
  const isTektonResultEnabled = useFlag(FLAG_PIPELINE_TEKTON_RESULT_INSTALLED);

  const [pipelineRuns, pipelineRunsLoaded, pipelineRunsLoadError] =
    usePipelineRunsForPipelineOrRepository(
      aonicFetchUtils,
      namespace,
      undefined,
      isTektonResultEnabled,
      { name: PLRsForName, kind: PLRsForKind },
    );
  const [data, filteredData, onFilterChange] = useListPageFilter(
    pipelineRuns,
    filters,
  );
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
        unfilteredData={data}
        rowData={{
          repositoryPLRs,
        }}
      />
    </ListPageBody>
  );
};

export default PipelineRunsList;
