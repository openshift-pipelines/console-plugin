import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Formik, FormikValues, FormikHelpers } from 'formik';
import { Link } from 'react-router-dom-v5-compat';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Form,
  FormGroup,
  TextArea,
  Alert,
} from '@patternfly/react-core';
import {
  ResourceIcon,
  UserInfo,
  k8sPatch,
  OverlayComponent,
} from '@openshift-console/dynamic-plugin-sdk';
import { ApprovalTaskModel, PipelineRunModel } from '../../../models';
import { getReferenceForModel } from '../../pipelines-overview/utils';
import { ApprovalStatus, ApprovalTaskKind } from '../../../types';
import { Approver, UserApprover } from 'src/types/approver';

import './ApprovalModal.scss';

type ApprovalProps = {
  resource: ApprovalTaskKind;
  pipelineRunName?: string;
  userName?: string;
  currentUser: UserInfo;
  type: string;
};

const Approval: OverlayComponent<ApprovalProps> = ({
  closeOverlay,
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
        closeOverlay();
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

  const approvalEnding = type === 'approve' ? ' ?' : '.';

  const labelDescription = (
    <div className="pf-v6-l-flex pf-m-col-gap-xs pf-v6-u-flex-wrap pf-v6-u-align-items-center pf-v6-u-mb-sm">
      <span>{approvalMessage}</span>
      <span>
        <ResourceIcon
          className="pf-v6-u-mr-sm"
          groupVersionKind={{
            group: ApprovalTaskModel.apiGroup,
            version: ApprovalTaskModel.apiVersion,
            kind: ApprovalTaskModel.kind,
          }}
        />
        <Link
          to={`/k8s/ns/${namespace}/${getReferenceForModel(
            ApprovalTaskModel,
          )}/${name}`}
        >
          {name}
        </Link>
      </span>
      <span>{t('in')}</span>
      <span>
        <ResourceIcon
          className="pf-v6-u-mr-sm"
          groupVersionKind={{
            group: PipelineRunModel.apiGroup,
            version: PipelineRunModel.apiVersion,
            kind: PipelineRunModel.kind,
          }}
        />
        <Link
          to={`/k8s/ns/${namespace}/${getReferenceForModel(
            PipelineRunModel,
          )}/${pipelineRunName}`}
        >
          {pipelineRunName}
        </Link>
      </span>
      {approvalEnding}
    </div>
  );
  return (
    <Modal
      variant="small"
      isOpen
      onClose={closeOverlay}
      className="pipelines-approval-modal"
    >
      <ModalHeader
        title={labelTitle}
        className="pipelines-approval-modal__title"
      />
      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onReset={closeOverlay}
        initialStatus={{ error: '' }}
      >
        {(formikProps) => {
          const dirty = type === 'reject' && !formikProps.values.reason?.trim();
          return (
            <Form onSubmit={formikProps.handleSubmit}>
              <ModalBody className="pipelines-approval-modal__content">
                {labelDescription}
                {formikProps.status?.error && (
                  <Alert
                    variant="danger"
                    isInline
                    title={formikProps.status.error}
                  />
                )}
                <FormGroup label={t('Reason')} fieldId="reason">
                  <TextArea
                    value={formikProps.values.reason}
                    className="pipelines-approval-modal__text-box"
                    onChange={(_event, value) => {
                      formikProps.setFieldValue('reason', value);
                    }}
                    isRequired={type !== 'approve'}
                    id="reason"
                    name="reason"
                  />
                </FormGroup>
              </ModalBody>
              <ModalFooter className="pipelines-approval-modal__footer">
                <Button
                  key="submit"
                  variant="primary"
                  type="submit"
                  data-testid="submit-btn"
                  isDisabled={
                    dirty ||
                    !formikProps.isValid ||
                    formikProps.isSubmitting ||
                    Object.keys(formikProps.errors).length > 0
                  }
                  isLoading={formikProps.isSubmitting}
                >
                  {t('Submit')}
                </Button>
                <Button
                  key="cancel"
                  variant="secondary"
                  data-testid="cancel-btn"
                  onClick={closeOverlay}
                  isDisabled={formikProps.isSubmitting}
                >
                  {t('Cancel')}
                </Button>
              </ModalFooter>
            </Form>
          );
        }}
      </Formik>
    </Modal>
  );
};

export default Approval;
