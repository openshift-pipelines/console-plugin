import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { PageSection } from '@patternfly/react-core';
import { taskRunFilterReducer } from '../../utils/pipeline-filter-reducer';
import TaskRunDetailsSection from './TaskRunDetailsSection';
import { TaskRunModel } from '../../../models';
import ResultsList from './ResultList';
import { TaskRunKind } from '../../../types';
import './TaskRunDetails.scss';

export interface TaskRunDetailsProps {
  obj: TaskRunKind;
}

const TaskRunDetails: React.FC<TaskRunDetailsProps> = ({ obj: taskRun }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  return (
    <>
      <PageSection hasBodyWrapper={false} isFilled>
        <TaskRunDetailsSection taskRun={taskRun} />
      </PageSection>
      {taskRun?.status?.taskResults || taskRun?.status?.results ? (
        <PageSection hasBodyWrapper={false} isFilled>
          <ResultsList
            results={taskRun.status?.taskResults || taskRun.status?.results}
            resourceName={t(TaskRunModel.labelKey)}
            status={taskRunFilterReducer(taskRun)}
          />
        </PageSection>
      ) : null}
    </>
  );
};

export default TaskRunDetails;
