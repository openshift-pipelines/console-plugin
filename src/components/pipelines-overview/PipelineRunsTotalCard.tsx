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

interface PipelinesRunsDurationProps {
  summaryData: SummaryProps;
  bordered?: boolean;
}

const PipelinesRunsTotalCard: React.FC<PipelinesRunsDurationProps> = ({
  summaryData,
  bordered,
}) => {
  const { t } = useTranslation('plugin__pipeline-console-plugin');

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
                {summaryData['runs-in-pipelines']}
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
                {summaryData['runs-in-repositories']}
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
                {summaryData['runs-in-pipelines'] +
                  summaryData['runs-in-repositories']}
              </span>
            </GridItem>
          </Grid>
        </CardBody>
      </Card>
    </>
  );
};

export default PipelinesRunsTotalCard;
