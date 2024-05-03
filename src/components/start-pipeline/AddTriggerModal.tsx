import * as React from 'react';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { AddTriggerFormValues, PipelineKind } from '../../types';
import { ModalComponentProps, ModalWrapper } from '../modals/modal';
import { convertPipelineToModalData } from './utils';
import ModalStructure from '../modals/ModalStructure';
import { ModalComponent } from '@openshift-console/dynamic-plugin-sdk/lib/app/modal-support/ModalProvider';
import { usePipelinePVC } from '../hooks/hooks';
import { TRIGGER_BINDING_EMPTY } from '../../consts';
import AddTriggerForm from './AddTriggerForm';
import { submitTrigger } from './submit-utils';
import { addTriggerSchema } from './validation-utils';
import LoadingModal from '../modals/LoadingModal';

type AddTriggerModalProps = ModalComponentProps & {
  pipeline: PipelineKind;
};

const AddTriggerModal: ModalComponent<AddTriggerModalProps> = ({
  pipeline,
  closeModal,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [pipelinePVC, pipelinePVCLoaded] = usePipelinePVC(
    pipeline.metadata?.name,
    pipeline.metadata?.namespace,
  );

  if (!pipelinePVCLoaded) {
    return <LoadingModal onClose={closeModal} />;
  }
  const initialValues: AddTriggerFormValues = {
    ...convertPipelineToModalData(pipeline, pipelinePVC?.metadata?.name),
    triggerBinding: {
      name: TRIGGER_BINDING_EMPTY,
      resource: null,
    },
  };

  const handleSubmit = (values: AddTriggerFormValues, actions) => {
    return submitTrigger(pipeline, values)
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
    <ModalWrapper
      className="modal-lg opp-start-pipeline-modal"
      onClose={closeModal}
    >
      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        validationSchema={addTriggerSchema()}
      >
        {(formikProps) => (
          <ModalStructure
            submitBtnText={t('Add')}
            title={t('Add Trigger')}
            close={closeModal}
            {...formikProps}
          >
            <AddTriggerForm {...formikProps} />
          </ModalStructure>
        )}
      </Formik>
    </ModalWrapper>
  );
};

export default AddTriggerModal;
