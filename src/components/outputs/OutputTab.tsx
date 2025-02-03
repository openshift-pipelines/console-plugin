import * as React from 'react';
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
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
    <div className="co-m-pane__body">
      <ResultsList
        results={
          pipelineRun.status?.pipelineResults || pipelineRun.status?.results
        }
        resourceName={t(PipelineRunModel.labelKey)}
      />
    </div>
  ) : (
    <EmptyState variant={EmptyStateVariant.full}>
      <EmptyStateBody>
        <p>{t('No Output found')}</p>
      </EmptyStateBody>
    </EmptyState>
  );
};
export default OutputTab;
