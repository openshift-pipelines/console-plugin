import * as React from 'react';
import { useTranslation } from 'react-i18next';

import TaskRunDetailsStatus from './TaskRunDetailsStatus';
import { SectionHeading } from './headings';
import { TaskRunModel } from '../../../models';
import { ResourceSummary } from '../../details-page/details-page';
import { TaskRunKind } from '../../../types';

export interface TaskRunDetailsSectionProps {
  taskRun: TaskRunKind;
}

const TaskRunDetailsSection: React.FC<TaskRunDetailsSectionProps> = ({
  taskRun,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return (
    <>
      <SectionHeading
        text={t('{{taskRunLabel}} details', {
          taskRunLabel: t(TaskRunModel.labelKey),
        })}
      />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={taskRun} model={TaskRunModel} />
        </div>
        <div className="col-sm-6 odc-taskrun-details__status">
          <TaskRunDetailsStatus taskRun={taskRun} />
        </div>
      </div>
    </>
  );
};

export default TaskRunDetailsSection;
