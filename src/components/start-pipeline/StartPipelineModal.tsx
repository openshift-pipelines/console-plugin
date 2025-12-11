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
import StartPipelineForm from './StartPipelineForm';
import { submitStartPipeline } from './submit-utils';
import { StartPipelineFormValues } from './types';
import { useErrorModal } from '../modals/error-modal';
import { PipelineKind, PipelineRunKind } from '../../types';
import { startPipelineSchema } from './validation-utils';
import { convertPipelineToModalData } from './utils';
import {
  useGetActiveUser,
  usePipelinePVC,
  useUserAnnotationForManualStart,
} from '../hooks/hooks';
import { OverlayComponent } from '@openshift-console/dynamic-plugin-sdk';
import './StartPipelineModal.scss';

export interface StartPipelineModalProps {
  pipeline: PipelineKind;
  onSubmit?: (pipelineRun: PipelineRunKind) => void;
}
const StartPipelineModal: OverlayComponent<StartPipelineModalProps> = ({
  pipeline,
  closeOverlay,
  onSubmit,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const userStartedAnnotation = useUserAnnotationForManualStart();
  const currentUser = useGetActiveUser();
  const [pipelinePVC, pipelinePVCLoaded] = usePipelinePVC(
    pipeline.metadata?.name,
    pipeline.metadata?.namespace,
  );
  const errorModal = useErrorModal();

  const initialValues: StartPipelineFormValues = React.useMemo(() => {
    if (!pipelinePVCLoaded) return;
    return {
      ...convertPipelineToModalData(pipeline, pipelinePVC?.metadata?.name),
      secretOpen: false,
    };
  }, [pipeline, pipelinePVC, pipelinePVCLoaded]);

  const handleSubmit = (values: StartPipelineFormValues, actions) => {
    return submitStartPipeline(
      values,
      pipeline,
      currentUser,
      null,
      userStartedAnnotation,
    )
      .then((res) => {
        onSubmit && onSubmit(res);
        closeOverlay();
      })
      .catch((err) => {
        actions.setStatus({ submitError: err.message });
        errorModal({ error: err.message });
        closeOverlay();
      });
  };

  return (
    <Modal
      variant="large"
      isOpen
      onClose={closeOverlay}
      className="opp-start-pipeline-modal"
    >
      <ModalHeader title={t('Start Pipeline')} />
      {pipelinePVCLoaded ? (
        <Formik
          initialValues={initialValues}
          onSubmit={handleSubmit}
          validationSchema={startPipelineSchema()}
        >
          {(formikProps: FormikProps<StartPipelineFormValues>) => (
            <>
              <ModalBody tabIndex={0}>
                <Form
                  id="start-pipeline-form"
                  onSubmit={formikProps.handleSubmit}
                >
                  {formikProps.status?.submitError && (
                    <Alert
                      variant="danger"
                      isInline
                      title={formikProps.status.submitError}
                    />
                  )}

                  <StartPipelineForm {...formikProps} />
                </Form>
              </ModalBody>
              <ModalFooter>
                <Button
                  key="cancel"
                  variant="secondary"
                  onClick={closeOverlay}
                  isDisabled={formikProps.isSubmitting}
                >
                  {t('Cancel')}
                </Button>
                <Button
                  key="submit"
                  variant="primary"
                  type="submit"
                  form="start-pipeline-form"
                  isDisabled={
                    !formikProps.isValid ||
                    formikProps.isSubmitting ||
                    Object.keys(formikProps.errors).length > 0
                  }
                  isLoading={formikProps.isSubmitting}
                >
                  {t('Start')}
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

export default StartPipelineModal;
