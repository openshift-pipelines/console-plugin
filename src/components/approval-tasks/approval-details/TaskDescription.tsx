import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ApprovalTaskKind } from '../../../types';

export interface TaskDescriptionProps {
  obj: ApprovalTaskKind;
}

const TaskDescription: React.FC<TaskDescriptionProps> = ({ obj }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  if (!obj?.spec?.description || obj?.spec?.description?.length === 0)
    return null;

  return (
    <dl data-test-id="approval-task-description">
      <dt>{t('Description')}</dt>
      <dd>{obj.spec?.description}</dd>
    </dl>
  );
};

export default TaskDescription;
