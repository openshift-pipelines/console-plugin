import { k8sGet, UserInfo } from '@openshift-console/dynamic-plugin-sdk';
import { Approver } from 'src/types/approver';
import { GroupModel } from '../../models';

export interface GroupKind {
  metadata: {
    name: string;
  };
  users?: string[];
}

/**
 * Checks if the current user is authorized based on approvers list
 * Supports both direct user assignment and group membership (group:groupname format)
 * @param currentUser - The current user's username
 * @param approvers - Array of approver strings (usernames or group:groupname)
 * @returns Promise resolving to true if user is authorized
 */
export const isUserAuthorizedForApproval = async (
  currentUser: string,
  approvers: Approver[],
  currentUserObject: UserInfo,
  cb: (userInfo: UserInfo) => void,
): Promise<boolean> => {
  if (!currentUser || !approvers || approvers.length === 0) {
    return false;
  }

  // Check direct user assignment (existing functionality)
  if (
    approvers.filter(
      (approver) => approver.name === currentUser && approver.type === 'User',
    )?.length > 0
  ) {
    return true;
  }

  // Check group-based assignments (new functionality)
  const groupApprovers = approvers.filter(
    (approver) => approver.type === 'Group',
  );

  for (const groupApprover of groupApprovers) {
    const groupName = groupApprover.name;
    if (
      Array.isArray(currentUserObject.groups) &&
      currentUserObject.groups.includes(groupName)
    ) {
      return true;
    }
    //currentUserObject.groups = [];
    try {
      const group = await k8sGet<GroupKind>({
        model: GroupModel,
        name: groupName,
      });
      if (group.users && group.users.includes(currentUser)) {
        cb({
          ...currentUserObject,
          groups: [...(currentUserObject.groups || []), groupName],
        });
        return true;
      }
    } catch (error) {
      // Log error but continue checking other groups
      console.warn(
        `Failed to check group membership for group: ${groupName}`,
        error,
      );
    }
  }

  return false;
};
