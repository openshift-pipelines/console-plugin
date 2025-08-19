import * as React from 'react';
import { ResourceSummary } from '../details-page/details-page';
import { PipelineRunKind } from '../../types';
import { useTranslation } from 'react-i18next';
import { PipelineRunModel } from '../../models';
import PipelineRunVisualization from './PipelineRunVisualization';
import PipelineRunCustomDetails from './PipelineRunCustomDetails';
import { Grid, GridItem, PageSection, Title } from '@patternfly/react-core';

type PipelineRunDetailsProps = {
  obj: PipelineRunKind;
};

const PipelineRunDetails: React.FC<PipelineRunDetailsProps> = ({
  obj: pipelineRun,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return (
    <PageSection isFilled variant="light">
      <Title headingLevel="h2">{t('PipelineRun details')}</Title>
      <PipelineRunVisualization pipelineRun={pipelineRun} />
      <Grid hasGutter>
        <GridItem sm={6}>
          <ResourceSummary resource={pipelineRun} model={PipelineRunModel} />
        </GridItem>
        <GridItem sm={6} className="odc-pipeline-run-details__customDetails">
          <PipelineRunCustomDetails pipelineRun={pipelineRun} />
        </GridItem>
      </Grid>
    </PageSection>
  );
};

export default PipelineRunDetails;
