import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { SectionHeading } from './headings';
import { ClusterTaskModel } from '../../../models';
import { ResourceSummary } from '../../details-page/details-page';
import WorkspaceDefinitionList from '../../details-page/WorkspaceDefinitionList';
import { TaskKind } from '../../../types';
import './ClusterTaskDetails.scss';

export interface ClusterTaskDetailsProps {
  obj: TaskKind;
}

const ClusterTaskDetails: React.FC<ClusterTaskDetailsProps> = ({
  obj: task,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  return (
    <div className="co-m-pane__body">
      <SectionHeading
        text={t('{{clusterTaskLabel}} details', {
          clusterTaskLabel: t(ClusterTaskModel.labelKey),
        })}
      />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={task} model={ClusterTaskModel} />
        </div>
        <div className="col-sm-6 odc-cluster-task-details__status">
          <WorkspaceDefinitionList workspaces={task.spec.workspaces} />
        </div>
      </div>
    </div>
  );
};

export default ClusterTaskDetails;
