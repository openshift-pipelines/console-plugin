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
      );
      expect(result).toBe(true);
      // Should not call k8sGet for direct user assignment
      expect(mockK8sGet).not.toHaveBeenCalled();
    });

    it('should authorize user through group membership via k8s API', async () => {
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
      const result = await isUserAuthorizedForApproval('tester3', approvers, {
        username: 'tester3',
        groups: [],
      } as any);

      expect(result).toBe(true);
      expect(mockK8sGet).toHaveBeenCalledWith({
        model: expect.objectContaining({
          kind: 'Group',
          plural: 'groups',
        }),
        name: 'test-apalit-group-2',
      });
    });

    it('should authorize user through group membership via UserInfo.groups', async () => {
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
      );

      expect(result).toBe(true);
      // Should not call k8sGet when group is in UserInfo.groups
      expect(mockK8sGet).not.toHaveBeenCalled();
    });

    it('should deny user not in group', async () => {
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
      );

      expect(result).toBe(false);
    });

    it('should handle group fetch errors gracefully', async () => {
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
      );

      expect(result).toBe(false);
    });

    it('should work with mixed User and Group approvers from real ApprovalTask', async () => {
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

      const result = await isUserAuthorizedForApproval('tester3', approvers, {
        username: 'tester3',
        groups: [],
      } as any);

      expect(result).toBe(true);
      // Should check groups in order until finding a match
      expect(mockK8sGet).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple groups and find user in second group', async () => {
      mockK8sGet
        .mockResolvedValueOnce(
          createMockGroup('test-apalit-group-1', ['user1', 'user2']),
        )
        .mockResolvedValueOnce(
          createMockGroup('test-apalit-group-3', ['tester5', 'tester6']),
        );

      const approvers = [
        {
          input: 'pending' as any,
          name: 'test-apalit-group-1',
          type: 'Group' as const,
        },
        {
          input: 'pending' as any,
          name: 'test-apalit-group-3',
          type: 'Group' as const,
        },
      ];

      const result = await isUserAuthorizedForApproval('tester5', approvers, {
        username: 'tester5',
        groups: [],
      } as any);

      expect(result).toBe(true);
      expect(mockK8sGet).toHaveBeenCalledTimes(2);
    });

    it('should handle empty group users array', async () => {
      mockK8sGet.mockResolvedValue(createMockGroup('empty-group', []));

      const approvers = [
        {
          input: 'pending' as any,
          name: 'empty-group',
          type: 'Group' as const,
        },
      ];

      const result = await isUserAuthorizedForApproval(
        'approver-user-1',
        approvers,
        { username: 'approver-user-1', groups: [] } as any,
      );

      expect(result).toBe(false);
    });

    it('should handle group without users field', async () => {
      mockK8sGet.mockResolvedValue({
        kind: 'Group',
        apiVersion: 'user.openshift.io/v1',
        metadata: {
          name: 'group-no-users',
          uid: 'uid-123',
          resourceVersion: '12345',
          creationTimestamp: '2025-10-17T05:52:40Z',
        },
      } as GroupKind);

      const approvers = [
        {
          input: 'pending' as any,
          name: 'group-no-users',
          type: 'Group' as const,
        },
      ];

      const result = await isUserAuthorizedForApproval(
        'approver-user-1',
        approvers,
        { username: 'approver-user-1', groups: [] } as any,
      );

      expect(result).toBe(false);
    });

    it('should handle empty approvers list', async () => {
      const result = await isUserAuthorizedForApproval('approver-user-1', [], {
        username: 'approver-user-1',
        groups: [],
      } as any);
      expect(result).toBe(false);
    });

    it('should handle missing current user', async () => {
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
      const result = await isUserAuthorizedForApproval('', approvers, {
        username: '',
        groups: [],
      } as any);
      expect(result).toBe(false);
    });

    it('should cache group in UserInfo.groups after successful API fetch', async () => {
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
      );

      expect(result).toBe(true);
      expect(userInfo.groups).toContain('test-apalit-group-2');
    });

    it('should prioritize direct user assignment before checking groups', async () => {
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
        {
          input: 'pending' as any,
          name: 'test-apalit-group-2',
          type: 'Group' as const,
        },
      ];

      const result = await isUserAuthorizedForApproval(
        'approver-user-1',
        approvers,
        { username: 'approver-user-1', groups: [] } as any,
      );

      expect(result).toBe(true);
      expect(mockK8sGet).not.toHaveBeenCalled();
    });

    it('should handle multiple groups with one failing to fetch', async () => {
      mockK8sGet
        .mockRejectedValueOnce(new Error('Network error'))
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
      ];

      const result = await isUserAuthorizedForApproval('tester3', approvers, {
        username: 'tester3',
        groups: [],
      } as any);

      expect(result).toBe(true);
      expect(mockK8sGet).toHaveBeenCalledTimes(2);
    });
  });
});
