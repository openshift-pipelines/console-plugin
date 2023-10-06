import * as React from 'react';
import { EmptyState, EmptyStateVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { sortable } from '@patternfly/react-table';
import PipelineRunsForRepositoriesRow from './PipelineRunsForRepositoriesRow';
import { mainDataType } from '../utils';
import { TableColumn, VirtualizedTable } from '@openshift-console/dynamic-plugin-sdk';

type PipelineRunsForRepositoriesListProps = {
  mainData?: mainDataType[];
};

const PipelineRunsForRepositoriesList: React.FC<PipelineRunsForRepositoriesListProps> = ({
  mainData,
}) => {
  const { t } = useTranslation('plugin__pipeline-console-plugin');
  const EmptyMsg = () => (
    <EmptyState variant={EmptyStateVariant.large}>
      {t('No PipelineRuns found')}
    </EmptyState>
  );
  const tableColumnClasses = ['', '', '', '', '', '', ''];

  const columns = React.useMemo<TableColumn<mainDataType>[]>(
    () => [
      {
        id: 'repoName',
        title: t('Repository'),
        sort: 'repoName',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        id: 'projectName',
        title: t('Project'),
        sort: 'projectName',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
      },
      {
        id: 'totalPipelineruns',
        title: t('Total Pipelineruns'),
        sort: 'summary.total',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        id: 'totalDuration',
        title: t('Total duration'),
        sort: "summary['total-duration']",
        transforms: [sortable],
        props: { className: tableColumnClasses[3] },
      },
      {
        id: 'avgDuration',
        title: t('Average duration'),
        sort: "summary['avg-duration']",
        transforms: [sortable],
        props: { className: tableColumnClasses[4] },
      },
      {
        id: 'successRate',
        title: t('Success rate'),
        sort: "summary['success-rate']",
        transforms: [sortable],
        props: { className: tableColumnClasses[5] },
      },
      {
        id: 'lastRunTime',
        title: t('Last run time'),
        sort: "summary['last-runtime']",
        transforms: [sortable],
        props: { className: tableColumnClasses[6] },
      },
    ],
    [t],
  );

  return (
    <VirtualizedTable
      columns={columns}
      Row={PipelineRunsForRepositoriesRow}
      data={mainData}
      loaded={true}
      loadError={false}
      unfilteredData={mainData}
      EmptyMsg={EmptyMsg}
    />
  );
};

export default PipelineRunsForRepositoriesList;
