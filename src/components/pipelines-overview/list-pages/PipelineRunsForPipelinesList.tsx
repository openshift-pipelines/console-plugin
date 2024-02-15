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
import { ClusterVersionModel } from '../../../models';
import { ClusterVersionKind } from '../../../types';
import { useK8sGet } from '../../hooks/use-k8sGet-hook';

type PipelineRunsForPipelinesListProps = {
  summaryData: SummaryProps[];
  summaryDataFiltered?: SummaryProps[];
  loaded: boolean;
};

export const getClusterVersion = (cv: ClusterVersionKind): string => {
  return cv?.status?.history?.[0]?.version || cv?.spec?.desiredUpdate?.version;
};

const PipelineRunsForPipelinesList: React.FC<
  PipelineRunsForPipelinesListProps
> = ({ summaryData, summaryDataFiltered, loaded }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [clusterVersionData, clusterVersionLoaded] =
    useK8sGet<ClusterVersionKind>(ClusterVersionModel, 'version');
  const clusterVersion =
    clusterVersionLoaded && getClusterVersion(clusterVersionData);
  const EmptyMsg = () => (
    <EmptyState variant={EmptyStateVariant.large}>
      {t('No PipelineRuns found')}
    </EmptyState>
  );

  const plrColumns = React.useMemo<TableColumn<SummaryProps>[]>(
    () => [
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
        props: { className: tableColumnClasses[4] },
      },
      {
        id: 'successRate',
        title: t('Success rate'),
        sort: (summary, direction: 'asc' | 'desc') =>
          sortByNumbers(summary, 'succeeded', direction),
        transforms: [sortable],
        props: { className: tableColumnClasses[5] },
      },
      {
        id: 'lastRunTime',
        title: t('Last run time'),
        sort: (summary, direction: 'asc' | 'desc') =>
          sortByTimestamp(summary, 'last_runtime', direction),
        transforms: [sortable],
        props: { className: tableColumnClasses[6] },
      },
    ],
    [t],
  );

  const [columns] = useActiveColumns({
    columns: plrColumns,
    showNamespaceOverride: false,
    columnManagementID: '',
  });

  return (
    <VirtualizedTable
      columns={columns}
      Row={PipelineRunsForPipelinesRow}
      data={summaryDataFiltered || summaryData}
      loaded={loaded}
      loadError={false}
      unfilteredData={summaryData}
      EmptyMsg={EmptyMsg}
      rowData={{ clusterVersion }}
    />
  );
};

export default PipelineRunsForPipelinesList;
