import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState, EmptyStateVariant } from '@patternfly/react-core';
import { sortable } from '@patternfly/react-table';
import {
  TableColumn,
  VirtualizedTable,
  useActiveColumns,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  SummaryProps,
  sortByNumbers,
  sortByProperty,
  sortByTimestamp,
  sortTimeStrings,
  listPageTableColumnClasses as tableColumnClasses,
} from '../utils';
import PipelineRunsForPipelinesRow from './PipelineRunsForPipelinesRow';

type PipelineRunsForPipelinesListProps = {
  summaryData: SummaryProps[];
  summaryDataFiltered?: SummaryProps[];
  loaded: boolean;
  hideLastRunTime?: boolean;
};

const PipelineRunsForPipelinesList: React.FC<
  PipelineRunsForPipelinesListProps
> = ({ summaryData, summaryDataFiltered, loaded, hideLastRunTime }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const EmptyMsg = () => (
    <EmptyState variant={EmptyStateVariant.lg}>
      {t('No PipelineRuns found')}
    </EmptyState>
  );

  const plrColumns = React.useMemo<TableColumn<SummaryProps>[]>(() => {
    const columns: TableColumn<SummaryProps>[] = [
      {
        id: 'pipelineName',
        title: t('Pipeline'),
        sort: (summary, direction: 'asc' | 'desc') =>
          sortByProperty(summary, 'pipelineName', direction),
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        id: 'namespace',
        title: t('Project'),
        sort: (summary, direction: 'asc' | 'desc') =>
          sortByProperty(summary, 'namespace', direction),
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
      },
      {
        id: 'total',
        title: t('Total Pipelineruns'),
        sort: 'total',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        id: 'totalDuration',
        title: t('Total duration'),
        sort: (summary, direction: 'asc' | 'desc') =>
          sortTimeStrings(summary, 'total_duration', direction),
        transforms: [sortable],
        props: { className: tableColumnClasses[3] },
      },
      {
        id: 'avgDuration',
        title: t('Average duration'),
        sort: (summary, direction: 'asc' | 'desc') =>
          sortTimeStrings(summary, 'avg_duration', direction),
        transforms: [sortable],
        props: {
          className: tableColumnClasses[4],
          info: {
            tooltip: t(
              'An average of the time taken to run PipelineRuns. The trending shown is based on the time range selected. This metric does not show runs that are running or pending.',
            ),
            className: 'pipeline-overview__for-pipelines-list__tooltip',
          },
        },
      },
      {
        id: 'successRate',
        title: t('Success rate'),
        sort: (summary, direction: 'asc' | 'desc') =>
          sortByNumbers(summary, 'succeeded', direction),
        transforms: [sortable],
        props: {
          className: tableColumnClasses[5],
          info: {
            tooltip: t(
              'Success rate measure the % of successfully completed pipeline runs in relation to the total number of pipeline runs',
            ),
            className: 'pipeline-overview__for-pipelines-list__tooltip',
          },
        },
      },
    ];
    if (!hideLastRunTime) {
      columns.push({
        id: 'lastRunTime',
        title: t('Last run time'),
        sort: (summary, direction: 'asc' | 'desc') =>
          sortByTimestamp(summary, 'last_runtime', direction),
        transforms: [sortable],
        props: { className: tableColumnClasses[6] },
      });
    }

    return columns;
  }, [t, hideLastRunTime]);

  const [columns] = useActiveColumns({
    columns: plrColumns,
    showNamespaceOverride: false,
    columnManagementID: '',
  });

  const isEmptyData =
    (!summaryDataFiltered || summaryDataFiltered.length === 0) &&
    (!summaryData || summaryData.length === 0);

  if (isEmptyData) {
    return <EmptyMsg />;
  }

  return (
    <VirtualizedTable
      columns={columns}
      Row={PipelineRunsForPipelinesRow}
      data={summaryDataFiltered || summaryData}
      loaded={loaded}
      loadError={false}
      unfilteredData={summaryData}
      EmptyMsg={EmptyMsg}
      rowData={{ hideLastRunTime }}
    />
  );
};

export default PipelineRunsForPipelinesList;
