import * as React from 'react';
import { Button, Modal, ModalHeader, ModalVariant, ModalBody, ModalFooter } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { OverlayComponent } from '@openshift-console/dynamic-plugin-sdk';

import { useOverlay } from '@openshift-console/dynamic-plugin-sdk';

export const ModalErrorContent : OverlayComponent<ErrorModalProps> = (props) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { error, title, closeOverlay } = props;
  const titleText = title || t('Error');
  return (
    <Modal isOpen onClose={closeOverlay} variant={ModalVariant.small}>
      <ModalHeader title={titleText} titleIconVariant="warning"/>
      <ModalBody>{error}</ModalBody>
      <ModalFooter>
        <Button type="button" variant="primary" onClick={closeOverlay}>
          {t('OK')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export const useErrorModal = () => {
  const launchOverlay = useOverlay();
  return React.useCallback((props: ErrorModalProps) => launchOverlay<ErrorModalProps>(ModalErrorContent, props)
  , [launchOverlay]);
};

export type ErrorModalProps = {
  error: string;
  title?: string;
  cancel?: () => void;
};
