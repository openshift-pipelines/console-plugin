import * as React from 'react';
import {
  Divider,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
  Title,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { TaskKind } from '../../../types';
import TaskSidebarShortcuts from './TaskSidebarShortcuts';
import PipelineResourceRef from '../../triggers-details/PipelineResourceRef';

import './TaskSidebarHeader.scss';

type TaskSidebarHeaderProps = {
  removeThisTask: () => void;
  taskResource: TaskKind;
};

const TaskSidebarHeader: React.FC<TaskSidebarHeaderProps> = ({
  removeThisTask,
  taskResource,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  const [isOpen, setIsOpen] = React.useState(false);

  const onToggleClick = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = () => {
    setIsOpen(false);
  };

  return (
    <div className="opp-task-sidebar-header">
      <Title headingLevel="h2" className="opp-task-sidebar-header__title">
        <div className="co-m-pane__name co-resource-item">
          <PipelineResourceRef
            resourceKind={taskResource.kind}
            resourceName={taskResource.metadata.name}
            largeIcon
            disableLink
          />
        </div>
        <div className="co-actions">
          <Dropdown
            isOpen={isOpen}
            onSelect={onSelect}
            onOpenChange={(isOpen: boolean) => setIsOpen(isOpen)}
            toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
              <MenuToggle
                ref={toggleRef}
                onClick={onToggleClick}
                isExpanded={isOpen}
              >
                {t('Actions')}
              </MenuToggle>
            )}
          >
            <DropdownList>
              <DropdownItem key="remove-task" onClick={() => removeThisTask()}>
                {t('Remove task')}
              </DropdownItem>
            </DropdownList>
          </Dropdown>
        </div>
      </Title>
      <div className="opp-task-sidebar-header__shortcuts clearfix">
        <TaskSidebarShortcuts />
      </div>
      <Divider className="co-divider" />
    </div>
  );
};

export default TaskSidebarHeader;
