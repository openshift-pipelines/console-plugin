import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { k8sPatch } from '@openshift-console/dynamic-plugin-sdk';
import Approval from '../Approval';
import { ApprovalStatus, ApprovalTaskKind } from '../../../../types';
import { UserApprover } from '../../../../types/approver';

// Mock the k8sPatch function
jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  k8sPatch: jest.fn(),
  ResourceIcon: ({ kind }: { kind: string }) => (
    <span data-testid="resource-icon">{kind}</span>
  ),
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (options) {
        return key.replace(
          /\{\{(\w+)\}\}/g,
          (match, p1) => options[p1] || match,
        );
      }
      return key;
    },
  }),
}));

// Mock react-router-dom-v5-compat
jest.mock('react-router-dom-v5-compat', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

// Mock the models
jest.mock('../../../../models', () => ({
  ApprovalTaskModel: {
    apiVersion: 'openshift-pipelines.org/v1alpha1',
    kind: 'ApprovalTask',
    plural: 'approvaltasks',
  },
  PipelineRunModel: {
    apiVersion: 'tekton.dev/v1beta1',
    kind: 'PipelineRun',
    plural: 'pipelineruns',
  },
}));

// Mock the utils
jest.mock('../../../pipelines-overview/utils', () => ({
  getReferenceForModel: (model: any) => `${model.apiVersion}~${model.kind}`,
}));

// Mock the modal components
jest.mock('../../../modals/modal', () => ({
  ModalWrapper: ({
    children,
    onClose,
  }: {
    children: React.ReactNode;
    onClose: () => void;
  }) => (
    <div data-testid="modal-wrapper" onClick={onClose}>
      {children}
    </div>
  ),
}));

jest.mock('../ApprovalModal', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react');
  return {
    __esModule: true,
    default: ({
      handleSubmit,
      values,
      setFieldValue,
      labelTitle,
      type,
      cancel,
    }: any) => {
      // Set the reason value before submitting (only if not already set)
      React.useEffect(() => {
        if (!values.reason) {
          setFieldValue('reason', 'test reason');
        }
      }, [setFieldValue, values.reason]);

      return (
        <div data-testid="approval-modal">
          <h1>{labelTitle}</h1>
          <form onSubmit={handleSubmit}>
            <button data-testid="submit-btn" type="submit">
              Submit
            </button>
          </form>
          <button data-testid="cancel-btn" onClick={cancel}>
            Cancel
          </button>
          <span data-testid="approval-type">{type}</span>
        </div>
      );
    },
  };
});

const mockK8sPatch = k8sPatch as jest.MockedFunction<typeof k8sPatch>;

