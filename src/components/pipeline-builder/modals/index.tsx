import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import { t_chart_global_warning_color_100 as warningColor } from '@patternfly/react-tokens/dist/js/t_chart_global_warning_color_100';
import ModalContent from './ModalContent';
import { OverlayComponent } from '@openshift-console/dynamic-plugin-sdk';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  ModalVariant,
  ButtonVariant,
} from '@patternfly/react-core';

import './ModalContent.scss';

type ModalCallback = () => void;

type RemoveModalProps = {
  taskName: string;
  onRemove: ModalCallback;
};

const RemoveTaskModal: OverlayComponent<RemoveModalProps> = ({ taskName, closeOverlay, onRemove }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  const onSubmit = (e) => {
    onRemove();
    closeOverlay();
    e.preventDefault();
  };

  return (
    <Modal isOpen onClose={closeOverlay} variant={ModalVariant.small}>
      <ModalHeader title={t('Remove task')} />
        <ModalBody>
          <ModalContent
            icon={<ExclamationTriangleIcon color={warningColor.value} />}
            title={t('Remove {{taskName}}?', {
              taskName,
            })}
            message={t('Are you sure you want to remove {{taskName}}?', {
              taskName,
            })}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant={ButtonVariant.secondary} onClick={closeOverlay}>
            {t('Cancel')}
          </Button>
          <Button type="submit" variant={ButtonVariant.danger} onClick={onSubmit}>
            {t('Confirm')}
          </Button>
        </ModalFooter>
    </Modal>
  );
};

export default RemoveTaskModal;
