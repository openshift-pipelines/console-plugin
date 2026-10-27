import type { FC } from 'react';
import { ResourceSummary } from '../details-page/details-page';
import { PipelineRunKind } from '../../types';
import { useTranslation } from 'react-i18next';
import { PipelineRunModel } from '../../models';
import PipelineRunVisualization from './PipelineRunVisualization';
import PipelineRunCustomDetails from './PipelineRunCustomDetails';
import { Grid, GridItem, PageSection, Title } from '@patternfly/react-core';
import { Loading } from '../Loading';
import MultiClusterExecutionDetails from './MultiClusterExecutionDetails';
import { useMultiClusterProxyService } from '../hooks/useMultiClusterProxyService';

type PipelineRunDetailsProps = {
  obj: PipelineRunKind;
};

const PipelineRunDetails: FC<PipelineRunDetailsProps> = ({
  obj: pipelineRun,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { isHub, isResourceManagedByKueue } = useMultiClusterProxyService({
    managedBy: pipelineRun?.spec?.managedBy,
  });
  if (!pipelineRun) {
    return <Loading />;
  }

  return (
    <PageSection
      key={pipelineRun?.metadata?.uid + pipelineRun?.metadata?.name}
      hasBodyWrapper={false}
      isFilled
    >
      <Title headingLevel="h2">{t('PipelineRun details')}</Title>
      <PipelineRunVisualization pipelineRun={pipelineRun} />
      {isHub && isResourceManagedByKueue && (
        <MultiClusterExecutionDetails pipelineRun={pipelineRun} />
      )}
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
