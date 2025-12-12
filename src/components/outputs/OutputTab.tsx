import * as React from 'react';
import {
  EmptyState,
  EmptyStateVariant,
  PageSection,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { PipelineRunModel } from '../../models';
import { PipelineRunKind } from '../../types';

import ResultsList from './ResultsList';

const OutputTab: React.FC<{ obj: PipelineRunKind }> = ({
  obj: pipelineRun,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  return pipelineRun.status?.pipelineResults || pipelineRun.status?.results ? (
    <PageSection hasBodyWrapper={false} isFilled>
      <ResultsList
        results={
          pipelineRun.status?.pipelineResults || pipelineRun.status?.results
        }
        resourceName={t(PipelineRunModel.labelKey)}
      />
    </PageSection>
  ) : (
    <EmptyState
      variant={EmptyStateVariant.full}
      headingLevel="h4"
      titleText={t('No Output found')}
    ></EmptyState>
  );
};
export default OutputTab;
