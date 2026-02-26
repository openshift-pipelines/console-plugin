import * as React from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { CheckIcon } from '@patternfly/react-icons';
import { t_chart_color_blue_300 as blueColor } from '@patternfly/react-tokens/dist/js/t_chart_color_blue_300';
import {
  Alert,
  Card,
  CardBody,
  CardTitle,
  Divider,
  Grid,
  GridItem,
  Label,
} from '@patternfly/react-core';
import { SummaryProps, getTotalPipelineRuns } from './utils';
import { PipelineModel, RepositoryModel } from '../../models';
import { ALL_NAMESPACES_KEY } from '../../consts';

import { MetricsQueryPrefix, PipelineQuery } from '../pipelines-metrics/utils';
import {
  usePipelineMetricsForAllNamespacePoll,
  usePipelineMetricsForNamespacePoll,
} from '../pipelines-metrics/hooks';
import { getXaxisValues } from './dateTime';
import { LoadingInline } from '../Loading';

interface PipelinesRunsDurationProps {
  namespace: string;
  timespan: number;
  interval: number;
  summaryData?: SummaryProps;
  bordered?: boolean;
}

const PipelineRunsTotalCardK8s: React.FC<PipelinesRunsDurationProps> = ({
  namespace,
  timespan,
  interval,
  bordered,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [pipelineRunsTotalError, setPipelineRunsTotalError] = React.useState<
    string | null
  >(null);
  const [
    totalPipelineRunsData,
    totalPipelineRunsError,
    loadingTotalPipelineRunsData,
  ] =
    namespace == ALL_NAMESPACES_KEY
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

  const totalPipelineRuns = React.useMemo(() => {
    if (totalPipelineRunsError) {
      return '-';
    }
    return getTotalPipelineRuns(totalPipelineRunsData, tickValues, type);
  }, [totalPipelineRunsData, tickValues, type, totalPipelineRunsError]);

  React.useEffect(() => {
    const hasNonAbortError =
      totalPipelineRunsError && totalPipelineRunsError.name !== 'AbortError';
    setPipelineRunsTotalError(
      hasNonAbortError
        ? totalPipelineRunsError?.message ?? t('Unable to load pipeline runs')
        : null,
    );
  }, [totalPipelineRunsError]);

  return (
    <>
      <Card
        className={classNames('pf-v6-u-h-100', {
          'card-border': bordered,
        })}
      >
        <CardTitle>
          <span>{t('Total runs')}</span>
        </CardTitle>
        <Divider />
        <CardBody>
          {pipelineRunsTotalError ? (
            <Alert
              variant="danger"
              isInline
              title={t('Unable to load total runs')}
              className="pf-v6-u-mb-md"
            />
          ) : (
            <>
              <Grid hasGutter className="pipeline-overview__totals-card__grid">
                <GridItem span={9} className="pf-v6-u-mb-sm">
                  <span>
                    <Label
                      variant="outline"
                      className="pipeline-overview__totals-card__label pf-v6-u-mr-sm"
                    >
                      {PipelineModel.abbr}
                    </Label>
                    {t('Runs in pipelines')}
                  </span>
                </GridItem>
                <GridItem
                  span={3}
                  style={{ color: blueColor.value }}
                  className="pf-v6-u-text-align-end"
                >
                  {loadingTotalPipelineRunsData ? <LoadingInline /> : '-'}
                </GridItem>
              </Grid>
              <Grid
                hasGutter
                className="pipeline-overview__totals-card__grid pf-v6-u-mb-sm"
              >
                <GridItem span={9}>
                  <span>
                    <Label
                      variant="outline"
                      className="pipeline-overview__totals-card__repo-label pf-v6-u-mr-sm"
                    >
                      {RepositoryModel.abbr}
                    </Label>
                    {t('Runs in repositories')}
                  </span>
                </GridItem>
                <GridItem
                  span={3}
                  style={{ color: blueColor.value }}
                  className="pf-v6-u-text-align-end"
                >
                  {loadingTotalPipelineRunsData ? <LoadingInline /> : '-'}
                </GridItem>
              </Grid>
              <Grid hasGutter>
                <GridItem span={9}>
                  <span>
                    <CheckIcon className="pipeline-overview__totals-card__icon pf-v6-u-ml-sm pf-v6-u-mr-sm" />
                    {t('Total runs')}
                  </span>
                </GridItem>
                <GridItem
                  span={3}
                  style={{ color: blueColor.value }}
                  className="pf-v6-u-text-align-end"
                >
                  {loadingTotalPipelineRunsData ? (
                    <LoadingInline />
                  ) : (
                    totalPipelineRuns
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

export default PipelineRunsTotalCardK8s;
