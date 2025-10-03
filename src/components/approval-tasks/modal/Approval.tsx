import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Formik, FormikValues, FormikHelpers } from 'formik';
import { Link } from 'react-router-dom-v5-compat';
import {
  ResourceIcon,
  UserInfo,
  k8sPatch,
} from '@openshift-console/dynamic-plugin-sdk';
import { ApprovalTaskModel, PipelineRunModel } from '../../../models';
import { getReferenceForModel } from '../../pipelines-overview/utils';
import { ApprovalStatus, ApprovalTaskKind } from '../../../types';
import { ModalComponent } from '@openshift-console/dynamic-plugin-sdk/lib/app/modal-support/ModalProvider';
import { ModalWrapper } from '../../modals/modal';
import ApprovalModal from './ApprovalModal';

import './ApprovalModal.scss';
import { Approver, UserApprover } from 'src/types/approver';

type ApprovalProps = {
  resource: ApprovalTaskKind;
  pipelineRunName?: string;
  userName?: string;
  currentUser: UserInfo;
  type: string;
};

const Approval: ModalComponent<ApprovalProps> = ({
  closeModal,
  resource,
  pipelineRunName,
  userName,
  currentUser,
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

  const individualUser = (approverDetails: Approver[], userName: string) => {
    return approverDetails.some(
      (approver) => approver.name === userName && approver.type === 'User',
    );
  };

  const handleSubmit = (
    values: FormikValues,
    action: FormikHelpers<FormikValues>,
  ) => {
    const updatedApprovers = approvers.map((approver) => {
      // Update approver for User type
      if (approver.name === userName && approver.type === 'User') {
        return {
          ...approver,
          input:
            type === 'approve'
              ? ApprovalStatus.Accepted
              : ApprovalStatus.Rejected,
          ...(values.reason && { message: values.reason }),
        };
      } else if (
        // Update approver for Group type
        approver.type === 'Group' &&
        !individualUser(approvers, userName)
      ) {
        // Check if the current user belongs to this specific group
        const userBelongsToThisGroup = currentUser.groups?.includes(
          approver.name,
        );

        if (userBelongsToThisGroup) {
          const newUser: UserApprover = {
            name: userName,
            input:
              type === 'approve'
                ? ApprovalStatus.Accepted
                : ApprovalStatus.Rejected,
            ...(values.reason && { message: values.reason }),
          };

          // check if current user already exists in this group's users array
          const userExists = approver.users?.some(
            (user) => user.name === userName,
          );

          let updatedUsers = approver.users || [];

          if (userExists) {
            // Update existing user's input
            updatedUsers =
              approver.users?.map((item) => {
                if (item.name === userName) {
                  return {
                    ...item,
                    input: newUser.input,
                    ...(newUser.message && { message: newUser.message }),
                  };
                }
                return item;
              }) || [];
          } else {
            // Add new user to the group
            updatedUsers = [...updatedUsers, newUser];
          }

          // Only update this specific group approver
          return {
            ...approver,
            users: updatedUsers,
            input:
              type === 'approve'
                ? ApprovalStatus.Accepted
                : ApprovalStatus.Rejected,
            ...(values.reason && { message: values.reason }),
          };
        }
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

  const approvalMessage =
    type === 'approve'
      ? t('Are you sure you want to approve')
      : t('Please provide a reason for not approving');

  const approvalEnding = type === 'approve' ? '?' : '.';

  const labelDescription = (
    <p>
      {approvalMessage}{' '}
      <ResourceIcon kind={getReferenceForModel(ApprovalTaskModel)} />
      <Link
        to={`/k8s/ns/${namespace}/${getReferenceForModel(
          ApprovalTaskModel,
        )}/${name}`}
      >
        {name}
      </Link>{' '}
      {t('in')} <br />
      <ResourceIcon kind={getReferenceForModel(PipelineRunModel)} />
      <Link
        to={`/k8s/ns/${namespace}/${getReferenceForModel(
          PipelineRunModel,
        )}/${pipelineRunName}`}
      >
        {pipelineRunName}
      </Link>
      {approvalEnding}
    </p>
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
