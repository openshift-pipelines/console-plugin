import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Formik, FormikValues, FormikHelpers } from 'formik';
import { Link } from 'react-router-dom-v5-compat';
import { ResourceIcon, k8sPatch } from '@openshift-console/dynamic-plugin-sdk';
import { ApprovalTaskModel, PipelineRunModel } from '../../../models';
import { getReferenceForModel } from '../../pipelines-overview/utils';
import { ApprovalStatus, ApprovalTaskKind } from '../../../types';
import { ModalComponent } from '@openshift-console/dynamic-plugin-sdk/lib/app/modal-support/ModalProvider';
import { ModalWrapper } from '../../modals/modal';
import ApprovalModal from './ApprovalModal';

import './ApprovalModal.scss';

type ApprovalProps = {
  resource: ApprovalTaskKind;
  pipelineRunName?: string;
  userName?: string;
  type: string;
};

const Approval: ModalComponent<ApprovalProps> = ({
  closeModal,
  resource,
  pipelineRunName,
  userName,
  type,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const {
    metadata: { name, namespace },
    spec: { approvers },
  } = resource;

  const initialValues = {
    reason: '',
  };

  const handleSubmit = (
    values: FormikValues,
    action: FormikHelpers<FormikValues>,
  ) => {
    const updatedApprovers = approvers.map((approver) => {
      if (approver.name === userName) {
        return {
          ...approver,
          input:
            type === 'approve'
              ? ApprovalStatus.Accepted
              : ApprovalStatus.Rejected,
          ...(values.reason && { message: values.reason }),
        };
      }
      return approver;
    });
    return k8sPatch({
      model: ApprovalTaskModel,
      resource,
      data: [
        {
          path: '/spec/approvers',
          op: 'replace',
          value: updatedApprovers,
        },
      ],
    })
      .then(() => {
        closeModal();
      })
      .catch((err) => {
        const errMessage =
          err.message || t('An error occurred. Please try again');
        action.setStatus({
          error: errMessage,
        });
      });
  };

  const labelTitle = type === 'approve' ? t('Approve') : t('Reject');

  const labelDescription = (
    <Trans t={t} ns="plugin__pipelines-console-plugin">
      <p>
        {type === 'approve'
          ? 'Are you sure you want to approve'
          : 'Please provide a reason for not approving'}{' '}
        <ResourceIcon kind={getReferenceForModel(ApprovalTaskModel)} />
        <Link
          to={`/k8s/ns/${namespace}/${getReferenceForModel(
            ApprovalTaskModel,
          )}/${name}`}
        >
          {name}
        </Link>{' '}
        {'in'} <br />
        <ResourceIcon kind={getReferenceForModel(PipelineRunModel)} />
        <Link
          to={`/k8s/ns/${namespace}/${getReferenceForModel(
            PipelineRunModel,
          )}/${pipelineRunName}`}
        >
          {pipelineRunName}
        </Link>
        {type === 'approve' ? '?' : '.'}
      </p>
    </Trans>
  );
  return (
    <ModalWrapper className="pipelines-approval-modal" onClose={closeModal}>
      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onReset={closeModal}
        initialStatus={{ error: '' }}
      >
        {(formikProps) => (
          <ApprovalModal
            {...formikProps}
            labelTitle={labelTitle}
            labelDescription={labelDescription}
            type={type}
            cancel={closeModal}
          />
        )}
      </Formik>
    </ModalWrapper>
  );
};

export default Approval;
