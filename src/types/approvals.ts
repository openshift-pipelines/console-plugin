export type ApproverInput = 'approve' | 'reject' | 'pending';
export type ApproverResponse = 'approved' | 'rejected' | 'pending' | 'false';

export enum ApprovalStatus {
  Idle = 'idle',
  RequestSent = 'pending',
  PartiallyApproved = 'partiallyApproved',
  AlmostApproved = 'almostApproved',
  Accepted = 'approve',
  Rejected = 'reject',
  TimedOut = 'timeout',
  Unknown = 'unknown',
}

export enum ApproverStatusResponse {
  Accepted = 'approved',
  Rejected = 'rejected',
  Pending = 'pending',
  Timedout = 'false',
}
