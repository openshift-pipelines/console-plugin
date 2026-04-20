import type { FC } from 'react';
import { useState, useMemo, useEffect } from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import {
  HistoryIcon,
  InfoCircleIcon,
  MonitoringIcon,
} from '@patternfly/react-icons';
import {
  Alert,
  Card,
  CardBody,
  CardTitle,
  Divider,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import {
  SummaryProps,
  getPipelineRunAverageDuration,
  getTotalPipelineRuns,
  getTotalPipelineRunsDuration,
} from './utils';

import { ALL_NAMESPACES_KEY } from '../../consts';

import {
  usePipelineMetricsForAllNamespacePoll,
  usePipelineMetricsForNamespaceForPipelinePoll,
  usePipelineMetricsForNamespacePoll,
} from '../pipelines-metrics/hooks';
import { MetricsQueryPrefix, PipelineQuery } from '../pipelines-metrics/utils';
import { getXaxisValues } from './dateTime';
import { Loading } from '../Loading';

import './PipelinesOverview.scss';

interface PipelinesRunsDurationProps {
  namespace: string;
  timespan: number;
  interval: number;
  parentName?: string;
  summaryData?: SummaryProps;
  bordered?: boolean;
}

const PipelineRunsDurationCardK8s: FC<PipelinesRunsDurationProps> = ({
  namespace,
  timespan,
  parentName,
  interval,
  bordered,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [pipelineRunsDurationError, setPipelineRunsDurationError] = useState<
    string | null
  >(null);

  const [
    totalPipelineRunsCountData,
    totalPipelineRunsCountError,
    loadingPipelineRunsCount,
  ] =
    parentName && namespace
      ? usePipelineMetricsForNamespaceForPipelinePoll({
          namespace,
          timespan,
          delay: interval,
          queryPrefix: MetricsQueryPrefix.TEKTON_PIPELINES_CONTROLLER,
          name: parentName,
          metricsQuery:
            PipelineQuery.PIPELINERUN_COUNT_FOR_NAMESPACE_FOR_PIPELINE,
          timeout: 90000,
        })
      : namespace == ALL_NAMESPACES_KEY
      ? usePipelineMetricsForAllNamespacePoll({
          timespan,
          delay: interval,
          queryPrefix: MetricsQueryPrefix.TEKTON_PIPELINES_CONTROLLER,
          metricsQuery: PipelineQuery.PIPELINERUN_COUNT_FOR_ALL_NAMESPACE,
          timeout: 90000,
        })
      : usePipelineMetricsForNamespacePoll({
          namespace,
          timespan,
          delay: interval,
          queryPrefix: MetricsQueryPrefix.TEKTON_PIPELINES_CONTROLLER,
          metricsQuery: PipelineQuery.PIPELINERUN_COUNT_FOR_NAMESPACE,
          timeout: 90000,
        });
  const [tickValues, type] = getXaxisValues(timespan);

  const totalPipelineRuns = useMemo(() => {
    if (totalPipelineRunsCountError) {
      return;
    }
    return getTotalPipelineRuns(totalPipelineRunsCountData, tickValues, type);
  }, [
    totalPipelineRunsCountData,
    totalPipelineRunsCountError,
    tickValues,
    type,
  ]);

  const [
    totalPipelineRunsDurationData,
    totalPipelineRunsDurationError,
    loadingPipelineRunsDuration,
  ] =
    parentName && namespace
      ? usePipelineMetricsForNamespaceForPipelinePoll({
          namespace,
          timespan,
          delay: interval,
          queryPrefix: MetricsQueryPrefix.TEKTON_PIPELINES_CONTROLLER,
          name: parentName,
          metricsQuery:
            PipelineQuery.PIPELINERUN_DURATION_FOR_NAMESPACE_FOR_PIPELINE,
          timeout: 90000,
        })
      : namespace == ALL_NAMESPACES_KEY
      ? usePipelineMetricsForAllNamespacePoll({
          timespan,
          delay: interval,
          queryPrefix: MetricsQueryPrefix.TEKTON_PIPELINES_CONTROLLER,
          metricsQuery: PipelineQuery.PIPELINERUN_DURATION_FOR_ALL_NAMESPACE,
          timeout: 90000,
        })
      : usePipelineMetricsForNamespacePoll({
          namespace,
          timespan,
          delay: interval,
          queryPrefix: MetricsQueryPrefix.TEKTON_PIPELINES_CONTROLLER,
          metricsQuery: PipelineQuery.PIPELINERUN_DURATION_FOR_NAMESPACE,
          timeout: 90000,
        });

  const [totalPipelineRunsDuration, totalPipelineRunsDurationValue] =
    useMemo(() => {
      if (totalPipelineRunsDurationError) {
        return ['-', 0];
      }
      return getTotalPipelineRunsDuration(
        totalPipelineRunsDurationData,
        tickValues,
        type,
      );
    }, [
      totalPipelineRunsDurationData,
      totalPipelineRunsDurationError,
      tickValues,
      type,
    ]);

  const averageDuration = useMemo(() => {
    if (
      totalPipelineRunsDurationError ||
      totalPipelineRunsCountError ||
      !totalPipelineRuns
    ) {
      return '-';
    }
    return getPipelineRunAverageDuration(
      totalPipelineRunsDurationValue,
      totalPipelineRuns,
    );
  }, [totalPipelineRunsDurationValue, totalPipelineRuns]);

  useEffect(() => {
    const hasNonAbortError =
      (totalPipelineRunsCountError &&
        totalPipelineRunsCountError.name !== 'AbortError') ||
      (totalPipelineRunsDurationError &&
        totalPipelineRunsDurationError.name !== 'AbortError');

    setPipelineRunsDurationError(
      hasNonAbortError
        ? totalPipelineRunsCountError?.message ??
            totalPipelineRunsDurationError?.message ??
            t('Unable to load duration')
        : null,
    );
  }, [totalPipelineRunsCountError, totalPipelineRunsDurationError, t]);

  return (
    <>
      <Card
        className={classNames(
          'pf-v6-u-h-100 pipeline-overview__min-width-full pf-v6-u-font-size-lg',
          {
            'card-border': bordered,
          },
        )}
      >
        <CardTitle className="pf-v6-u-font-size-xl">
          <span>{t('Duration')}</span>
        </CardTitle>
        <Divider />
        <CardBody className="pf-v6-u-font-size-lg pipeline-overview__min-width-min-content">
          {pipelineRunsDurationError ? (
            <Alert
              variant="danger"
              isInline
              title={t('Unable to load duration')}
              className="pf-v6-u-mb-md"
            />
          ) : (
            <>
              <Grid hasGutter className="pf-v6-u-mb-sm pf-v6-u-font-size-lg">
                <GridItem span={9} className="pf-v6-u-mb-sm">
                  <span className="pf-v6-u-font-size-lg">
                    <MonitoringIcon className="pf-v6-u-mr-sm" />
                    {t('Average duration')}
                  </span>
                </GridItem>
                <GridItem
                  span={3}
                  className="pf-v6-u-text-align-end pf-v6-u-font-size-lg pipeline-overview__chart-color-blue"
                >
                  {loadingPipelineRunsCount ? (
                    <Loading isInline={true} />
                  ) : (
                    averageDuration
                  )}
                </GridItem>
              </Grid>
              <Grid hasGutter className="pf-v6-u-mb-sm pf-v6-u-font-size-lg">
                <GridItem span={9} className="pf-v6-u-mb-sm">
                  <span className="pf-v6-u-font-size-lg">
                    <InfoCircleIcon className="pf-v6-u-mr-sm pipeline-overview__chart-color-blue" />
                    {t('Maximum')}
                  </span>
                </GridItem>
                <GridItem
                  span={3}
                  className="pf-v6-u-text-align-end pf-v6-u-font-size-lg pipeline-overview__chart-color-blue"
                >
                  {loadingPipelineRunsCount ? <Loading isInline={true} /> : '-'}
                </GridItem>
              </Grid>
              <Grid hasGutter className="pf-v6-u-font-size-lg">
                <GridItem span={9}>
                  <span className="pf-v6-u-font-size-lg">
                    <HistoryIcon className="pf-v6-u-mr-sm" />
                    {t('Total duration')}
                  </span>
                </GridItem>
                <GridItem
                  span={3}
                  className="pf-v6-u-text-align-end pf-v6-u-font-size-lg pipeline-overview__chart-color-blue"
                >
                  {loadingPipelineRunsDuration ? (
                    <Loading isInline={true} />
                  ) : (
                    totalPipelineRunsDuration ?? '-'
                  )}
                </GridItem>
              </Grid>
            </>
          )}
        </CardBody>
      </Card>
    </>
  );
};

export default PipelineRunsDurationCardK8s;
