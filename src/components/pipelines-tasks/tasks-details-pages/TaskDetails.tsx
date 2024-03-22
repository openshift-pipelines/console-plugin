import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TaskKind } from '../../../types';
import { TaskModel } from '../../../models';
import { SectionHeading } from './headings';
import { ResourceSummary } from '../../details-page/details-page';
import WorkspaceDefinitionList from '../../details-page/WorkspaceDefinitionList';
import './TaskDetails.scss';

export interface TaskDetailsProps {
  obj: TaskKind;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({ obj: task }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return (
    <div className="co-m-pane__body task-details-content">
      <SectionHeading
        text={t('{{taskLabel}} details', {
          taskLabel: t(TaskModel.labelKey),
        })}
      />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={task} model={TaskModel} />
        </div>
        <div className="col-sm-6 odc-task-details__status">
          <WorkspaceDefinitionList workspaces={task.spec.workspaces} />
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
