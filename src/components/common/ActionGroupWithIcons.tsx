import * as React from 'react';
import { ActionGroup, Button, ButtonVariant } from '@patternfly/react-core';
import { CheckIcon } from '@patternfly/react-icons/dist/esm/icons/check-icon';
import { TimesIcon } from '@patternfly/react-icons/dist/esm/icons/times-icon';

export interface ActionGroupWithIconsProps {
  onSubmit: () => void;
  onClose: () => void;
  isDisabled?: boolean;
}

const ActionGroupWithIcons: React.FC<ActionGroupWithIconsProps> = ({
  onSubmit,
  onClose,
  isDisabled,
}) => {
  return (
    <ActionGroup className="pf-v6-c-form pf-v6-c-form__actions--left">
      {onSubmit && (
        <Button
          className="pf-v6-u-p-0"
          type="submit"
          onClick={onSubmit}
          variant={ButtonVariant.plain}
          data-test-id="check-icon"
          isDisabled={isDisabled}
        >
          <CheckIcon />
        </Button>
      )}
      <Button
        className="pf-v6-u-p-0"
        variant={ButtonVariant.plain}
        data-test-id="close-icon"
        onClick={onClose}
      >
        <TimesIcon />
      </Button>
    </ActionGroup>
  );
};

export default ActionGroupWithIcons;
