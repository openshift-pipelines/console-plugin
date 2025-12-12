import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TaskModel } from '../../models';
import { TaskKind } from '../../types';
import { Grid, GridItem, PageSection } from '@patternfly/react-core';
import { SectionHeading } from '../pipelines-tasks/tasks-details-pages/headings';
import { ResourceSummary } from '../details-page/details-page';
import { WorkspaceDefinitionList } from '../pipelines-tasks';

export interface TaskDetailsProps {
  obj: TaskKind;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({ obj: task }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return (
    <PageSection hasBodyWrapper={false} isFilled >
      <SectionHeading
        text={t('{{taskLabel}} details', {
          taskLabel: t(TaskModel.labelKey),
        })}
      />
      <Grid hasGutter>
        <GridItem sm={6}>
          <ResourceSummary resource={task} model={TaskModel} />
        </GridItem>
        <GridItem sm={6} className="odc-task-details__status">
          <WorkspaceDefinitionList obj={task} />
        </GridItem>
      </Grid>
    </PageSection>
  );
};

export default TaskDetails;
