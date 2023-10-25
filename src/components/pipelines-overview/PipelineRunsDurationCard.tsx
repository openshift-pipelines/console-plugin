import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as classNames from 'classnames';
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
import { SummaryProps } from './utils';

interface PipelinesRunsDurationProps {
  summaryData: SummaryProps;
  bordered?: boolean;
}

const PipelinesRunsDurationCard: React.FC<PipelinesRunsDurationProps> = ({
  summaryData,
  bordered,
}) => {
  const { t } = useTranslation('plugin__pipeline-console-plugin');

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
            <GridItem span={8}>
              <span>
                <MonitoringIcon className="pipeline-overview__duration-card__icon" />
                {t('Average Duration')}
              </span>
            </GridItem>
            <GridItem span={4}>
              <span className="pipeline-overview__duration-card__value">
                {summaryData['avg-duration']}
              </span>
            </GridItem>
          </Grid>
          <Grid hasGutter className="pipeline-overview__duration-card__grid">
            <GridItem span={8}>
              <span>
                <InfoCircleIcon className="pipeline-overview__duration-card__info-icon" />
                {t('Maximun')}
              </span>
            </GridItem>
            <GridItem span={4}>
              <span className="pipeline-overview__duration-card__value">
                {summaryData['max-duration']}
              </span>
            </GridItem>
          </Grid>
          <Grid hasGutter>
            <GridItem span={8}>
              <span>
                <HistoryIcon className="pipeline-overview__duration-card__icon" />
                {t('Total Duration')}
              </span>
            </GridItem>
            <GridItem span={4}>
              <span className="pipeline-overview__duration-card__value">
                {summaryData['total-duration']}
              </span>
            </GridItem>
          </Grid>
        </CardBody>
      </Card>
    </>
  );
};

export default PipelinesRunsDurationCard;
