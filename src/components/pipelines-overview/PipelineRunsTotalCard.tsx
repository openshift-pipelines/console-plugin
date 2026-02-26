import * as React from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { CheckIcon } from '@patternfly/react-icons';
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
import { useFlag } from '@openshift-console/dynamic-plugin-sdk';
import { SummaryProps, useInterval } from './utils';
import { PipelineModel, RepositoryModel } from '../../models';
import { getResultsSummary } from '../utils/summary-api';
import { ALL_NAMESPACES_KEY } from '../../consts';
import { getDropDownDate } from './dateTime';
import { LoadingInline } from '../Loading';
import { DataType, FLAGS } from '../../types';
import { t_chart_color_blue_300 as blueColor } from '@patternfly/react-tokens/dist/js/t_chart_color_blue_300';

interface PipelinesRunsDurationProps {
  namespace: string;
  timespan: number;
  interval: number;
  summaryData?: SummaryProps;
  bordered?: boolean;
}

const PipelinesRunsTotalCard: React.FC<PipelinesRunsDurationProps> = ({
  namespace,
  timespan,
  interval,
  bordered,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const isDevConsoleProxyAvailable = useFlag(FLAGS.DEVCONSOLE_PROXY);

  const [totalRun, setTotalRun] = React.useState(0);
  const [plrRun, setPlrRun] = React.useState(0);
  const [repoRun, setRepoRun] = React.useState(0);
  const [loaded, setLoaded] = React.useState(false);
  const [pipelineRunsTotalError, setPipelineRunsTotalError] = React.useState<
    string | undefined
  >();
  const abortControllerRefPipeline = React.useRef<AbortController>();
  const abortControllerRefRepo = React.useRef<AbortController>();
  const abortControllerRefAll = React.useRef<AbortController>();

  if (namespace == ALL_NAMESPACES_KEY) {
    namespace = '-';
  }

  React.useEffect(() => {
    setLoaded(false);
    setPipelineRunsTotalError(undefined);
    // Clear stale data when namespace or timespan changes
    setTotalRun(0);
    setPlrRun(0);
    setRepoRun(0);
  }, [namespace, timespan]);

  React.useEffect(() => {
    return () => {
      abortControllerRefPipeline.current?.abort();
      abortControllerRefRepo.current?.abort();
      abortControllerRefAll.current?.abort();
    };
  }, []);

  const date = getDropDownDate(timespan).toISOString();

  const getSummaryData = (filter, setData, controller) => {
    setData(0);
    setPipelineRunsTotalError(undefined);
    setLoaded(false);
    getResultsSummary(
      namespace,
      {
        summary: 'total',
        data_type: DataType?.PipelineRun,
        filter,
      },
      undefined,
      isDevConsoleProxyAvailable,
      controller?.signal,
      90000,
    )
      .then((response) => {
        setLoaded(true);
        setPipelineRunsTotalError(undefined);
        setData(response?.summary?.[0]?.total || 0);
      })
      .catch((e) => {
        if (e.name === 'AbortError') {
          // Request was cancelled, this is expected behavior
          return;
        }
        setLoaded(true);
        setPipelineRunsTotalError(
          e.message || t('Failed to load total runs data'),
        );
        setData(0);
      });
  };

  const pipelineFilter = `data.spec.pipelineRef.contains("name") && data.status.startTime>timestamp("${date}")`;
  useInterval(
    () => {
      abortControllerRefPipeline.current?.abort();
      abortControllerRefPipeline.current = new AbortController();
      getSummaryData(
        pipelineFilter,
        setPlrRun,
        abortControllerRefPipeline.current,
      );
    },
    interval,
    namespace,
    date,
  );

  const pacFilter = `data.metadata.labels.contains("pipelinesascode.tekton.dev/repository") && data.status.startTime>timestamp("${date}")`;
  useInterval(
    () => {
      abortControllerRefRepo.current?.abort();
      abortControllerRefRepo.current = new AbortController();
      getSummaryData(pacFilter, setRepoRun, abortControllerRefRepo.current);
    },
    interval,
    namespace,
    date,
  );

  const allFilter = `data.status.startTime>timestamp("${date}")`;
  useInterval(
    () => {
      abortControllerRefAll.current?.abort();
      abortControllerRefAll.current = new AbortController();
      getSummaryData(allFilter, setTotalRun, abortControllerRefAll.current);
    },
    interval,
    namespace,
    date,
  );

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
              <Grid hasGutter>
                <GridItem span={9} className="pf-v6-u-mb-sm">
                  <span>
                    <Label variant="outline" className="pf-v6-u-mr-sm">
                      {PipelineModel.abbr}
                    </Label>
                    {t('Runs in pipelines')}
                  </span>
                </GridItem>
                <GridItem
                  span={3}
                  className="pf-v6-u-text-align-end"
                  style={{ color: blueColor.value }}
                >
                  {loaded ? plrRun : <LoadingInline />}
                </GridItem>
              </Grid>
              <Grid hasGutter className="pf-v6-u-mb-sm">
                <GridItem span={9}>
                  <span>
                    <Label variant="outline" className="pf-v6-u-mr-sm">
                      {RepositoryModel.abbr}
                    </Label>
                    {t('Runs in repositories')}
                  </span>
                </GridItem>
                <GridItem
                  span={3}
                  className="pf-v6-u-text-align-end"
                  style={{ color: blueColor.value }}
                >
                  {loaded ? repoRun : <LoadingInline />}
                </GridItem>
              </Grid>
              <Grid hasGutter className="pf-v6-u-mb-sm">
                <GridItem span={9}>
                  <span>
                    <CheckIcon className="pipeline-overview__totals-card__icon pf-v6-u-ml-sm" />
                    {t('Total runs')}
                  </span>
                </GridItem>
                <GridItem
                  span={3}
                  className="pf-v6-u-text-align-end"
                  style={{ color: blueColor.value }}
                >
                  {loaded ? totalRun : <LoadingInline />}
                </GridItem>
              </Grid>
            </>
          )}
        </CardBody>
      </Card>
    </>
  );
};

export default PipelinesRunsTotalCard;
