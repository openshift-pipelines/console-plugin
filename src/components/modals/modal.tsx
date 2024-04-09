import * as classNames from 'classnames';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActionGroup,
  Button,
  Text,
  TextContent,
  TextVariants,
} from '@patternfly/react-core';
import { ButtonBar } from '../common/button-bar';
import CloseButton from './CloseButton';

export const ModalTitle: React.FC<ModalTitleProps> = ({
  children,
  className = 'modal-header',
  close,
}) => (
  <div className={className}>
    <TextContent>
      <Text component={TextVariants.h1} data-test-id="modal-title">
        {children}
        {close && (
          <CloseButton
            onClick={(e) => {
              e.stopPropagation();
              close(e);
            }}
            additionalClassName="co-close-button--float-right"
          />
        )}
      </Text>
    </TextContent>
  </div>
);

export const ModalBody: React.FC<ModalBodyProps> = ({ children }) => (
  <div className="modal-body">
    <div className="modal-body-content">{children}</div>
  </div>
);

export const ModalFooter: React.FC<ModalFooterProps> = ({
  message,
  errorMessage,
  inProgress,
  children,
}) => {
  return (
    <ButtonBar
      className="modal-footer"
      errorMessage={errorMessage}
      infoMessage={message}
      inProgress={inProgress}
    >
      {children}
    </ButtonBar>
  );
};

export const ModalSubmitFooter: React.FC<ModalSubmitFooterProps> = ({
  message,
  errorMessage,
  inProgress,
  cancel,
  submitText,
  cancelText,
  className,
  submitDisabled,
  submitDanger,
  buttonAlignment = 'right',
  resetText,
  reset,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const onCancelClick = (e) => {
    e.stopPropagation();
    cancel(e);
  };

  const onResetClick = (e) => {
    e.stopPropagation();
    reset(e);
  };

  const cancelButton = (
    <Button
      type="button"
      variant="secondary"
      data-test-id="modal-cancel-action"
      onClick={onCancelClick}
      aria-label={t('Cancel')}
    >
      {cancelText || t('Cancel')}
    </Button>
  );

  const submitButton = (
    <Button
      data-test="confirm-action"
      id="confirm-action"
      isDisabled={submitDisabled}
      type="submit"
      variant={submitDanger ? 'danger' : 'primary'}
    >
      {submitText || t('Submit')}
    </Button>
  );

  const resetButton = (
    <Button variant="link" isInline onClick={onResetClick} id="reset-action">
      {resetText || t('Reset')}
    </Button>
  );

  return (
    <ModalFooter
      inProgress={inProgress}
      errorMessage={errorMessage}
      message={message}
      className={className}
    >
      <ActionGroup
        className={classNames(
          { 'pf-v5-c-form__actions--right': buttonAlignment === 'right' },
          'pf-v5-c-form  pf-v5-c-form__group--no-top-margin',
        )}
      >
        {buttonAlignment === 'left' ? (
          <>
            {submitButton}
            {reset && resetButton}
            {cancelButton}
          </>
        ) : (
          <>
            {reset && resetButton}
            {cancelButton}
            {submitButton}
          </>
        )}
      </ActionGroup>
    </ModalFooter>
  );
};

export type ModalComponentProps = {
  cancel?: () => void;
  close?: () => void;
};

export type ModalTitleProps = {
  className?: string;
  close?: (e: React.SyntheticEvent<any, Event>) => void;
};

export type ModalBodyProps = {
  className?: string;
};

export type ModalFooterProps = {
  message?: string;
  errorMessage?: React.ReactNode;
  inProgress: boolean;
  className?: string;
};

export type ModalSubmitFooterProps = {
  message?: string;
  errorMessage?: string;
  inProgress: boolean;
  cancel: (e: React.SyntheticEvent<any, Event>) => void;
  cancelText?: React.ReactNode;
  className?: string;
  resetText?: React.ReactNode;
  reset?: (e: React.SyntheticEvent<any, Event>) => void;
  submitText: React.ReactNode;
  submitDisabled?: boolean;
  submitDanger?: boolean;
  buttonAlignment?: 'left' | 'right';
};
