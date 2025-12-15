import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Grid, GridItem, Title } from '@patternfly/react-core';

import TaskRunDetailsStatus from './TaskRunDetailsStatus';
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
      <Title headingLevel="h2" className="pf-v6-u-mb-md">
        {t('{{taskRunLabel}} details', {
          taskRunLabel: t(TaskRunModel.labelKey),
        })}
      </Title>
      <Grid hasGutter>
        <GridItem sm={6}>
          <ResourceSummary resource={taskRun} model={TaskRunModel} />
        </GridItem>
        <GridItem sm={6} className="odc-taskrun-details__status">
          <TaskRunDetailsStatus taskRun={taskRun} />
        </GridItem>
      </Grid>
    </>
  );
};

export default TaskRunDetailsSection;
