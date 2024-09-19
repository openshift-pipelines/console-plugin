import * as React from 'react';
import { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import {
  ModalBody,
  ModalSubmitFooter,
  ModalTitle,
} from '../../../components/modals/modal';
import { Form, FormGroup, TextArea } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

import './ApprovalModal.scss';

export interface ApprovalModalProps {
  labelTitle: string;
  labelDescription?: JSX.Element;
  type: string;
  cancel?: any;
}

type Props = FormikProps<FormikValues> & ApprovalModalProps;

const ApprovalModal: React.FC<Props> = ({
  labelTitle,
  labelDescription,
  type,
  cancel,
  handleSubmit,
  isSubmitting,
  status,
  errors,
  values,
  setFieldValue,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const dirty = type === 'reject' && _.isEmpty(values.reason);
  return (
    <Form className="modal-content" onSubmit={handleSubmit}>
      <ModalTitle className="pipelines-approval-modal__title">
        {labelTitle}
      </ModalTitle>
      <ModalBody className="pipelines-approval-modal__content">
        {labelDescription}
        <FormGroup label={t('Reason')} fieldId="reason">
          <TextArea
            value={values.reason}
            className="pipelines-approval-modal__text-box"
            onChange={(_event, value) => {
              setFieldValue('reason', value);
            }}
            isRequired={type !== 'approve'}
            id="reason"
            name="reason"
          />
        </FormGroup>
      </ModalBody>
      <ModalSubmitFooter
        inProgress={isSubmitting}
        submitText={t('Submit')}
        cancelText={t('Cancel')}
        submitDisabled={dirty || !_.isEmpty(errors) || isSubmitting}
        buttonAlignment="left"
        cancel={cancel}
        errorMessage={status?.error}
        className="pipelines-approval-modal__footer"
      />
    </Form>
  );
};

export default ApprovalModal;
