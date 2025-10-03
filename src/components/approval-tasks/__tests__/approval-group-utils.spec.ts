import { k8sGet } from '@openshift-console/dynamic-plugin-sdk';
import {
  GroupKind,
  isUserAuthorizedForApproval,
} from '../../utils/approval-group-utils';

// Mock the k8sGet function
jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  k8sGet: jest.fn(),
}));

const mockK8sGet = k8sGet as jest.MockedFunction<typeof k8sGet>;

// Mock Group data reflecting real API structure
const createMockGroup = (name: string, users: string[]): GroupKind => ({
  metadata: {
    name,
  },
  users,
});

describe('approval-group-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isUserAuthorizedForApproval', () => {
    it('should authorize user with direct assignment', async () => {
      const mockCallback = jest.fn();
      const approvers = [
        {
          input: 'pending' as any,
          name: 'approver-user-1',
          type: 'User' as const,
        },
        {
          input: 'pending' as any,
          name: 'approver-user-4',
          type: 'User' as const,
        },
        {
          input: 'pending' as any,
          name: 'test-apalit-group-1',
          type: 'Group' as const,
        },
      ];
      const result = await isUserAuthorizedForApproval(
        'approver-user-1',
        approvers,
        { username: 'approver-user-1', groups: [] } as any,
        mockCallback,
      );
      expect(result).toBe(true);
      // Should not call k8sGet for direct user assignment
      expect(mockK8sGet).not.toHaveBeenCalled();
      // Should not call callback for direct user assignment
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should authorize user through group membership via k8s API', async () => {
      const mockCallback = jest.fn();
      const userInfo = { username: 'tester3', groups: [] } as any;
      mockK8sGet.mockResolvedValue(
        createMockGroup('test-apalit-group-2', [
          'approver-user-3',
          'tester3',
          'tester4',
        ]),
      );

      const approvers = [
        {
          input: 'pending' as any,
          name: 'test-apalit-group-2',
          type: 'Group' as const,
        },
      ];
      const result = await isUserAuthorizedForApproval(
        'tester3',
        approvers,
        userInfo,
        mockCallback,
      );

      expect(result).toBe(true);
      expect(mockK8sGet).toHaveBeenCalledWith({
        model: expect.objectContaining({
          kind: 'Group',
          plural: 'groups',
        }),
        name: 'test-apalit-group-2',
      });
      // Should call callback to update user groups
      expect(mockCallback).toHaveBeenCalledWith({
        username: 'tester3',
        groups: ['test-apalit-group-2'],
      });
    });

    it('should authorize user through group membership via UserInfo.groups', async () => {
      const mockCallback = jest.fn();
      const approvers = [
        {
          input: 'pending' as any,
          name: 'test-apalit-group-1',
          type: 'Group' as const,
        },
      ];
      const result = await isUserAuthorizedForApproval(
        'approver-user-1',
        approvers,
        {
          username: 'approver-user-1',
          groups: ['test-apalit-group-1', 'test-apalit-group-3'],
        } as any,
        mockCallback,
      );

      expect(result).toBe(true);
      // Should not call k8sGet when group is in UserInfo.groups
      expect(mockK8sGet).not.toHaveBeenCalled();
      // Should not call callback when group already in UserInfo.groups
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should deny user not in group', async () => {
      const mockCallback = jest.fn();
      mockK8sGet.mockResolvedValue(
        createMockGroup('test-apalit-group-2', [
          'approver-user-3',
          'tester3',
          'tester4',
        ]),
      );

      const approvers = [
        {
          input: 'pending' as any,
          name: 'test-apalit-group-2',
          type: 'Group' as const,
        },
      ];
      const result = await isUserAuthorizedForApproval(
        'unauthorized-user',
        approvers,
        { username: 'unauthorized-user', groups: [] } as any,
        mockCallback,
      );

      expect(result).toBe(false);
      // Should not call callback when user is not in group
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should handle group fetch errors gracefully', async () => {
      const mockCallback = jest.fn();
      mockK8sGet.mockRejectedValue(new Error('Group not found'));

      const approvers = [
        {
          input: 'pending' as any,
          name: 'non-existent-group',
          type: 'Group' as const,
        },
      ];
      const result = await isUserAuthorizedForApproval(
        'approver-user-1',
        approvers,
        { username: 'approver-user-1', groups: [] } as any,
        mockCallback,
      );

      expect(result).toBe(false);
      // Should not call callback when group fetch fails
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should work with mixed User and Group approvers from real ApprovalTask', async () => {
      const mockCallback = jest.fn();
      const userInfo = { username: 'tester3', groups: [] } as any;
      // Simulate multiple groups with different users
      mockK8sGet
        .mockResolvedValueOnce(
          createMockGroup('test-apalit-group-1', ['user1', 'user2']),
        )
        .mockResolvedValueOnce(
          createMockGroup('test-apalit-group-2', [
            'approver-user-3',
            'tester3',
            'tester4',
          ]),
        );

      const approvers = [
        {
          input: 'pending' as any,
          name: 'test-apalit-group-1',
          type: 'Group' as const,
        },
        {
          input: 'pending' as any,
          name: 'test-apalit-group-2',
          type: 'Group' as const,
        },
        {
          input: 'pending' as any,
          name: 'approver-user-1',
          type: 'User' as const,
        },
        {
          input: 'reject' as any,
          name: 'approver-user-4',
          type: 'User' as const,
          message: 'this is a reject',
        },
      ];

      const result = await isUserAuthorizedForApproval(
        'tester3',
        approvers,
        userInfo,
        mockCallback,
      );

      expect(result).toBe(true);
      // Should check groups in order until finding a match
      expect(mockK8sGet).toHaveBeenCalledTimes(2);
      // Should call callback with updated groups when user found in second group
      expect(mockCallback).toHaveBeenCalledWith({
        username: 'tester3',
        groups: ['test-apalit-group-2'],
      });
    });

    it('should handle empty approvers list', async () => {
      const mockCallback = jest.fn();
      const result = await isUserAuthorizedForApproval(
        'approver-user-1',
        [],
        {
          username: 'approver-user-1',
          groups: [],
        } as any,
        mockCallback,
      );
      expect(result).toBe(false);
      // Should not call callback when approvers list is empty
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should handle missing current user', async () => {
      const mockCallback = jest.fn();
      const approvers = [
        {
          input: 'pending' as any,
          name: 'approver-user-1',
          type: 'User' as const,
        },
        {
          input: 'pending' as any,
          name: 'test-apalit-group-1',
          type: 'Group' as const,
        },
      ];
      const result = await isUserAuthorizedForApproval(
        '',
        approvers,
        {
          username: '',
          groups: [],
        } as any,
        mockCallback,
      );
      expect(result).toBe(false);
      // Should not call callback when user is missing
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });
});
