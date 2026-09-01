import { merge } from 'lodash';
import { t } from '../../../../__mocks__/react-i18next';
import { getRandomChars } from '../../../components/utils/utils';
import { PIPELINE_NAMESPACE } from '../../../consts';
import {
  PipelineKind,
  PipelineTask,
  TaskKind,
  TektonTaskSpec,
  TektonTaskSteps,
} from '../../../types';
import { initialPipelineFormData } from '../const';
import { EditorType } from '../types';
import { validationSchema } from '../validation-utils';

export const createSafeTask = (
  name = `name-${getRandomChars()}`,
): PipelineTask => ({
  name,
  taskRef: {
    name: 'not-a-real-task',
  },
});

const taskSpecTemplate: TektonTaskSteps[] = [
  {
    name: 'echo',
    image: 'ubuntu',
    command: ['echo'],
    args: ['$(params.some-value-that-does-not-break-tests)'],
  },
];
const embeddedTaskTemplate: TektonTaskSpec = {
  steps: taskSpecTemplate,
};
const externalTaskTemplate: TaskKind = {
  apiVersion: 'tekton.dev/v1beta1',
  kind: 'Task',
  metadata: {
    name: 'external-task',
    namespace: PIPELINE_NAMESPACE,
  },
  spec: {
    params: [],
    steps: taskSpecTemplate,
  },
};
export const externalTask = externalTaskTemplate;
export const externalTaskNoDefaultParam = merge({}, externalTaskTemplate, {
  spec: { params: [{ name: 'echo-value' }] },
});
export const externalTaskWithDefaultParam = merge({}, externalTaskTemplate, {
  spec: {
    params: [{ name: 'echo-value-with-default', default: 'some value' }],
  },
});
export const externalTaskWitEmptyDefaultParam = merge(
  {},
  externalTaskTemplate,
  {
    spec: { params: [{ name: 'echo-value-with-default', default: '' }] },
  },
);
export const externalTaskWithVarietyParams = merge({}, externalTaskTemplate, {
  spec: {
    params: [
      {
        name: 'param-with-description',
        description: 'some useful description',
      },
      { name: 'param-with-default', default: 'default-value' },
      { name: 'param-with-neither' },
      {
        name: 'param-with-both',
        description: 'this is the cool one',
        default: 'some-default',
      },
      { name: 'array-param-without-default', type: 'array' },
      {
        name: 'array-param-with-default',
        type: 'array',
        default: ['one', 'two'],
      },
    ],
  },
});
export const embeddedTaskSpec = embeddedTaskTemplate;

const externalTaskWithResourcesTemplate: TaskKind = {
  apiVersion: 'tekton.dev/v1beta1',
  kind: 'Task',
  metadata: {
    name: 'external-task-with-resources',
    namespace: PIPELINE_NAMESPACE,
  },
  spec: {
    resources: {
      inputs: [{ name: 'source-git', type: 'git' }],
      outputs: [{ name: 'source-image', type: 'image' }],
    },
    steps: [
      {
        name: 'manage-credentials',
        image: 'ubuntu',
        command: ['echo'],
        args: [
          'Logging in on behalf of $(params.username).\n\nUsername: kube:admin\nPassword: *********\n\nCredentials verified successfully.',
        ],
      },
      {
        name: 'pull-repo',
        image: 'ubuntu',
        command: ['echo'],
        args: ['git clone $(resources.inputs.source-git.url)'],
      },
    ],
  },
};
export const resourceTask = externalTaskWithResourcesTemplate;

const externalTaskWithWorkspacesTemplate: TaskKind = {
  apiVersion: 'tekton.dev/v1beta1',
  kind: 'Task',
  metadata: {
    name: 'external-task-with-workspace',
    namespace: PIPELINE_NAMESPACE,
  },
  spec: {
    workspaces: [
      {
        name: 'output',
        description:
          'The git repo will be cloned onto the volume backing this workspace',
      },
      {
        name: 'second',
        description: 'secondness',
      },
    ],
    steps: [
      {
        name: 'clone',
        image:
          'gcr.io/tekton-releases/github.com/tektoncd/pipeline/cmd/git-init:v0.14.2',
        script: ['echo "hello"'],
      },
    ],
  },
};
export const workspaceTask = externalTaskWithWorkspacesTemplate;

// --- Pipeline-in-pipelines / cluster-resolver fixtures ---

// A plain, same-namespace pipelineRef (no resolver) — the simple "embed
// another Pipeline from my own namespace" case.
export const pipelineRefTask: PipelineTask = {
  name: 'nested-pipeline-ref',
  pipelineRef: {
    name: 'some-pipeline',
  },
};

// A cluster-resolver pipelineRef — references a Pipeline in a different
// namespace via the Tekton cluster resolver.
export const clusterResolverPipelineRefTask: PipelineTask = {
  name: 'nested-pipeline-cluster-ref',
  pipelineRef: {
    resolver: 'cluster',
    params: [
      { name: 'kind', value: 'pipeline' },
      { name: 'name', value: 'some-pipeline' },
      { name: 'namespace', value: PIPELINE_NAMESPACE },
    ],
  },
};

