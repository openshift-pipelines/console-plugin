import * as React from 'react';
import { ActionGroup, Button } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { YellowExclamationTriangleIcon } from '@openshift-console/dynamic-plugin-sdk';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalFooter,
  ModalTitle,
} from './modal';
import { HandlePromiseProps, withHandlePromise } from './promise-component';

export const ModalErrorContent = withHandlePromise<ErrorModalProps>((props) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { error, title, cancel } = props;
  const titleText = title || t('Error');
  return (
    <div className="modal-content">
      <ModalTitle>
        <YellowExclamationTriangleIcon className="co-icon-space-r" />{' '}
        {titleText}
      </ModalTitle>
      <ModalBody>{error}</ModalBody>
      <ModalFooter inProgress={false} errorMessage="">
        <ActionGroup className="pf-v6-c-form pf-v6-c-form__actions--right pf-v6-c-form__group--no-top-margin">
          <Button type="button" variant="primary" onClick={cancel}>
            {t('OK')}
          </Button>
        </ActionGroup>
      </ModalFooter>
    </div>
  );
});

export const errorModal = createModalLauncher(ModalErrorContent);

export type ErrorModalProps = {
  error: string;
  title?: string;
} & ModalComponentProps &
  HandlePromiseProps;
