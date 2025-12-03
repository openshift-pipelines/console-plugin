import * as React from 'react';
import classNames from 'classnames';
import { Card, CardBody, Grid, GridItem } from '@patternfly/react-core';
import {
  PrometheusResponse,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import PipelineRunsForRepositoriesList from './PipelineRunsForRepositoriesList';
import PipelineRunsForPipelinesListK8s from './PipelineRunsForPipelinesListK8s';
import SearchInputField from '../SearchInput';
import { isMatchingFirstTickValue, useQueryParams } from '../utils';
import { ALL_NAMESPACES_KEY } from '../../../consts';
import {
  usePipelineMetricsForAllNamespacePoll,
  usePipelineMetricsForNamespacePoll,
} from '../../pipelines-metrics/hooks';
import {
  MetricsQueryPrefix,
  PipelineQuery,
} from '../../pipelines-metrics/utils';
import { getXaxisValues, secondsToHms } from '../dateTime';
import { Project } from '../../../types';

type PipelineRunsListPageProps = {
  bordered?: boolean;
  namespace: string;
  timespan: number;
  interval: number;
};

const processData = (
  countData: PrometheusResponse,
  durationData: PrometheusResponse,
  tickValues: number[] | Date[],
  type: string,
) => {
  if (!countData?.data?.result || !durationData?.data?.result) {
    return [];
  }
  const firstTickValue = tickValues[0];
  const grouped: {
    [key: string]: {
      group_value: string;
      total: number;
      succeeded: number;
      total_duration: number;
    };
  } = {};

  countData?.data?.result?.forEach((item) => {
    const { namespace, pipeline, status } = item.metric;
    if (pipeline === 'anonymous' || !pipeline) return;

    const key = `${namespace}/${pipeline}`;
    const lastTimestamp = item.values[item.values.length - 1][0];
    const lastValue = parseInt(item.values[item.values.length - 1][1], 10);

    const isMatch = isMatchingFirstTickValue(
      firstTickValue,
      lastTimestamp,
      type,
    );
    if (isMatch) return;

    if (!grouped[key]) {
      grouped[key] = {
        group_value: key,
        total: 0,
        succeeded: 0,
        total_duration: 0,
      };
    }

    grouped[key].total += lastValue;

    if (status === 'success') {
      grouped[key].succeeded += lastValue;
    }
  });

  durationData?.data?.result?.forEach((item) => {
    const { namespace, pipeline } = item.metric;
    if (pipeline === 'anonymous' || !pipeline) return;

    const key = `${namespace}/${pipeline}`;
    const lastTimestamp = item.values[item.values.length - 1][0];
    const lastDuration = parseFloat(item.values[item.values.length - 1][1]);

    const isMatch = isMatchingFirstTickValue(
      firstTickValue,
      lastTimestamp,
      type,
    );
    if (isMatch) return;

    if (!grouped[key]) {
      grouped[key] = {
        group_value: key,
        total: 0,
        succeeded: 0,
        total_duration: 0,
      };
    }

    grouped[key].total_duration += lastDuration;
  });

  return Object.values(grouped).map((group) => {
    const avgDuration =
      group.total > 0 ? group.total_duration / group.total : 0;
    return {
      ...group,
      total_duration: secondsToHms(group.total_duration),
      avg_duration: secondsToHms(avgDuration),
    };
  });
};

const PipelineRunsListPageK8s: React.FC<PipelineRunsListPageProps> = ({
  bordered,
  namespace,
  timespan,
  interval,
}) => {
  const [pageFlag, setPageFlag] = React.useState(1);
  const [searchText, setSearchText] = React.useState('');
  const [tickValues, type] = getXaxisValues(timespan);

  const [projects, projectsLoaded] = useK8sWatchResource<Project[]>({
    isList: true,
    kind: 'Project',
    optional: true,
  });
  const [pipelineRunsMetricsCountData, , loadingPipelineRunsMetricsCount] =
    namespace == ALL_NAMESPACES_KEY
      ? usePipelineMetricsForAllNamespacePoll({
          timespan,
          delay: interval,
          queryPrefix: MetricsQueryPrefix.TEKTON_PIPELINES_CONTROLLER,
          metricsQuery:
            PipelineQuery.PIPELINERUN_COUNT_WITH_METRIC_FOR_ALL_NAMESPACE,
        })
      : usePipelineMetricsForNamespacePoll({
          namespace,
          timespan,
          delay: interval,
          queryPrefix: MetricsQueryPrefix.TEKTON_PIPELINES_CONTROLLER,
          metricsQuery:
            PipelineQuery.PIPELINERUN_COUNT_WITH_METRIC_FOR_NAMESPACE,
        });

  const [pipelineRunsMetricsSumData, , loadingPipelineRunsMetricsSum] =
    namespace == ALL_NAMESPACES_KEY
      ? usePipelineMetricsForAllNamespacePoll({
          timespan,
          delay: interval,
          queryPrefix: MetricsQueryPrefix.TEKTON_PIPELINES_CONTROLLER,
          metricsQuery:
            PipelineQuery.PIPELINERUN_SUM_WITH_METRIC_FOR_ALL_NAMESPACE,
        })
      : usePipelineMetricsForNamespacePoll({
          namespace,
          timespan,
          delay: interval,
          queryPrefix: MetricsQueryPrefix.TEKTON_PIPELINES_CONTROLLER,
          metricsQuery: PipelineQuery.PIPELINERUN_SUM_WITH_METRIC_FOR_NAMESPACE,
        });

  const summaryDataK8s = React.useMemo(() => {
    return processData(
      pipelineRunsMetricsCountData,
      pipelineRunsMetricsSumData,
      tickValues,
      type,
    );
  }, [pipelineRunsMetricsCountData, pipelineRunsMetricsSumData]);

  const summaryDataFiltered = React.useMemo(() => {
    return summaryDataK8s.filter((summary) =>
      summary.group_value
        .split('/')[1]
        .toLowerCase()
        .includes(searchText.toLowerCase()),
    );
  }, [searchText, summaryDataK8s]);

  useQueryParams({
    key: 'search',
    value: searchText,
    setValue: setSearchText,
    defaultValue: '',
  });

  useQueryParams({
    key: 'list',
    value: pageFlag,
    setValue: setPageFlag,
    defaultValue: 1,
    options: { perpipeline: 1, perrepository: 2 },
    displayFormat: (v) => (v == 1 ? 'perpipeline' : 'perrepository'),
    loadFormat: (v) => (v == 'perrepository' ? 2 : 1),
  });

  // const handlePageChange = (pageNumber: number) => {
  //   setloaded(false);
  //   setSummaryData([]);
  //   setSummaryDataFiltered([]);
  //   setPageFlag(pageNumber);
  // };
  const handleNameChange = (value: string) => {
    setSearchText(value);
  };
  return (
    <Card
      className={classNames('pipeline-overview__pipelinerun-status-card', {
        'card-border': bordered,
      })}
    >
      <CardBody>
        <Grid hasGutter className="pipeline-overview__listpage__grid">
          <GridItem span={9} className="pipeline-overview__listpage__griditem">
            {/* Lastrun Status is not provided by API  */}
            {/* <StatusDropdown /> */}
            <SearchInputField
              searchText={searchText}
              pageFlag={pageFlag}
              handleNameChange={handleNameChange}
            />
          </GridItem>
          {/*
          Since Pipeline metrics for PAC is not available, commenting this
          <GridItem span={3}>
            <ToggleGroup className="pipeline-overview__listpage__button">
              <ToggleGroupItem
                text={t('Per Pipeline')}
                buttonId="pipelineButton"
                isSelected={pageFlag === 1}
                onChange={() => handlePageChange(1)}
              />
              <ToggleGroupItem
                text={t('Per Repository')}
                buttonId="repositoryButton"
                isSelected={pageFlag === 2}
                onChange={() => handlePageChange(2)}
              />
            </ToggleGroup>
          </GridItem> */}
        </Grid>
        <Grid hasGutter>
          <GridItem span={12}>
            {pageFlag === 1 ? (
              <PipelineRunsForPipelinesListK8s
                summaryData={summaryDataK8s}
                summaryDataFiltered={summaryDataFiltered}
                loaded={!loadingPipelineRunsMetricsCount && !loadingPipelineRunsMetricsSum}
                hideLastRunTime={true}
                projects={projects}
                projectsLoaded={projectsLoaded}
              />
            ) : (
              <PipelineRunsForRepositoriesList
                summaryData={summaryDataK8s}
                summaryDataFiltered={summaryDataFiltered}
                loaded={!loadingPipelineRunsMetricsCount && !loadingPipelineRunsMetricsSum}
              />
            )}
          </GridItem>
        </Grid>
      </CardBody>
    </Card>
  );
};

export default PipelineRunsListPageK8s;