describe('Approval Component - handleSubmit function', () => {
  const mockCloseOverlay = jest.fn();

  const baseApprovalTask: ApprovalTaskKind = {
    apiVersion: 'openshift-pipelines.org/v1alpha1',
    kind: 'ApprovalTask',
    metadata: {
      name: 'example-approval-pr-mh34l5-wait',
      namespace: 'shverma',
      uid: 'e88950b9-a999-4f9b-a401-fbc6beb378bd',
    },
    spec: {
      approvers: [
        {
          input: ApprovalStatus.RequestSent,
          name: 'approver-user-1',
          type: 'User',
        },
        {
          input: ApprovalStatus.RequestSent,
          name: 'tester1',
          type: 'User',
        },
        {
          input: ApprovalStatus.RequestSent,
          name: 'test-apalit-group-1',
          type: 'Group',
          users: [
            {
              input: ApprovalStatus.RequestSent,
              name: 'tester2',
            },
          ],
        },
      ],
      description: 'Simple PR using ApprovalTask with 2 users and 1 group',
      numberOfApprovalsRequired: 2,
    },
    status: {
      state: ApprovalStatus.RequestSent,
      approvers: [],
    },
  };

  const mockCurrentUser = {
    username: 'tester2',
    groups: ['test-apalit-group-1', 'system:authenticated'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockK8sPatch.mockResolvedValue({});
    (global as any).lastSetStatusCall = null;
  });

  describe('User Approval Path', () => {
    it('should approve as direct user successfully', async () => {
      const userApprovalTask: ApprovalTaskKind = {
        ...baseApprovalTask,
        spec: {
          ...baseApprovalTask.spec,
          approvers: [
            {
              input: ApprovalStatus.RequestSent,
              name: 'tester2',
              type: 'User' as const,
            },
          ],
        },
      };

      const { getByTestId } = render(
        <Approval
          closeOverlay={mockCloseOverlay}
          resource={userApprovalTask}
          pipelineRunName="example-approval-pr-mh34l5"
          userName="tester2"
          currentUser={mockCurrentUser}
          type="approve"
        />,
      );

      const submitBtn = getByTestId('submit-btn');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockK8sPatch).toHaveBeenCalledWith({
          model: {
            apiVersion: 'openshift-pipelines.org/v1alpha1',
            kind: 'ApprovalTask',
            plural: 'approvaltasks',
          },
          resource: userApprovalTask,
          data: [
            {
              path: '/spec/approvers',
              op: 'replace',
              value: [
                {
                  input: ApprovalStatus.Accepted,
                  name: 'tester2',
                  type: 'User',
                  message: 'test reason',
                },
              ],
            },
          ],
        });
      });

      expect(mockCloseOverlay).toHaveBeenCalled();
    });

    it('should reject as direct user successfully', async () => {
      const userApprovalTask: ApprovalTaskKind = {
        ...baseApprovalTask,
        spec: {
          ...baseApprovalTask.spec,
          approvers: [
            {
              input: ApprovalStatus.RequestSent,
              name: 'tester2',
              type: 'User' as const,
            },
          ],
        },
      };

      const { getByTestId } = render(
        <Approval
          closeOverlay={mockCloseOverlay}
          resource={userApprovalTask}
          pipelineRunName="example-approval-pr-mh34l5"
          userName="tester2"
          currentUser={mockCurrentUser}
          type="reject"
        />,
      );

      const submitBtn = getByTestId('submit-btn');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockK8sPatch).toHaveBeenCalledWith({
          model: {
            apiVersion: 'openshift-pipelines.org/v1alpha1',
            kind: 'ApprovalTask',
            plural: 'approvaltasks',
          },
          resource: userApprovalTask,
          data: [
            {
              path: '/spec/approvers',
              op: 'replace',
              value: [
                {
                  input: ApprovalStatus.Rejected,
                  name: 'tester2',
                  type: 'User',
                  message: 'test reason',
                },
              ],
            },
          ],
        });
      });

      expect(mockCloseOverlay).toHaveBeenCalled();
    });
  });

  describe('Group Approval Path', () => {
    it('should approve as group member when user belongs to the group', async () => {
      const { getByTestId } = render(
        <Approval
          closeOverlay={mockCloseOverlay}
          resource={baseApprovalTask}
          pipelineRunName="example-approval-pr-mh34l5"
          userName="tester2"
          currentUser={mockCurrentUser}
          type="approve"
        />,
      );

      const submitBtn = getByTestId('submit-btn');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockK8sPatch).toHaveBeenCalledWith({
          model: {
            apiVersion: 'openshift-pipelines.org/v1alpha1',
            kind: 'ApprovalTask',
            plural: 'approvaltasks',
          },
          resource: baseApprovalTask,
          data: [
            {
              path: '/spec/approvers',
              op: 'replace',
              value: [
                {
                  input: ApprovalStatus.RequestSent,
                  name: 'approver-user-1',
                  type: 'User',
                },
                {
                  input: ApprovalStatus.RequestSent,
                  name: 'tester1',
                  type: 'User',
                },
                {
                  input: ApprovalStatus.Accepted,
                  name: 'test-apalit-group-1',
                  type: 'Group',
                  users: [
                    {
                      input: ApprovalStatus.Accepted,
                      name: 'tester2',
                      message: 'test reason',
                    },
                  ],
                  message: 'test reason',
                },
              ],
            },
          ],
        });
      });

      expect(mockCloseOverlay).toHaveBeenCalled();
    });

    it('should reject as group member when user belongs to the group', async () => {
      const { getByTestId } = render(
        <Approval
          closeOverlay={mockCloseOverlay}
          resource={baseApprovalTask}
          pipelineRunName="example-approval-pr-mh34l5"
          userName="tester2"
          currentUser={mockCurrentUser}
          type="reject"
        />,
      );

      const submitBtn = getByTestId('submit-btn');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockK8sPatch).toHaveBeenCalledWith({
          model: {
            apiVersion: 'openshift-pipelines.org/v1alpha1',
            kind: 'ApprovalTask',
            plural: 'approvaltasks',
          },
          resource: baseApprovalTask,
          data: [
            {
              path: '/spec/approvers',
              op: 'replace',
              value: [
                {
                  input: ApprovalStatus.RequestSent,
                  name: 'approver-user-1',
                  type: 'User',
                },
                {
                  input: ApprovalStatus.RequestSent,
                  name: 'tester1',
                  type: 'User',
                },
                {
                  input: ApprovalStatus.Rejected,
                  name: 'test-apalit-group-1',
                  type: 'Group',
                  users: [
                    {
                      input: ApprovalStatus.Rejected,
                      name: 'tester2',
                      message: 'test reason',
                    },
                  ],
                  message: 'test reason',
                },
              ],
            },
          ],
        });
      });

      expect(mockCloseOverlay).toHaveBeenCalled();
    });

    it('should add new user to group when user does not exist in group users array', async () => {
      const taskWithEmptyGroup: ApprovalTaskKind = {
        ...baseApprovalTask,
        spec: {
          ...baseApprovalTask.spec,
          approvers: [
            {
              input: ApprovalStatus.RequestSent,
              name: 'test-apalit-group-1',
              type: 'Group' as const,
              users: [] as UserApprover[], // Empty users array
            },
          ],
        },
      };

      const { getByTestId } = render(
        <Approval
          closeOverlay={mockCloseOverlay}
          resource={taskWithEmptyGroup}
          pipelineRunName="example-approval-pr-mh34l5"
          userName="tester2"
          currentUser={mockCurrentUser}
          type="approve"
        />,
      );

      const submitBtn = getByTestId('submit-btn');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockK8sPatch).toHaveBeenCalledWith({
          model: {
            apiVersion: 'openshift-pipelines.org/v1alpha1',
            kind: 'ApprovalTask',
            plural: 'approvaltasks',
          },
          resource: taskWithEmptyGroup,
          data: [
            {
              path: '/spec/approvers',
              op: 'replace',
              value: [
                {
                  input: ApprovalStatus.Accepted,
                  name: 'test-apalit-group-1',
                  type: 'Group',
                  users: [
                    {
                      input: ApprovalStatus.Accepted,
                      name: 'tester2',
                      message: 'test reason',
                    },
                  ],
                  message: 'test reason',
                },
              ],
            },
          ],
        });
      });

      expect(mockCloseOverlay).toHaveBeenCalled();
    });

    it('should update existing user in group when user already exists', async () => {
      const taskWithExistingUser: ApprovalTaskKind = {
        ...baseApprovalTask,
        spec: {
          ...baseApprovalTask.spec,
          approvers: [
            {
              input: ApprovalStatus.RequestSent,
              name: 'test-apalit-group-1',
              type: 'Group' as const,
              users: [
                {
                  input: ApprovalStatus.RequestSent,
                  name: 'tester2',
                },
                {
                  input: 'approve' as const,
                  name: 'other-user',
                },
              ],
            },
          ],
        },
      };

      const { getByTestId } = render(
        <Approval
          closeOverlay={mockCloseOverlay}
          resource={taskWithExistingUser}
          pipelineRunName="example-approval-pr-mh34l5"
          userName="tester2"
          currentUser={mockCurrentUser}
          type="approve"
        />,
      );

      const submitBtn = getByTestId('submit-btn');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockK8sPatch).toHaveBeenCalledWith({
          model: {
            apiVersion: 'openshift-pipelines.org/v1alpha1',
            kind: 'ApprovalTask',
            plural: 'approvaltasks',
          },
          resource: taskWithExistingUser,
          data: [
            {
              path: '/spec/approvers',
              op: 'replace',
              value: [
                {
                  input: ApprovalStatus.Accepted,
                  name: 'test-apalit-group-1',
                  type: 'Group',
                  users: [
                    {
                      input: ApprovalStatus.Accepted,
                      name: 'tester2',
                      message: 'test reason',
                    },
                    {
                      input: ApprovalStatus.Accepted,
                      name: 'other-user',
                    },
                  ],
                  message: 'test reason',
                },
              ],
            },
          ],
        });
      });

      expect(mockCloseOverlay).toHaveBeenCalled();
    });

    it('should not update group when user does not belong to the group', async () => {
      const userNotInGroup = {
        username: 'tester3',
        groups: ['different-group'],
      };

      const { getByTestId } = render(
        <Approval
          closeOverlay={mockCloseOverlay}
          resource={baseApprovalTask}
          pipelineRunName="example-approval-pr-mh34l5"
          userName="tester3"
          currentUser={userNotInGroup}
          type="approve"
        />,
      );

      const submitBtn = getByTestId('submit-btn');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockK8sPatch).toHaveBeenCalledWith({
          model: {
            apiVersion: 'openshift-pipelines.org/v1alpha1',
            kind: 'ApprovalTask',
            plural: 'approvaltasks',
          },
          resource: baseApprovalTask,
          data: [
            {
              path: '/spec/approvers',
              op: 'replace',
              value: baseApprovalTask.spec.approvers, // Should remain unchanged
            },
          ],
        });
      });

      expect(mockCloseOverlay).toHaveBeenCalled();
    });

    it('should handle group with undefined users array', async () => {
      const taskWithUndefinedUsers: ApprovalTaskKind = {
        ...baseApprovalTask,
        spec: {
          ...baseApprovalTask.spec,
          approvers: [
            {
              input: ApprovalStatus.RequestSent,
              name: 'test-apalit-group-1',
              type: 'Group' as const,
              // users property is undefined
            },
          ],
        },
      };

      const { getByTestId } = render(
        <Approval
          closeOverlay={mockCloseOverlay}
          resource={taskWithUndefinedUsers}
          pipelineRunName="example-approval-pr-mh34l5"
          userName="tester2"
          currentUser={mockCurrentUser}
          type="approve"
        />,
      );

      const submitBtn = getByTestId('submit-btn');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockK8sPatch).toHaveBeenCalledWith({
          model: {
            apiVersion: 'openshift-pipelines.org/v1alpha1',
            kind: 'ApprovalTask',
            plural: 'approvaltasks',
          },
          resource: taskWithUndefinedUsers,
          data: [
            {
              path: '/spec/approvers',
              op: 'replace',
              value: [
                {
                  input: ApprovalStatus.Accepted,
                  name: 'test-apalit-group-1',
                  type: 'Group',
                  users: [
                    {
                      input: ApprovalStatus.Accepted,
                      name: 'tester2',
                      message: 'test reason',
                    },
                  ],
                  message: 'test reason',
                },
              ],
            },
          ],
        });
      });

      expect(mockCloseOverlay).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle user with undefined groups', async () => {
      const userWithoutGroups = {
        username: 'tester2',
        // groups property is undefined
      };

      const { getByTestId } = render(
        <Approval
          closeOverlay={mockCloseOverlay}
          resource={baseApprovalTask}
          pipelineRunName="example-approval-pr-mh34l5"
          userName="tester2"
          currentUser={userWithoutGroups}
          type="approve"
        />,
      );

      const submitBtn = getByTestId('submit-btn');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockK8sPatch).toHaveBeenCalledWith({
          model: {
            apiVersion: 'openshift-pipelines.org/v1alpha1',
            kind: 'ApprovalTask',
            plural: 'approvaltasks',
          },
          resource: baseApprovalTask,
          data: [
            {
              path: '/spec/approvers',
              op: 'replace',
              value: baseApprovalTask.spec.approvers, // Should remain unchanged
            },
          ],
        });
      });

      expect(mockCloseOverlay).toHaveBeenCalled();
    });
  });
});