// A cluster-resolver taskRef — same shape as clusterResolverPipelineRefTask
// but for a Task, useful for combo tests alongside pipelineRef/pipelineSpec.
export const clusterResolverTaskRefTask: PipelineTask = {
  name: 'cluster-resolver-task',
  taskRef: {
    resolver: 'cluster',
    params: [
      { name: 'kind', value: 'task' },
      { name: 'name', value: 'external-task' },
      { name: 'namespace', value: PIPELINE_NAMESPACE },
    ],
  },
};

// The matching PipelineKind resource a pipelineRef/cluster-resolver
// pipelineRef would resolve to, for tests that exercise findTask/params.
export const externalPipelineTemplate: PipelineKind = {
  apiVersion: 'tekton.dev/v1beta1',
  kind: 'Pipeline',
  metadata: {
    name: 'some-pipeline',
    namespace: PIPELINE_NAMESPACE,
  },
  spec: {
    params: [],
    tasks: [
      {
        name: 'inner-task',
        taskRef: { name: 'external-task' },
      },
    ],
  },
};
export const externalPipeline = externalPipelineTemplate;
export const externalPipelineWithRequiredParam = merge(
  {},
  externalPipelineTemplate,
  {
    spec: { params: [{ name: 'required-param' }] },
  },
);

// A single inline pipelineSpec with one valid nested task — the minimal
// pipelines-in-pipelines case.
export const pipelineSpecTask: PipelineTask = {
  name: 'nested-pipeline-spec',
  pipelineSpec: {
    tasks: [
      {
        name: 'inner-task',
        taskRef: { name: 'not-a-real-task' },
      },
    ],
  },
};

// A pipelineSpec whose nested tasks reference each other via runAfter —
// for testing that nested runAfter is scoped to its own sibling list.
export const pipelineSpecWithInternalRunAfter: PipelineTask = {
  name: 'nested-pipeline-internal-runafter',
  pipelineSpec: {
    tasks: [
      {
        name: 'inner-task-a',
        taskRef: { name: 'not-a-real-task' },
      },
      {
        name: 'inner-task-b',
        taskRef: { name: 'not-a-real-task' },
        runAfter: ['inner-task-a'],
      },
    ],
  },
};

// A pipelineSpec whose nested finally list mirrors the top-level
// tasks/finally split, for combo coverage of nested finally validation.
export const pipelineSpecWithFinally: PipelineTask = {
  name: 'nested-pipeline-with-finally',
  pipelineSpec: {
    tasks: [
      {
        name: 'inner-task',
        taskRef: { name: 'not-a-real-task' },
      },
    ],
    finally: [
      {
        name: 'inner-finally-task',
        taskRef: { name: 'not-a-real-task' },
      },
    ],
  },
};

// A two-level-deep pipelineSpec — a task inside a nested pipelineSpec that
// itself has a pipelineSpec — for recursive pipelines-in-pipelines coverage.
export const doublyNestedPipelineSpecTask: PipelineTask = {
  name: 'outer-nested-pipeline',
  pipelineSpec: {
    tasks: [
      {
        name: 'middle-task',
        taskRef: { name: 'not-a-real-task' },
      },
      {
        name: 'inner-nested-pipeline',
        pipelineSpec: {
          tasks: [
            {
              name: 'innermost-task',
              taskRef: { name: 'not-a-real-task' },
            },
          ],
        },
      },
    ],
  },
};

// A task combining a cluster-resolver pipelineRef alongside regular tasks
// with runAfter dependencies, for combo-scenario coverage (mixed graph of
// plain tasks and pipeline-in-pipeline tasks in the same pipeline).
export const mixedTasksWithClusterResolverPipeline: PipelineTask[] = [
  { name: 'first-task', taskRef: { name: 'external-task' } },
  {
    ...clusterResolverPipelineRefTask,
    runAfter: ['first-task'],
  },
  {
    name: 'last-task',
    taskRef: { name: 'external-task' },
    runAfter: [clusterResolverPipelineRefTask.name],
  },
];

// Helper test methods for .then/.catch invocations
export const hasResults = (results) => expect(results).toBeTruthy(); // success for .then
export const shouldHaveFailed = (success) =>
  expect(success).toBe('should have failed'); // failure for .then
export const hasError = (yupPath: string, errorMessage: string) => (error) => {
  if (!error?.inner) {
    // Not a yup validation object, do a bad comparison so the test echos it
    expect(error).toBe(
      'Not a Yup Error, see following error message for the actual error.',
    );
    return;
  }

  const errors: { path: string; message: string }[] = error.inner.map(
    (err) => ({
      path: err.path,
      message: err.message,
    }),
  );
  const expectedError = { path: yupPath, message: errorMessage };
  expect(errors).toEqual(
    expect.arrayContaining([expect.objectContaining(expectedError)]),
  );
};
export const shouldHavePassed = (err) =>
  expect(err).toBe('should not have this error'); // failure for .catch

export const withFormData = (
  formData,
  taskResources?,
  isAlphaEnabled = false,
) =>
  validationSchema(t, isAlphaEnabled).validate({
    editorType: EditorType.Form,
    yamlData: '',
    formData,
    taskResources: {
      clusterResolverTasks: [],
      namespacedTasks: [],
      clusterResolverPipelines: [],
      namespacedPipelines: [],
      ...(taskResources || {}),
      tasksLoaded: !!taskResources,
    },
  });

export const formDataBasicPassState = {
  ...initialPipelineFormData,
  tasks: [createSafeTask()],
};
