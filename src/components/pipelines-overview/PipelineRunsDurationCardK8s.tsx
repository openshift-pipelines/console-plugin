import * as React from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import {
  HistoryIcon,
  InfoCircleIcon,
  MonitoringIcon,
} from '@patternfly/react-icons';
import {
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

import './PipelineRunsDurationCard.scss';
import {
  usePipelineMetricsForAllNamespacePoll,
  usePipelineMetricsForNamespaceForPipelinePoll,
  usePipelineMetricsForNamespacePoll,
} from '../pipelines-metrics/hooks';
import { MetricsQueryPrefix, PipelineQuery } from '../pipelines-metrics/utils';
import { getXaxisValues } from './dateTime';
import { LoadingInline } from '../Loading';

interface PipelinesRunsDurationProps {
  namespace: string;
  timespan: number;
  interval: number;
  parentName?: string;
  summaryData?: SummaryProps;
  bordered?: boolean;
}

const PipelineRunsDurationCardK8s: React.FC<PipelinesRunsDurationProps> = ({
  namespace,
  timespan,
  parentName,
  interval,
  bordered,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  const [totalPipelineRunsCountData, , loadingPipelineRunsCount] =
    parentName && namespace
      ? usePipelineMetricsForNamespaceForPipelinePoll({
          namespace,
          timespan,
          delay: interval,
          queryPrefix: MetricsQueryPrefix.TEKTON_PIPELINES_CONTROLLER,
          name: parentName,
          metricsQuery:
            PipelineQuery.PIPELINERUN_COUNT_FOR_NAMESPACE_FOR_PIPELINE,
        })
      : namespace == ALL_NAMESPACES_KEY
      ? usePipelineMetricsForAllNamespacePoll({
          timespan,
          delay: interval,
          queryPrefix: MetricsQueryPrefix.TEKTON_PIPELINES_CONTROLLER,
          metricsQuery: PipelineQuery.PIPELINERUN_COUNT_FOR_ALL_NAMESPACE,
        })
      : usePipelineMetricsForNamespacePoll({
          namespace,
          timespan,
          delay: interval,
          queryPrefix: MetricsQueryPrefix.TEKTON_PIPELINES_CONTROLLER,
          metricsQuery: PipelineQuery.PIPELINERUN_COUNT_FOR_NAMESPACE,
        });
  const [tickValues, type] = getXaxisValues(timespan);

  const totalPipelineRuns = getTotalPipelineRuns(
    totalPipelineRunsCountData,
    tickValues,
    type,
  );

  const [totalPipelineRunsDurationData, , loadingPipelineRunsDuration] =
    parentName && namespace
      ? usePipelineMetricsForNamespaceForPipelinePoll({
          namespace,
          timespan,
          delay: interval,
          queryPrefix: MetricsQueryPrefix.TEKTON_PIPELINES_CONTROLLER,
          name: parentName,
          metricsQuery:
            PipelineQuery.PIPELINERUN_DURATION_FOR_NAMESPACE_FOR_PIPELINE,
        })
      : namespace == ALL_NAMESPACES_KEY
      ? usePipelineMetricsForAllNamespacePoll({
          timespan,
          delay: interval,
          queryPrefix: MetricsQueryPrefix.TEKTON_PIPELINES_CONTROLLER,
          metricsQuery: PipelineQuery.PIPELINERUN_DURATION_FOR_ALL_NAMESPACE,
        })
      : usePipelineMetricsForNamespacePoll({
          namespace,
          timespan,
          delay: interval,
          queryPrefix: MetricsQueryPrefix.TEKTON_PIPELINES_CONTROLLER,
          metricsQuery: PipelineQuery.PIPELINERUN_DURATION_FOR_NAMESPACE,
        });

  const [totalPipelineRunsDuration, totalPipelineRunsDurationValue] =
    getTotalPipelineRunsDuration(
      totalPipelineRunsDurationData,
      tickValues,
      type,
    );

  const averageDuration = getPipelineRunAverageDuration(
    totalPipelineRunsDurationValue,
    totalPipelineRuns,
  );

  return (
    <>
      <Card
        className={classNames('pipeline-overview__duration-card', {
          'card-border': bordered,
        })}
      >
        <CardTitle>
          <span>{t('Duration')}</span>
        </CardTitle>
        <Divider />
        <CardBody>
          <Grid hasGutter className="pipeline-overview__duration-card__grid">
            <GridItem span={6}>
              <span>
                <MonitoringIcon className="pipeline-overview__duration-card__icon" />
                {t('Average duration')}
              </span>
            </GridItem>
            <GridItem
              span={6}
              className="pipeline-overview__duration-card__value"
            >
              {loadingPipelineRunsCount ? 
                <LoadingInline/>
                : averageDuration}
            </GridItem>
          </Grid>
          <Grid hasGutter className="pipeline-overview__duration-card__grid">
            <GridItem span={6}>
              <span>
                <InfoCircleIcon className="pipeline-overview__duration-card__info-icon" />
                {t('Maximum')}
              </span>
            </GridItem>
            <GridItem
              span={6}
              className="pipeline-overview__duration-card__value"
            >
              {loadingPipelineRunsCount ? 
                <LoadingInline/>
                : '-'}
            </GridItem>
          </Grid>
          <Grid hasGutter>
            <GridItem span={6}>
              <span>
                <HistoryIcon className="pipeline-overview__duration-card__icon" />
                {t('Total duration')}
              </span>
            </GridItem>
            <GridItem
              span={6}
              className="pipeline-overview__duration-card__value"
            >
              {loadingPipelineRunsDuration ? 
                <LoadingInline/>
                : totalPipelineRunsDuration ?? '-'}
            </GridItem>
          </Grid>
        </CardBody>
      </Card>
    </>
  );
};

export default PipelineRunsDurationCardK8s;
