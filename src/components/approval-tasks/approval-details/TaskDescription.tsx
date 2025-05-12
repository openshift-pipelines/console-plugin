import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { ApprovalTaskKind } from '../../../types';

export interface TaskDescriptionProps {
  obj: ApprovalTaskKind;
}

const TaskDescription: React.FC<TaskDescriptionProps> = ({ obj }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  if (!obj?.spec?.description || obj?.spec?.description?.length === 0)
    return null;

  return (
    <DescriptionListGroup data-test-id="approval-task-description">
      <DescriptionListTerm>{t('Description')}</DescriptionListTerm>
      <DescriptionListDescription>
        {obj.spec?.description}
      </DescriptionListDescription>
    </DescriptionListGroup>
  );
};

export default TaskDescription;
