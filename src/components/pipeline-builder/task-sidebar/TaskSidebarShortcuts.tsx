import * as React from 'react';
import { Button, Popover } from '@patternfly/react-core';
import { QuestionCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { Shortcut, ShortcutTable } from '../../shortcuts';

const TaskSidebarShortcuts: React.FC = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  return (
    <Popover
      aria-label={t('View shortcuts')}
      bodyContent={
        <ShortcutTable>
          <Shortcut ctrl keyName="space">
            {t('Activate auto complete')}
          </Shortcut>
        </ShortcutTable>
      }
      maxWidth="25rem"
      distance={18}
    >
      <Button icon={<QuestionCircleIcon className="co-icon-space-r co-p-has-sidebar__sidebar-link-icon" />} type="button" variant="link" isInline>
        
        {t('View shortcuts')}
      </Button>
    </Popover>
  );
};

export default TaskSidebarShortcuts;
