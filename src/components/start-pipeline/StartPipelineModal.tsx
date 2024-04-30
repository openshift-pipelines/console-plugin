import * as React from 'react';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import StartPipelineForm from './StartPipelineForm';
import { submitStartPipeline } from './submit-utils';
import { StartPipelineFormValues } from './types';
import { ModalComponentProps, ModalWrapper } from '../modals/modal';
import { errorModal } from '../modals/error-modal';
import { PipelineKind, PipelineRunKind } from '../../types';
import ModalStructure from '../modals/ModalStructure';
import { startPipelineSchema } from './validation-utils';
import { convertPipelineToModalData } from './utils';
import {
  usePipelinePVC,
  useUserAnnotationForManualStart,
} from '../hooks/hooks';
import { ModalComponent } from '@openshift-console/dynamic-plugin-sdk/lib/app/modal-support/ModalProvider';
import { LoadingInline } from '../Loading';
import './StartPipelineModal.scss';

export interface StartPipelineModalProps {
  pipeline: PipelineKind;
  onSubmit?: (pipelineRun: PipelineRunKind) => void;
}
const StartPipelineModal: ModalComponent<
  StartPipelineModalProps & ModalComponentProps
> = ({ pipeline, closeModal, onSubmit }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const userStartedAnnotation = useUserAnnotationForManualStart();
  const [pipelinePVC, pipelinePVCLoaded] = usePipelinePVC(
    pipeline.metadata?.name,
    pipeline.metadata?.namespace,
  );

  if (!pipelinePVCLoaded) {
    return <LoadingInline />;
  }

  const initialValues: StartPipelineFormValues = {
    ...convertPipelineToModalData(pipeline, pipelinePVC?.metadata?.name),
    secretOpen: false,
  };

  const handleSubmit = (values: StartPipelineFormValues, actions) => {
    return submitStartPipeline(values, pipeline, null, userStartedAnnotation)
      .then((res) => {
        onSubmit && onSubmit(res);
        closeModal();
      })
      .catch((err) => {
        actions.setStatus({ submitError: err.message });
        errorModal({ error: err.message });
        closeModal();
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
        validationSchema={startPipelineSchema()}
      >
        {(formikProps) => (
          <ModalStructure
            submitBtnText={t('Start')}
            title={t('Start Pipeline')}
            close={closeModal}
            {...formikProps}
          >
            <StartPipelineForm {...formikProps} />
          </ModalStructure>
        )}
      </Formik>
    </ModalWrapper>
  );
};

export default StartPipelineModal;
