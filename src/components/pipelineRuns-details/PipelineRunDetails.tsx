import * as React from 'react';
import { ResourceSummary } from '../details-page/details-page';
import { PipelineRunKind } from '../../types';
import { useTranslation } from 'react-i18next';
import { SectionHeading } from '../pipelines-tasks/tasks-details-pages/headings';
import { PipelineRunModel } from '../../models';
import PipelineRunVisualization from './PipelineRunVisualization';
import PipelineRunCustomDetails from './PipelineRunCustomDetails';

type PipelineRunDetailsProps = {
  obj: PipelineRunKind;
};

const PipelineRunDetails: React.FC<PipelineRunDetailsProps> = ({
  obj: pipelineRun,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return (
    <div className="co-m-pane__body">
      <SectionHeading text={t('PipelineRun details')} />
      <PipelineRunVisualization pipelineRun={pipelineRun} />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={pipelineRun} model={PipelineRunModel} />
        </div>
        <div className="col-sm-6 odc-pipeline-run-details__customDetails">
          <PipelineRunCustomDetails pipelineRun={pipelineRun} />
        </div>
      </div>
    </div>
  );
};

export default PipelineRunDetails;
