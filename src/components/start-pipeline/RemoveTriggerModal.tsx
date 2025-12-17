import * as React from 'react';
import { Formik, FormikHelpers, FormikProps } from 'formik';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Form,
  Alert,
} from '@patternfly/react-core';
import { PipelineKind, RemoveTriggerFormValues } from '../../types';
import RemoveTriggerForm from './RemoveTriggerForm';
import { ModalComponent } from '@openshift-console/dynamic-plugin-sdk/lib/app/modal-support/ModalProvider';
import { removeTrigger } from './remove-utils';
import { removeTriggerSchema } from './validation-utils';

type RemoveTriggerModalProps = {
  pipeline: PipelineKind;
};

const RemoveTriggerModal: ModalComponent<RemoveTriggerModalProps> = ({
  pipeline,
  closeModal,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const initialValues: RemoveTriggerFormValues = {
    selectedTrigger: null,
  };

  const handleSubmit = (
    values: RemoveTriggerFormValues,
    actions: FormikHelpers<RemoveTriggerFormValues>,
  ) => {
    return removeTrigger(values, pipeline)
      .then(() => {
        closeModal();
      })
      .catch((e) => {
        actions.setStatus({ submitError: e.message });
      });
  };

  return (
    <Modal
      variant="large"
      isOpen
      onClose={closeModal}
      className="opp-start-pipeline-modal"
    >
      <ModalHeader title={t('Remove Trigger')} />
      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        validationSchema={removeTriggerSchema()}
      >
        {(formikProps: FormikProps<RemoveTriggerFormValues>) => (
          <>
            <ModalBody tabIndex={0}>
              <Form
                id="remove-trigger-form"
                onSubmit={formikProps.handleSubmit}
              >
                {formikProps.status?.submitError && (
                  <Alert
                    variant="danger"
                    isInline
                    title={formikProps.status.submitError}
                  />
                )}

                <RemoveTriggerForm pipeline={pipeline} />
              </Form>
            </ModalBody>
            <ModalFooter>
              <Button
                key="cancel"
                variant="secondary"
                onClick={closeModal}
                isDisabled={formikProps.isSubmitting}
              >
                {t('Cancel')}
              </Button>
              <Button
                key="submit"
                variant="danger"
                type="submit"
                form="remove-trigger-form"
                isDisabled={
                  !formikProps.isValid ||
                  formikProps.isSubmitting ||
                  Object.keys(formikProps.errors).length > 0
                }
                isLoading={formikProps.isSubmitting}
              >
                {t('Remove')}
              </Button>
            </ModalFooter>
          </>
        )}
      </Formik>
    </Modal>
  );
};

export default RemoveTriggerModal;
