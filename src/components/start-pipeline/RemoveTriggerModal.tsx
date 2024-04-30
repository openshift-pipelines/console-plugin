import * as React from 'react';
import { Formik, FormikHelpers } from 'formik';
import { useTranslation } from 'react-i18next';
import { ModalComponentProps, ModalWrapper } from '../modals/modal';
import { PipelineKind, RemoveTriggerFormValues } from '../../types';
import ModalStructure from '../modals/ModalStructure';
import RemoveTriggerForm from './RemoveTriggerForm';
import { ModalComponent } from '@openshift-console/dynamic-plugin-sdk/lib/app/modal-support/ModalProvider';
import { removeTrigger } from './remove-utils';
import { removeTriggerSchema } from './validation-utils';

type RemoveTriggerModalProps = ModalComponentProps & {
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
    <ModalWrapper
      className="modal-lg opp-start-pipeline-modal"
      onClose={closeModal}
    >
      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        validationSchema={removeTriggerSchema()}
      >
        {(formikProps) => (
          <ModalStructure
            {...formikProps}
            submitBtnText={t('Remove')}
            submitDanger
            title={t('Remove Trigger')}
            close={closeModal}
          >
            <RemoveTriggerForm pipeline={pipeline} />
          </ModalStructure>
        )}
      </Formik>
    </ModalWrapper>
  );
};

export default RemoveTriggerModal;
