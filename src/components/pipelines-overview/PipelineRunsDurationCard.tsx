import * as React from 'react';
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
import { useFlag } from '@openshift-console/dynamic-plugin-sdk';
import { SummaryProps, getFilter, useInterval } from './utils';
import { getResultsSummary } from '../utils/summary-api';
import { DataType, FLAGS } from '../../types';
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
  const isDevConsoleProxyAvailable = useFlag(FLAGS.DEVCONSOLE_PROXY);
  const [summaryData, setSummaryData] = React.useState<SummaryProps>({});
  const [loaded, setLoaded] = React.useState(false);
  const [pipelineRunsDurationError, setPipelineRunsDurationError] =
    React.useState<string | undefined>();
  const abortControllerRef = React.useRef<AbortController>();

  if (namespace == ALL_NAMESPACES_KEY) {
    namespace = '-';
  }

  React.useEffect(() => {
    setLoaded(false);
    setPipelineRunsDurationError(undefined);
    setSummaryData({});
  }, [namespace, timespan]);

  React.useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const date = getDropDownDate(timespan).toISOString();

  const getSummaryData = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    setSummaryData({});
    setPipelineRunsDurationError(undefined);
    setLoaded(false);
    getResultsSummary(
      namespace,
      {
        summary: 'total_duration,avg_duration,max_duration',
        data_type: DataType?.PipelineRun,
        filter: getFilter(date, parentName, kind),
      },
      undefined,
      isDevConsoleProxyAvailable,
      abortControllerRef.current.signal,
      90000, // increase timeout to 90 seconds
    )
      .then((response) => {
        setLoaded(true);
        setPipelineRunsDurationError(undefined);
        setSummaryData(response.summary?.[0]);
      })
      .catch((e) => {
        if (e.name === 'AbortError') {
          return;
        }
        // Don't log to console, just show user-facing error
        setLoaded(true);
        setPipelineRunsDurationError(
          e.message || t('Failed to load duration data'),
        );
        // Clear stale data on error
        setSummaryData({});
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
          {pipelineRunsDurationError ? (
            <Alert
              variant="danger"
              isInline
              title={t('Unable to load duration')}
              className="pf-v6-u-mb-md"
            />
          ) : (
            <>
              <Grid
                hasGutter
                className="pipeline-overview__duration-card__grid"
              >
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
              <Grid
                hasGutter
                className="pipeline-overview__duration-card__grid"
              >
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
            </>
          )}
        </CardBody>
      </Card>
    </>
  );
};

export default PipelinesRunsDurationCard;
