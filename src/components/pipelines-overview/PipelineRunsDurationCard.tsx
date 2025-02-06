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
import { SummaryProps, getFilter, useInterval } from './utils';
import { getResultsSummary } from '../utils/summary-api';
import { DataType } from '../../types';
import { ALL_NAMESPACES_KEY } from '../../consts';
import { formatTime, getDropDownDate } from './dateTime';
import { LoadingInline } from '../Loading';

import './PipelineRunsDurationCard.scss';

interface PipelinesRunsDurationProps {
  namespace: string;
  timespan: number;
  interval: number;
  parentName?: string;
  summaryData?: SummaryProps;
  bordered?: boolean;
  kind?: string;
}

const PipelinesRunsDurationCard: React.FC<PipelinesRunsDurationProps> = ({
  namespace,
  timespan,
  parentName,
  interval,
  bordered,
  kind,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [summaryData, setSummaryData] = React.useState<SummaryProps>({});
  const [loaded, setLoaded] = React.useState(false);
  if (namespace == ALL_NAMESPACES_KEY) {
    namespace = '-';
  }

  React.useEffect(() => {
    setLoaded(false);
  }, [namespace, timespan]);

  const date = getDropDownDate(timespan).toISOString();

  const getSummaryData = () => {
    getResultsSummary(namespace, {
      summary: 'total_duration,avg_duration,max_duration',
      data_type: DataType?.PipelineRun,
      filter: getFilter(date, parentName, kind),
    })
      .then((response) => {
        setLoaded(true);
        setSummaryData(response.summary?.[0]);
      })
      .catch((e) => {
        console.error('unable to post', e);
      });
  };

  useInterval(getSummaryData, interval, namespace, date);

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
              {loaded ? (
                summaryData?.['avg_duration'] ? (
                  formatTime(summaryData?.['avg_duration'])
                ) : (
                  '-'
                )
              ) : (
                <LoadingInline />
              )}
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
              {loaded ? (
                summaryData?.['max_duration'] ? (
                  formatTime(summaryData?.['max_duration'])
                ) : (
                  '-'
                )
              ) : (
                <LoadingInline />
              )}
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
              {loaded ? (
                summaryData?.['total_duration'] ? (
                  formatTime(summaryData?.['total_duration'])
                ) : (
                  '-'
                )
              ) : (
                <LoadingInline />
              )}
            </GridItem>
          </Grid>
        </CardBody>
      </Card>
    </>
  );
};

export default PipelinesRunsDurationCard;
