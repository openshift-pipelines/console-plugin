import type { FC } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useActiveNamespace } from '@openshift-console/dynamic-plugin-sdk';
import { ConsoleDataView } from '@openshift-console/dynamic-plugin-sdk-internal';
import {
  SummaryProps,
  sortByNumbers,
  sortByProperty,
  sortByTimestamp,
  sortTimeStrings,
} from '../utils';
import {
  getPipelineRunsForRepositoriesDataViewRows,
  tableColumnInfo,
} from './PipelineRunsForRepositoriesRow';
import { ALL_NAMESPACES_KEY } from '../../../consts';

type PipelineRunsForRepositoriesListProps = {
  summaryData: SummaryProps[];
  summaryDataFiltered: SummaryProps[];
  loaded: boolean;
};

const PipelineRunsForRepositoriesList: FC<
  PipelineRunsForRepositoriesListProps
> = ({ summaryData, summaryDataFiltered, loaded }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [activeNamespace] = useActiveNamespace();

  const columns = useMemo(
    () => [
      {
        id: tableColumnInfo[0].id,
        title: t('Repository'),
        sort: (summary, direction: 'asc' | 'desc') =>
          sortByProperty(summary, 'repoName', direction),
        props: {
          modifier: 'nowrap',
          isStickyColumn: true,
          hasRightBorder: true,
          stickyMinWidth: '0',
        },
      },
      ...(activeNamespace === ALL_NAMESPACES_KEY
        ? [
            {
              id: tableColumnInfo[1].id,
              title: t('Project'),
              sort: (summary, direction: 'asc' | 'desc') =>
                sortByProperty(summary, 'namespace', direction),
              props: { modifier: 'nowrap' },
            },
          ]
        : []),
      {
        id: tableColumnInfo[2].id,
        title: t('Total Pipelineruns'),
        sort: 'total',
        props: { modifier: 'nowrap' },
      },
      {
        id: tableColumnInfo[3].id,
        title: t('Total duration'),
        sort: (summary, direction: 'asc' | 'desc') =>
          sortTimeStrings(summary, 'total_duration', direction),
        props: { modifier: 'nowrap' },
      },
      {
        id: tableColumnInfo[4].id,
        title: t('Average duration'),
        sort: (summary, direction: 'asc' | 'desc') =>
          sortTimeStrings(summary, 'avg_duration', direction),
        props: {
          modifier: 'nowrap',
          info: {
            tooltip: t(
              'An average of the time taken to run PipelineRuns. The trending shown is based on the time range selected. This metric does not show runs that are running or pending.',
            ),
            className: 'pipeline-overview__for-pipelines-list__tooltip',
          },
        },
      },
      {
        id: tableColumnInfo[5].id,
        title: t('Success rate'),
        sort: (summary, direction: 'asc' | 'desc') =>
          sortByNumbers(summary, 'succeeded', direction),
        props: {
          modifier: 'nowrap',
          info: {
            tooltip: t(
              'Success rate measure the % of successfully completed pipeline runs in relation to the total number of pipeline runs',
            ),
            className: 'pipeline-overview__for-pipelines-list__tooltip',
          },
        },
      },
      {
        id: tableColumnInfo[6].id,
        title: t('Last run time'),
        sort: (summary, direction: 'asc' | 'desc') =>
          sortByTimestamp(summary, 'last_runtime', direction),
        props: { modifier: 'nowrap' },
      },
    ],
    [t, activeNamespace],
  );

  return (
    <ConsoleDataView<SummaryProps>
      label={t('PipelineRuns')}
      columns={columns}
      data={summaryDataFiltered || summaryData}
      loaded={loaded}
      loadError={false}
      getDataViewRows={getPipelineRunsForRepositoriesDataViewRows}
      hideColumnManagement
      hideNameLabelFilters
    />
  );
};

export default PipelineRunsForRepositoriesList;
