import * as React from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { CheckIcon } from '@patternfly/react-icons';
import {
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

import './PipelineRunsTotalCard.scss';

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

  if (namespace == ALL_NAMESPACES_KEY) {
    namespace = '-';
  }

  React.useEffect(() => {
    setLoaded(false);
  }, [namespace, timespan]);

  const date = getDropDownDate(timespan).toISOString();

  const getSummaryData = (filter, setData) => {
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
    )
      .then((response) => {
        setLoaded(true);
        setData(response?.summary?.[0]?.total);
      })
      .catch((e) => {
        console.error('Error in getSummary', e);
      });
  };

  const pipelineFilter = `data.spec.pipelineRef.contains("name") && data.status.startTime>timestamp("${date}")`;
  useInterval(
    () => getSummaryData(pipelineFilter, setPlrRun),
    interval,
    namespace,
    date,
  );

  const pacFilter = `data.metadata.labels.contains("pipelinesascode.tekton.dev/repository") && data.status.startTime>timestamp("${date}")`;
  useInterval(
    () => getSummaryData(pacFilter, setRepoRun),
    interval,
    namespace,
    date,
  );

  const allFilter = `data.status.startTime>timestamp("${date}")`;
  useInterval(
    () => getSummaryData(allFilter, setTotalRun),
    interval,
    namespace,
    date,
  );

  return (
    <>
      <Card
        className={classNames('pipeline-overview__totals-card', {
          'card-border': bordered,
        })}
      >
        <CardTitle>
          <span>{t('Total runs')}</span>
        </CardTitle>
        <Divider />
        <CardBody>
          <Grid hasGutter className="pipeline-overview__totals-card__grid">
            <GridItem span={9}>
              <span>
                <Label
                  variant="outline"
                  className="pipeline-overview__totals-card__label"
                >
                  {PipelineModel.abbr}
                </Label>
                {t('Runs in pipelines')}
              </span>
            </GridItem>
            <GridItem
              span={3}
              className="pipeline-overview__totals-card__value"
            >
              {loaded ? plrRun : <LoadingInline />}
            </GridItem>
          </Grid>
          <Grid hasGutter className="pipeline-overview__totals-card__grid">
            <GridItem span={9}>
              <span>
                <Label
                  variant="outline"
                  className="pipeline-overview__totals-card__repo-label"
                >
                  {RepositoryModel.abbr}
                </Label>
                {t('Runs in repositories')}
              </span>
            </GridItem>
            <GridItem
              span={3}
              className="pipeline-overview__totals-card__value"
            >
              {loaded ? repoRun : <LoadingInline />}
            </GridItem>
          </Grid>
          <Grid hasGutter>
            <GridItem span={9}>
              <span>
                <CheckIcon className="pipeline-overview__totals-card__icon" />
                {t('Total runs')}
              </span>
            </GridItem>
            <GridItem
              span={3}
              className="pipeline-overview__totals-card__value"
            >
              {loaded ? totalRun : <LoadingInline />}
            </GridItem>
          </Grid>
        </CardBody>
      </Card>
    </>
  );
};

export default PipelinesRunsTotalCard;
