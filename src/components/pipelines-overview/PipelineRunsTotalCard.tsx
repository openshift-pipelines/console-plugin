import * as React from 'react';
import * as classNames from 'classnames';
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
import { SummaryProps } from './utils';
import { PipelineModel, RepositoryModel } from '../../models';
import { getResultsSummary } from '../utils/summary-api';
import { DataType } from '../utils/tekton-results';
import { ALL_NAMESPACES_KEY } from '../../consts';
import { getDropDownDate } from './dateTime';

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
  const { t } = useTranslation('plugin__pipeline-console-plugin');

  const [totalRun, setTotalRun] = React.useState(0);
  const [plrRun, setPlrRun] = React.useState(0);
  const [repoRun, setRepoRun] = React.useState(0);

  if (namespace == ALL_NAMESPACES_KEY) {
    namespace = '-';
  }

  const date = getDropDownDate(timespan).toISOString();
  const filter = `data.metadata.labels.contains("pipelinesascode.tekton.dev/repository")&&data.status.startTime>timestamp("${date}")`;

  React.useEffect(() => {
    getResultsSummary(namespace, {
      summary: 'total',
      data_type: DataType.PipelineRun,
      filter,
    })
      .then((response) => {
        setRepoRun(response.summary[0].total);
      })
      .catch((e) => {
        console.error('Error in getSummary', e);
      });
  }, [namespace, timespan]);

  const filter2 = `!data.metadata.labels.contains("pipelinesascode.tekton.dev/repository")&&data.status.startTime>timestamp("${date}")`;
  React.useEffect(() => {
    getResultsSummary(namespace, {
      summary: 'total',
      data_type: DataType.PipelineRun,
      filter: filter2,
    })
      .then((response) => {
        setPlrRun(response.summary[0].total);
      })
      .catch((e) => {
        console.error('Error in getSummary', e);
      });
  }, [namespace, timespan]);

  const filter3 = `data.status.startTime>timestamp("${date}")`;
  React.useEffect(() => {
    getResultsSummary(namespace, {
      summary: 'total',
      data_type: DataType.PipelineRun,
      filter: filter3,
    })
      .then((response) => {
        setTotalRun(response.summary[0].total);
      })
      .catch((e) => {
        console.error('Error in getSummary', e);
      });
  }, [namespace, timespan]);

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
            <GridItem span={3}>
              <span className="pipeline-overview__totals-card__value">
                {plrRun}
              </span>
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
            <GridItem span={3}>
              <span className="pipeline-overview__totals-card__value">
                {repoRun}
              </span>
            </GridItem>
          </Grid>
          <Grid hasGutter>
            <GridItem span={9}>
              <span>
                <CheckIcon className="pipeline-overview__totals-card__icon" />
                {t('Total runs')}
              </span>
            </GridItem>
            <GridItem span={3}>
              <span className="pipeline-overview__totals-card__value">
                {totalRun}
              </span>
            </GridItem>
          </Grid>
        </CardBody>
      </Card>
    </>
  );
};

export default PipelinesRunsTotalCard;
