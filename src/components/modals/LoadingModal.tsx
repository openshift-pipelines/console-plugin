import * as React from 'react';
import { ModalFooter, ModalWrapper } from './modal';
import { LoadingBox } from '../status/status-box';
import { ActionGroup, Button } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

type LoadingModalProps = {
  onClose: () => void;
};

const LoadingModal: React.FC<LoadingModalProps> = ({ onClose }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return (
    <ModalWrapper onClose={onClose}>
      <LoadingBox />
      <ModalFooter inProgress={false}>
        <ActionGroup className="pf-v6-c-form pf-v6-c-form__actions--right pf-v6-c-form__group--no-top-margin">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('Cancel')}
          </Button>
        </ActionGroup>
      </ModalFooter>
    </ModalWrapper>
  );
};

export default LoadingModal;
