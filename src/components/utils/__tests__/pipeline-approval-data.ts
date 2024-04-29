import { ApproverInput, ApproverResponse } from '../../../types';

export const mockApprovalStatus = {
  ['Approved']: {
    ApprovalTask: {
      apiVersion: 'openshift-pipelines.org/v1alpha1',
      kind: 'ApprovalTask',
      metadata: {
        name: 'custom-task-beta-run-1bgb5m-wait',
        labels: {
          'tekton.dev/pipelineRun': 'custom-task-beta-run-1bgb5m',
        },
      },
      spec: {
        approvers: [
          {
            input: 'pending' as ApproverInput,
            name: 'foo',
          },
        ],
        numberOfApprovalsRequired: 1,
      },
      status: {
        approvers: ['foo'],
        approversResponse: [
          {
            message: 'hello',
            name: 'foo',
            response: 'approved' as ApproverResponse,
          },
        ],
        state: 'approved' as ApproverResponse,
      },
    },
    PipelineRun: {
      apiVersion: 'tekton.dev/v1',
      kind: 'PipelineRun',
      metadata: {
        name: 'custom-task-beta-run-z6cs4z',
        labels: {
          'tekton.dev/pipeline': 'custom-task-beta',
        },
      },
      spec: {
        pipelineRef: {
          name: 'custom-task-beta',
        },
      },
      status: {
        pipelineSpec: {
          tasks: [
            {
              name: 'before',
              taskRef: { kind: 'Task', name: 'before' },
            },
            {
              name: 'wait',
              taskRef: {
                apiVersion: 'openshift-pipelines.org/v1alpha1',
                kind: 'ApprovalTask',
              },
              runAfter: ['before'],
            },
            {
              name: 'after',
              taskRef: {
                kind: 'Task',
                name: 'after',
              },
              runAfter: ['wait'],
            },
          ],
        },

        conditions: [
          {
            reason: 'Succeeded',
            status: 'True',
            type: 'Succeeded',
          },
        ],
      },
    },
  },
  ['Rejected']: {
    ApprovalTask: {
      apiVersion: 'openshift-pipelines.org/v1alpha1',
      kind: 'ApprovalTask',
      metadata: {
        name: 'custom-task-beta-run-1bgb5m-wait',
        labels: {
          'tekton.dev/pipelineRun': 'custom-task-beta-run-1bgb5m',
        },
      },
      spec: {
        approvers: [
          {
            input: 'pending' as ApproverInput,
            name: 'foo',
          },
        ],
        numberOfApprovalsRequired: 1,
      },
      status: {
        approvers: ['foo'],
        approversResponse: [
          {
            message: 'hello',
            name: 'foo',
            response: 'rejected' as ApproverResponse,
          },
        ],
        state: 'rejected' as ApproverResponse,
      },
    },
    PipelineRun: {
      apiVersion: 'tekton.dev/v1',
      kind: 'PipelineRun',
      metadata: {
        name: 'custom-task-beta-run-z6cs4z',
        labels: {
          'tekton.dev/pipeline': 'custom-task-beta',
        },
      },
      spec: {
        pipelineRef: {
          name: 'custom-task-beta',
        },
      },
      status: {
        pipelineSpec: {
          tasks: [
            {
              name: 'before',
              taskRef: { kind: 'Task', name: 'before' },
            },
            {
              name: 'wait',
              taskRef: {
                apiVersion: 'openshift-pipelines.org/v1alpha1',
                kind: 'ApprovalTask',
              },
              runAfter: ['before'],
            },
            {
              name: 'after',
              taskRef: {
                kind: 'Task',
                name: 'after',
              },
              runAfter: ['wait'],
            },
          ],
        },

        conditions: [
          {
            reason: 'Failed',
            status: 'False',
            type: 'Succeeded',
          },
        ],
      },
    },
  },
  ['TimedOut']: {
    ApprovalTask: {
      apiVersion: 'openshift-pipelines.org/v1alpha1',
      kind: 'ApprovalTask',
      metadata: {
        name: 'custom-task-beta-run-1bgb5m-wait',
        labels: {
          'tekton.dev/pipelineRun': 'custom-task-beta-run-1bgb5m',
        },
      },
      spec: {
        approvers: [
          {
            input: 'pending' as ApproverInput,
            name: 'foo',
          },
        ],
        numberOfApprovalsRequired: 1,
      },
      status: {
        approvers: ['foo'],
        state: 'false' as ApproverResponse,
      },
    },
    PipelineRun: {
      apiVersion: 'tekton.dev/v1',
      kind: 'PipelineRun',
      metadata: {
        name: 'custom-task-beta-run-z6cs4z',
        labels: {
          'tekton.dev/pipeline': 'custom-task-beta',
        },
      },
      spec: {
        pipelineRef: {
          name: 'custom-task-beta',
        },
      },
      status: {
        pipelineSpec: {
          tasks: [
            {
              name: 'before',
              taskRef: { kind: 'Task', name: 'before' },
            },
            {
              name: 'wait',
              taskRef: {
                apiVersion: 'openshift-pipelines.org/v1alpha1',
                kind: 'ApprovalTask',
              },
              runAfter: ['before'],
            },
            {
              name: 'after',
              taskRef: {
                kind: 'Task',
                name: 'after',
              },
              runAfter: ['wait'],
            },
          ],
        },
        conditions: [
          {
            reason: 'PipelineRunTimeout',
            status: 'False',
            type: 'Succeeded',
          },
        ],
      },
    },
  },
  ['Pending']: {
    ApprovalTask: {
      apiVersion: 'openshift-pipelines.org/v1alpha1',
      kind: 'ApprovalTask',
      metadata: {
        name: 'custom-task-beta-run-1bgb5m-wait',
        labels: {
          'tekton.dev/pipelineRun': 'custom-task-beta-run-1bgb5m',
        },
      },
      spec: {
        approvers: [
          {
            input: 'pending' as ApproverInput,
            name: 'foo',
          },
        ],
        numberOfApprovalsRequired: 1,
      },
      status: {
        approvers: ['foo'],
        state: 'pending' as ApproverResponse,
      },
    },
    PipelineRun: {
      apiVersion: 'tekton.dev/v1',
      kind: 'PipelineRun',
      metadata: {
        name: 'custom-task-beta-run-z6cs4z',
        labels: {
          'tekton.dev/pipeline': 'custom-task-beta',
        },
      },
      spec: {
        pipelineRef: {
          name: 'custom-task-beta',
        },
      },
      status: {
        pipelineSpec: {
          tasks: [
            {
              name: 'before',
              taskRef: { kind: 'Task', name: 'before' },
            },
            {
              name: 'wait',
              taskRef: {
                apiVersion: 'openshift-pipelines.org/v1alpha1',
                kind: 'ApprovalTask',
              },
              runAfter: ['before'],
            },
            {
              name: 'after',
              taskRef: {
                kind: 'Task',
                name: 'after',
              },
              runAfter: ['wait'],
            },
          ],
        },
        conditions: [
          {
            reason: 'Running',
            status: 'Unknown',
            type: 'Succeeded',
          },
        ],
      },
    },
  },
  ['Idle']: {
    PipelineRun: {
      apiVersion: 'tekton.dev/v1',
      kind: 'PipelineRun',
      metadata: {
        name: 'custom-task-beta-run-z6cs4z',
        labels: {
          'tekton.dev/pipeline': 'custom-task-beta',
        },
      },
      spec: {
        pipelineRef: {
          name: 'custom-task-beta',
        },
      },
      status: {
        pipelineSpec: {
          tasks: [
            {
              name: 'before',
              taskRef: { kind: 'Task', name: 'before' },
            },
            {
              name: 'wait',
              taskRef: {
                apiVersion: 'openshift-pipelines.org/v1alpha1',
                kind: 'ApprovalTask',
              },
              runAfter: ['before'],
            },
            {
              name: 'after',
              taskRef: {
                kind: 'Task',
                name: 'after',
              },
              runAfter: ['wait'],
            },
          ],
        },
        conditions: [
          {
            reason: 'Running',
            status: 'Unknown',
            type: 'Succeeded',
          },
        ],
      },
    },
  },
  ['PartiallyApproved']: {
    ApprovalTask: {
      apiVersion: 'openshift-pipelines.org/v1alpha1',
      kind: 'ApprovalTask',
      metadata: {
        name: 'custom-task-beta-run-1bgb5m-wait',
        labels: {
          'tekton.dev/pipelineRun': 'custom-task-beta-run-1bgb5m',
        },
      },
      spec: {
        approvers: [
          {
            input: 'approve' as ApproverInput,
            name: 'foo',
          },
          {
            input: 'approve' as ApproverInput,
            name: 'bar',
          },
          {
            input: 'pending' as ApproverInput,
            name: 'john',
          },
          {
            input: 'pending' as ApproverInput,
            name: 'wick',
          },
        ],
        numberOfApprovalsRequired: 4,
      },
      status: {
        approvers: ['foo', 'bar', 'john', 'wick'],
        approversResponse: [
          {
            name: 'foo',
            response: 'approved' as ApproverResponse,
          },
          {
            name: 'bar',
            response: 'approved' as ApproverResponse,
          },
        ],
        state: 'pending' as ApproverResponse,
      },
    },
    PipelineRun: {
      apiVersion: 'tekton.dev/v1',
      kind: 'PipelineRun',
      metadata: {
        name: 'custom-task-beta-run-z6cs4z',
        labels: {
          'tekton.dev/pipeline': 'custom-task-beta',
        },
      },
      spec: {
        pipelineRef: {
          name: 'custom-task-beta',
        },
      },
      status: {
        pipelineSpec: {
          tasks: [
            {
              name: 'before',
              taskRef: { kind: 'Task', name: 'before' },
            },
            {
              name: 'wait',
              taskRef: {
                apiVersion: 'openshift-pipelines.org/v1alpha1',
                kind: 'ApprovalTask',
              },
              runAfter: ['before'],
            },
            {
              name: 'after',
              taskRef: {
                kind: 'Task',
                name: 'after',
              },
              runAfter: ['wait'],
            },
          ],
        },
        conditions: [
          {
            reason: 'Running',
            status: 'Unknown',
            type: 'Succeeded',
          },
        ],
      },
    },
  },
  ['AlmostApproved']: {
    ApprovalTask: {
      apiVersion: 'openshift-pipelines.org/v1alpha1',
      kind: 'ApprovalTask',
      metadata: {
        name: 'custom-task-beta-run-1bgb5m-wait',
        labels: {
          'tekton.dev/pipelineRun': 'custom-task-beta-run-1bgb5m',
        },
      },
      spec: {
        approvers: [
          {
            input: 'approve' as ApproverInput,
            name: 'foo',
          },
          {
            input: 'approve' as ApproverInput,
            name: 'bar',
          },
          {
            input: 'approve' as ApproverInput,
            name: 'john',
          },
          {
            input: 'pending' as ApproverInput,
            name: 'wick',
          },
        ],
        numberOfApprovalsRequired: 4,
      },
      status: {
        approvers: ['foo', 'bar', 'john', 'wick'],
        approversResponse: [
          {
            name: 'foo',
            response: 'approved' as ApproverResponse,
          },
          {
            name: 'bar',
            response: 'approved' as ApproverResponse,
          },
          {
            name: 'john',
            response: 'approved' as ApproverResponse,
          },
        ],
        state: 'pending' as ApproverResponse,
      },
    },
    PipelineRun: {
      apiVersion: 'tekton.dev/v1',
      kind: 'PipelineRun',
      metadata: {
        name: 'custom-task-beta-run-z6cs4z',
        labels: {
          'tekton.dev/pipeline': 'custom-task-beta',
        },
      },
      spec: {
        pipelineRef: {
          name: 'custom-task-beta',
        },
      },
      status: {
        pipelineSpec: {
          tasks: [
            {
              name: 'before',
              taskRef: { kind: 'Task', name: 'before' },
            },
            {
              name: 'wait',
              taskRef: {
                apiVersion: 'openshift-pipelines.org/v1alpha1',
                kind: 'ApprovalTask',
              },
              runAfter: ['before'],
            },
            {
              name: 'after',
              taskRef: {
                kind: 'Task',
                name: 'after',
              },
              runAfter: ['wait'],
            },
          ],
        },
        conditions: [
          {
            reason: 'Running',
            status: 'Unknown',
            type: 'Succeeded',
          },
        ],
      },
    },
  },
  ['Unknown']: {
    ApprovalTask: {
      apiVersion: 'openshift-pipelines.org/v1alpha1',
      kind: 'ApprovalTask',
      metadata: {
        name: 'custom-task-beta-run-1bgb5m-wait',
        labels: {
          'tekton.dev/pipelineRun': 'custom-task-beta-run-1bgb5m',
        },
      },
      spec: {
        approvers: [
          {
            input: 'pending' as ApproverInput,
            name: 'foo',
          },
        ],
        numberOfApprovalsRequired: 1,
      },
      status: {
        approvers: ['foo'],
        approversResponse: [
          {
            message: 'hello',
            name: 'foo',
            response: 'rejected' as ApproverResponse,
          },
        ],
        state: 'unknown' as ApproverResponse,
      },
    },
    PipelineRun: {
      apiVersion: 'tekton.dev/v1',
      kind: 'PipelineRun',
      metadata: {
        name: 'custom-task-beta-run-z6cs4z',
        labels: {
          'tekton.dev/pipeline': 'custom-task-beta',
        },
      },
      spec: {
        pipelineRef: {
          name: 'custom-task-beta',
        },
      },
      status: {
        pipelineSpec: {
          tasks: [
            {
              name: 'before',
              taskRef: { kind: 'Task', name: 'before' },
            },
            {
              name: 'wait',
              taskRef: {
                apiVersion: 'openshift-pipelines.org/v1alpha1',
                kind: 'ApprovalTask',
              },
              runAfter: ['before'],
            },
            {
              name: 'after',
              taskRef: {
                kind: 'Task',
                name: 'after',
              },
              runAfter: ['wait'],
            },
          ],
        },

        conditions: [
          {
            reason: 'Failed',
            status: 'False',
            type: 'Succeeded',
          },
        ],
      },
    },
  },
};
