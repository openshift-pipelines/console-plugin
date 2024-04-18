import * as React from 'react';
import { PipelineKind } from '../../types';
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import { EllipsisVIcon } from '@patternfly/react-icons';
import { KEBAB_BUTTON_ID } from '../../consts';
import { useTranslation } from 'react-i18next';
import {
  useAccessReview,
  useModal,
} from '@openshift-console/dynamic-plugin-sdk';
import { PipelineRunModel } from '../../models';
import _ from 'lodash';
import { startPipelineModal } from '../start-pipeline';

type PipelineKebabProps = {
  pipeline: PipelineKind;
};

const PipelineKebab: React.FC<PipelineKebabProps> = ({ pipeline }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { name, namespace } = pipeline.metadata;
  const launchModal = useModal();
  const [isOpen, setIsOpen] = React.useState(false);
  const onToggle = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = () => {
    setIsOpen(false);
  };

  const canCreateResource = useAccessReview({
    group: PipelineRunModel.apiGroup,
    resource: PipelineRunModel.plural,
    verb: 'create',
    name,
    namespace,
  });

  const startPipeline = () => {
    const params = _.get(pipeline, ['spec', 'params'], []);
    const resources = _.get(pipeline, ['spec', 'resources'], []);
    const workspaces = _.get(pipeline, ['spec', 'workspaces'], []);

    if (!_.isEmpty(params) || !_.isEmpty(resources) || !_.isEmpty(workspaces)) {
      launchModal(startPipelineModal, { pipeline });
    } //else {
    //   triggerPipeline(pipeline, onSubmit);
    // }
  };

  const dropdownItems = [
    <DropdownItem
      key="start-pipeline"
      component="button"
      isDisabled={!canCreateResource}
      data-test-action="start-pipeline"
      onClick={startPipeline}
    >
      {t('Start')}
    </DropdownItem>,
  ];
  return (
    <Dropdown
      onSelect={onSelect}
      onOpenChange={(isOpen: boolean) => setIsOpen(isOpen)}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          aria-label="kebab menu"
          variant="plain"
          onClick={onToggle}
          isExpanded={isOpen}
          id={KEBAB_BUTTON_ID}
          data-test={KEBAB_BUTTON_ID}
        >
          <EllipsisVIcon />
        </MenuToggle>
      )}
      isOpen={isOpen}
      isPlain={false}
      popperProps={{ position: 'right' }}
    >
      <DropdownList>{dropdownItems}</DropdownList>
    </Dropdown>
  );
};

export default PipelineKebab;
