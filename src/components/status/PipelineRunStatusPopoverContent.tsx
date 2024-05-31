import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import { PipelineRunModel } from '../../models';
import { PipelineRunKind } from '../../types';
import { useTaskRuns } from '../hooks/useTaskRuns';
import LogSnippetBlock from '../logs/LogSnippetBlock';
import { getPLRLogSnippet } from '../logs/pipelineRunLogSnippet';
import { LoadingInline } from '../Loading';
import { resourcePathFromModel } from '../utils/utils';
import './StatusPopoverContent.scss';

type StatusPopoverContentProps = {
  pipelineRun: PipelineRunKind;
};
const PipelineRunStatusPopoverContent: React.FC<StatusPopoverContentProps> = ({
  pipelineRun,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [PLRTaskRuns, taskRunsLoaded] = useTaskRuns(
    pipelineRun.metadata.namespace,
    pipelineRun.metadata.name,
  );
  if (!taskRunsLoaded) {
    return (
      <div style={{ minHeight: '300px' }}>
        <LoadingInline />
      </div>
    );
  }

  const logDetails = getPLRLogSnippet(pipelineRun, PLRTaskRuns);

  return (
    <div className="odc-statuspopover-content" style={{ minHeight: '300px' }}>
      <LogSnippetBlock
        logDetails={logDetails}
        namespace={pipelineRun.metadata.namespace}
      >
        {(logSnippet: string) => (
          <>
            <pre className="co-pre">{logSnippet}</pre>
            <Link
              to={`${resourcePathFromModel(
                PipelineRunModel,
                pipelineRun.metadata.name,
                pipelineRun.metadata.namespace,
              )}/logs`}
            >
              {t('View logs')}
            </Link>
          </>
        )}
      </LogSnippetBlock>
    </div>
  );
};

export default PipelineRunStatusPopoverContent;
