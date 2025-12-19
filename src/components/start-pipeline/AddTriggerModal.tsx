import * as React from 'react';
import { Formik, FormikProps } from 'formik';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Form,
  Alert,
  Skeleton,
} from '@patternfly/react-core';
import { AddTriggerFormValues, PipelineKind } from '../../types';
import { convertPipelineToModalData } from './utils';
import { ModalComponent } from '@openshift-console/dynamic-plugin-sdk/lib/app/modal-support/ModalProvider';
import { useGetActiveUser, usePipelinePVC } from '../hooks/hooks';
import { TRIGGER_BINDING_EMPTY } from '../../consts';
import AddTriggerForm from './AddTriggerForm';
import { submitTrigger } from './submit-utils';
import { addTriggerSchema } from './validation-utils';

type AddTriggerModalProps = {
  pipeline: PipelineKind;
};

const AddTriggerModal: ModalComponent<AddTriggerModalProps> = ({
  pipeline,
  closeModal,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const currentUser = useGetActiveUser();
  const [pipelinePVC, pipelinePVCLoaded] = usePipelinePVC(
    pipeline.metadata?.name,
    pipeline.metadata?.namespace,
  );

  const initialValues: AddTriggerFormValues = React.useMemo(() => {
    if (!pipelinePVCLoaded) return;
    return {
      ...convertPipelineToModalData(pipeline, pipelinePVC?.metadata?.name),
      triggerBinding: {
        name: TRIGGER_BINDING_EMPTY,
        resource: null,
      },
    };
  }, [pipeline, pipelinePVC, pipelinePVCLoaded]);

  const handleSubmit = (values: AddTriggerFormValues, actions) => {
    return submitTrigger(pipeline, values, currentUser)
      .then(() => {
        closeModal();
      })
      .catch((error) => {
        actions.setStatus({
          submitError: error?.message || t('There was an unknown error'),
        });
      });
  };

  return (
    <Modal
      variant="large"
      isOpen
      onClose={closeModal}
      className="opp-start-pipeline-modal"
    >
      <ModalHeader title={t('Add Trigger')} />
      {pipelinePVCLoaded ? (
        <Formik
          initialValues={initialValues}
          onSubmit={handleSubmit}
          validationSchema={addTriggerSchema()}
        >
          {(formikProps: FormikProps<AddTriggerFormValues>) => (
            <>
              <ModalBody tabIndex={0}>
                <Form id="add-trigger-form" onSubmit={formikProps.handleSubmit}>
                  {formikProps.status?.submitError && (
                    <Alert
                      variant="danger"
                      isInline
                      title={formikProps.status.submitError}
                    />
                  )}

                  <AddTriggerForm {...formikProps} />
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
                  variant="primary"
                  type="submit"
                  form="add-trigger-form"
                  isDisabled={
                    !formikProps.isValid ||
                    formikProps.isSubmitting ||
                    Object.keys(formikProps.errors).length > 0
                  }
                  isLoading={formikProps.isSubmitting}
                >
                  {t('Add')}
                </Button>
              </ModalFooter>
            </>
          )}
        </Formik>
      ) : (
        <ModalBody>
          <Skeleton
            className="pf-v6-u-mb-md pf-v6-u-mt-xl"
            screenreaderText="Loading content"
          />
          <Skeleton
            className="pf-v6-u-mb-md"
            screenreaderText="Loading content"
          />
          <Skeleton
            className="pf-v6-u-mb-md"
            screenreaderText="Loading content"
          />
          <Skeleton
            className="pf-v6-u-mb-xl"
            screenreaderText="Loading content"
          />
        </ModalBody>
      )}
    </Modal>
  );
};

export default AddTriggerModal;
