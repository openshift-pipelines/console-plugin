import type { FC, Ref } from 'react';
import { useState } from 'react';
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
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import ResourceSidebarShortcuts from './ResourceSidebarShortcuts';
import PipelineResourceRef from '../../triggers-details/PipelineResourceRef';

import './ResourceSidebarHeader.scss';

type ResourceSidebarHeaderProps = {
  removeThisTask: () => void;
  resource: K8sResourceCommon;
};

const ResourceSidebarHeader: FC<ResourceSidebarHeaderProps> = ({
  removeThisTask,
  resource,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  const [isOpen, setIsOpen] = useState(false);

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
            resourceKind={resource.kind}
            resourceName={resource.metadata.name}
            largeIcon
            disableLink
          />
        </div>
        <div className="co-actions">
          <Dropdown
            isOpen={isOpen}
            onSelect={onSelect}
            onOpenChange={(isOpen: boolean) => setIsOpen(isOpen)}
            toggle={(toggleRef: Ref<MenuToggleElement>) => (
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
                {t('Remove')}
              </DropdownItem>
            </DropdownList>
          </Dropdown>
        </div>
      </Title>
      <div className="opp-task-sidebar-header__shortcuts clearfix">
        <ResourceSidebarShortcuts />
      </div>
      <Divider className="co-divider" />
    </div>
  );
};

export default ResourceSidebarHeader;
