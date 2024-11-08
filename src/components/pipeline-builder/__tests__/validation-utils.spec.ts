import { merge } from 'lodash';
import { t } from '../../../../__mocks__/react-i18next';
import { PIPELINE_NAMESPACE } from '../../../consts';
import {
  getTaskErrorString,
  initialPipelineFormData,
  TaskErrorType,
} from '../const';
import { EditorType } from '../types';
import { validationSchema } from '../validation-utils';
import {
  createSafeTask,
  embeddedTaskSpec,
  externalTaskNoDefaultParam,
  externalTaskWitEmptyDefaultParam,
  externalTaskWithDefaultParam,
  formDataBasicPassState,
  hasError,
  hasResults,
  shouldHaveFailed,
  shouldHavePassed,
  withFormData,
  workspaceTask,
} from './validation-utils-data';

const requiredMessage = 'Required';

describe('Pipeline Build validation schema', () => {
  describe('Form/YAML switcher validation', () => {
    it('should fail when provided an unknown editor type', async () => {
      await validationSchema(t)
        .validate({
          editorType: 'not a real value',
          yamlData: '',
          formData: initialPipelineFormData,
        })
        .then(shouldHaveFailed)
        .catch(
          hasError(
            'editorType',
            'editorType must be one of the following values: form, yaml',
          ),
        );
    });

    it('should fail initial values because there are no tasks', async () => {
      await validationSchema(t)
        .validate({
          editorType: EditorType.Form,
          yamlData: '',
          formData: initialPipelineFormData,
        })
        .then(shouldHaveFailed)
        .catch(hasError('formData.tasks', 'Must define at least one task.'));
    });
  });

  describe('Base form validation', () => {
    it('should pass if there is at least one Task', async () => {
      await withFormData(formDataBasicPassState)
        .then(hasResults)
        .catch(shouldHavePassed);
    });

    it('should fail if there is an invalid name', async () => {
      await withFormData({
        ...initialPipelineFormData,
        name: '123NoTaVaLiDnAmE-',
        tasks: [createSafeTask()],
      })
        .then(shouldHaveFailed)
        .catch(
          hasError(
            'formData.name',
            'Name must consist of lower-case letters, numbers and hyphens. It must start with a letter and end with a letter or number.',
          ),
        );
    });

    it('should fail if not provided a param name', async () => {
      await withFormData({
        ...formDataBasicPassState,
        params: [{ noName: 'string' }],
      })
        .then(shouldHaveFailed)
        .catch(hasError('formData.params[0].name', requiredMessage));
    });

    it('should pass even if params default and description are empty', async () => {
      await withFormData({
        ...formDataBasicPassState,
        params: [{ name: 'test', default: undefined, description: undefined }],
      })
        .then(hasResults)
        .catch(shouldHavePassed);
    });

    it('should pass when params default and description are provided', async () => {
      await withFormData({
        ...formDataBasicPassState,
        params: [{ name: 'test', default: 'value', description: 'test data' }],
      });
    });

    // TODO: param with default as a string[]

    it('should pass when resource has a valid name and type', async () => {
      await withFormData({
        ...formDataBasicPassState,
        resources: [
          { name: 'git-value', type: 'git' },
          { name: 'image-value', type: 'image' },
          { name: 'cluster-value', type: 'cluster' },
          { name: 'storage-value', type: 'storage' },
        ],
      })
        .then(hasResults)
        .catch(shouldHavePassed);
    });

    it('should pass when provided with a valid workspace name', async () => {
      await withFormData({
        ...formDataBasicPassState,
        workspaces: [{ name: 'valid-name' }],
      })
        .then(hasResults)
        .catch(shouldHavePassed);
    });

    it('should fail when workspaces do not have a name', async () => {
      await withFormData({
        ...formDataBasicPassState,
        workspaces: [{ notName: 'not-valid' }],
      })
        .then(shouldHaveFailed)
        .catch(hasError('formData.workspaces[0].name', requiredMessage));
    });
  });

  describe('Tasks and ListTasks validation', () => {
    it('should fail if just has a name', async () => {
      await withFormData({
        ...initialPipelineFormData,
        tasks: [{ name: 'test' }],
      })
        .then(shouldHaveFailed)
        .catch(
          hasError(
            'formData.tasks[0]',
            'TaskSpec or TaskRef must be provided.',
          ),
        );
    });

    it('should pass if provided a taskSpec and name', async () => {
      await withFormData({
        ...initialPipelineFormData,
        tasks: [{ name: 'test', taskSpec: {} }],
      })
        .then(hasResults)
        .catch(shouldHavePassed);
    });

    it('should fail if provided an incomplete taskRef', async () => {
      await withFormData({
        ...initialPipelineFormData,
        tasks: [{ name: 'test', taskRef: {} }],
      })
        .then(shouldHaveFailed)
        .catch(hasError('formData.tasks[0].taskRef.name', requiredMessage));
    });

    it('should pass if provided with a proper taskRef and name', async () => {
      await withFormData({
        ...initialPipelineFormData,
        tasks: [{ name: 'test', taskRef: { name: 'external-task' } }],
      })
        .then(hasResults)
        .catch(shouldHavePassed);
    });

    describe('Validate Run Afters', () => {
      it('should fail if runAfter is a single string', async () => {
        await withFormData({
          ...initialPipelineFormData,
          tasks: [
            {
              name: 'test',
              runAfter: 'not-an-array',
              taskRef: { name: 'external-task' },
            },
          ],
        })
          .then(shouldHaveFailed)
          .catch(
            hasError(
              'formData.tasks[0].runAfter',
              expect.stringContaining(
                'formData.tasks[0].runAfter must be a `array` type',
              ),
            ),
          );
      });

      it('should fail if runAfter is an array of strings that do not match other tasks', async () => {
        await withFormData({
          ...initialPipelineFormData,
          tasks: [
            {
              name: 'test',
              runAfter: ['does-not-exist'],
              taskRef: { name: 'external-task' },
            },
          ],
        })
          .then(shouldHaveFailed)
          .catch(hasError('formData.tasks[0].runAfter', 'Invalid runAfter'));
      });

      it('should pass if runAfter is an array of strings that match other task names', async () => {
        await withFormData({
          ...initialPipelineFormData,
          tasks: [
            { name: 'first-task', taskRef: { name: 'external-task' } },
            {
              name: 'second-task',
              taskRef: { name: 'external-task' },
              runAfter: ['first-task'],
            },
            {
              name: 'third-task',
              taskRef: { name: 'external-task' },
              runAfter: ['first-task', 'second-task'],
            },
          ],
        })
          .then(hasResults)
          .catch(shouldHavePassed);
      });

      it('should fail if runAfter in listTasks does not match other listTasks', async () => {
        await withFormData({
          ...formDataBasicPassState,
          listTasks: [
            { name: 'first-list-task' },
            {
              name: 'second-list-task',
              runAfter: ['first-list-task', 'not-a-real-task'],
            },
          ],
        })
          .then(shouldHaveFailed)
          .catch(
            hasError('formData.listTasks[1].runAfter', 'Invalid runAfter'),
          );
      });

      it('should fail if runAfter is itself', async () => {
        await withFormData({
          ...initialPipelineFormData,
          tasks: [
            {
              name: 'first-task',
              taskRef: { name: 'external-task' },
              runAfter: ['first-task'],
            },
          ],
        })
          .then(shouldHaveFailed)
          .catch(hasError('formData.tasks[0].runAfter', 'Invalid runAfter'));
      });

      it('should pass if runAfter is an array of strings that match listTasks or tasks names', async () => {
        await withFormData({
          ...initialPipelineFormData,
          tasks: [
            { name: 'first-task', taskRef: { name: 'external-task' } },
            {
              name: 'second-task',
              taskRef: { name: 'external-task' },
              runAfter: ['first-task', 'first-list-task'],
            },
          ],
          listTasks: [{ name: 'first-list-task', runAfter: ['first-task'] }],
        })
          .then(hasResults)
          .catch(shouldHavePassed);
      });

      it('should pass if runAfter is on a taskSpec task', async () => {
        await withFormData({
          ...initialPipelineFormData,
          tasks: [
            { name: 'first', taskSpec: embeddedTaskSpec },
            { name: 'second', taskSpec: embeddedTaskSpec, runAfter: ['first'] },
          ],
        })
          .then(hasResults)
          .catch(shouldHavePassed);
      });
    });

    describe('Validate Parameters', () => {
      it('should fail if task params is missing a required param', async () => {
        await withFormData(
          {
            ...initialPipelineFormData,
            tasks: [
              {
                name: 'test-task',
                taskRef: {
                  resolver: 'cluster',
                  params: [
                    { name: 'kind', value: 'task' },
                    { name: 'name', value: 'external-task' },
                    { name: 'namespace', value: PIPELINE_NAMESPACE },
                  ],
                },
                params: [],
              },
            ],
          },
          {
            clusterResolverTasks: [externalTaskNoDefaultParam],
          },
        )
          .then(shouldHaveFailed)
          .catch(
            hasError(
              'formData.tasks[0].params',
              getTaskErrorString(TaskErrorType.MISSING_REQUIRED_PARAMS),
            ),
          );
      });

      it('should fail if task params has no value and also the task lacks a default', async () => {
        await withFormData(
          {
            ...initialPipelineFormData,
            tasks: [
              {
                name: 'test-task',
                taskRef: {
                  resolver: 'cluster',
                  params: [
                    { name: 'kind', value: 'task' },
                    { name: 'name', value: 'external-task' },
                    { name: 'namespace', value: PIPELINE_NAMESPACE },
                  ],
                },
                params: [{ name: 'echo-value' }],
              },
            ],
          },
          {
            clusterResolverTasks: [externalTaskNoDefaultParam],
          },
        )
          .then(shouldHaveFailed)
          .catch(
            hasError(
              'formData.tasks[0].params',
              getTaskErrorString(TaskErrorType.MISSING_REQUIRED_PARAMS),
            ),
          );
      });

      it('should pass if task params has no value but the task has a default', async () => {
        await withFormData(
          {
            ...initialPipelineFormData,
            tasks: [
              {
                name: 'test-task',
                taskRef: {
                  resolver: 'cluster',
                  params: [
                    { name: 'kind', value: 'task' },
                    { name: 'name', value: 'external-task' },
                    { name: 'namespace', value: PIPELINE_NAMESPACE },
                  ],
                },
                params: [{ name: 'echo-value-with-default' }],
              },
            ],
          },
          {
            clusterResolverTasks: [externalTaskWithDefaultParam],
          },
        )
          .then(hasResults)
          .catch(shouldHavePassed);
      });

      it('should pass if the task params has no value but the task default is an empty string', async () => {
        await withFormData(
          {
            ...initialPipelineFormData,
            tasks: [
              {
                name: 'test-task',
                taskRef: {
                  resolver: 'cluster',
                  params: [
                    { name: 'kind', value: 'task' },
                    { name: 'name', value: 'external-task' },
                    { name: 'namespace', value: PIPELINE_NAMESPACE },
                  ],
                },
                params: [{ name: 'echo-value-with-empty-default' }],
              },
            ],
          },
          {
            clusterResolverTasks: [externalTaskWitEmptyDefaultParam],
          },
        )
          .then(hasResults)
          .catch(shouldHavePassed);
      });

      it('should pass if the task params has no value but the task is embedded and not external', async () => {
        await withFormData({
          ...initialPipelineFormData,
          tasks: [
            {
              name: 'test-task',
              taskSpec: embeddedTaskSpec,
              params: [{ name: 'echo-value-no-task-ref' }],
            },
          ],
        })
          .then(hasResults)
          .catch(shouldHavePassed);
      });

      it('should fail if the taskSpec params are required and not provided', async () => {
        const taskSpecWithParam = merge({}, embeddedTaskSpec, {
          params: [{ name: 'name', description: 'Your name to echo out' }],
        });
        await withFormData({
          ...initialPipelineFormData,
          tasks: [{ name: 'test', taskSpec: taskSpecWithParam }],
        })
          .then(shouldHaveFailed)
          .catch(
            hasError(
              'formData.tasks[0].params',
              getTaskErrorString(TaskErrorType.MISSING_REQUIRED_PARAMS),
            ),
          );
      });

      it('should pass if the taskSpec params have defaults', async () => {
        const taskSpecWithDefaultParam = merge({}, embeddedTaskSpec, {
          params: [
            {
              name: 'name',
              description: 'Your name to echo out',
              default: 'John Doe',
            },
          ],
        });
        await withFormData({
          ...initialPipelineFormData,
          tasks: [{ name: 'test', taskSpec: taskSpecWithDefaultParam }],
        })
          .then(hasResults)
          .catch(shouldHavePassed);
      });

      it('should pass if the taskSpec params are required but a value is provided', async () => {
        const taskSpecWithParam = merge({}, embeddedTaskSpec, {
          params: [{ name: 'name', description: 'Your name to echo out' }],
        });
        await withFormData({
          ...initialPipelineFormData,
          tasks: [
            {
              name: 'test',
              taskSpec: taskSpecWithParam,
              params: [{ name: 'name', value: 'John Doe' }],
            },
          ],
        })
          .then(hasResults)
          .catch(shouldHavePassed);
      });
    });

    describe('Validate Workspaces', () => {
      it('should fail if the task does not include workspaces but the task does', async () => {
        await withFormData(
          {
            ...initialPipelineFormData,
            tasks: [
              {
                name: 'test-task',
                taskRef: {
                  resolver: 'cluster',
                  params: [
                    { name: 'kind', value: 'task' },
                    { name: 'name', value: 'external-task-with-workspace' },
                    { name: 'namespace', value: PIPELINE_NAMESPACE },
                  ],
                },
              },
            ],
          },
          {
            clusterResolverTasks: [workspaceTask],
          },
        )
          .then(shouldHaveFailed)
          .catch(
            hasError(
              'formData.tasks[0].workspaces',
              getTaskErrorString(TaskErrorType.MISSING_WORKSPACES),
            ),
          );
      });

      it('should fail if the task contains some of the required workspaces', async () => {
        await withFormData(
          {
            ...initialPipelineFormData,
            workspaces: [{ name: 'workspace' }],
            tasks: [
              {
                name: 'test-task',
                taskRef: {
                  resolver: 'cluster',
                  params: [
                    { name: 'kind', value: 'task' },
                    { name: 'name', value: 'external-task-with-workspace' },
                    { name: 'namespace', value: PIPELINE_NAMESPACE },
                  ],
                },
                workspaces: [{ name: 'output', workspace: 'workspace' }],
              },
            ],
          },
          {
            clusterResolverTasks: [workspaceTask],
          },
        )
          .then(shouldHaveFailed)
          .catch(
            hasError(
              'formData.tasks[0].workspaces',
              getTaskErrorString(TaskErrorType.MISSING_WORKSPACES),
            ),
          );
      });

      it('should pass if the task contains all the required workspaces', async () => {
        await withFormData(
          {
            ...initialPipelineFormData,
            workspaces: [{ name: 'workspace' }, { name: 'workspace2' }],
            tasks: [
              {
                name: 'test-task',
                taskRef: {
                  resolver: 'cluster',
                  params: [
                    { name: 'kind', value: 'task' },
                    { name: 'name', value: 'external-task-with-workspace' },
                    { name: 'namespace', value: PIPELINE_NAMESPACE },
                  ],
                },
                workspaces: [
                  { name: 'output', workspace: 'workspace' },
                  { name: 'second', workspace: 'workspace2' },
                ],
              },
            ],
          },
          {
            clusterResolverTasks: [workspaceTask],
          },
        )
          .then(hasResults)
          .catch(shouldHavePassed);
      });

      it('should pass if the task does not contain an optional workspaces', async () => {
        const clusterResolverTask = {
          ...workspaceTask,
          spec: {
            ...workspaceTask.spec,
            workspaces: [{ name: 'optional-workspace', optional: true }],
          },
        };
        await withFormData(
          {
            ...initialPipelineFormData,
            workspaces: [],
            tasks: [
              {
                name: 'test-task',
                taskRef: {
                  resolver: 'cluster',
                  params: [
                    { name: 'kind', value: 'task' },
                    { name: 'name', value: 'external-task-with-workspace' },
                    { name: 'namespace', value: PIPELINE_NAMESPACE },
                  ],
                },
                workspaces: [],
              },
            ],
          },
          {
            clusterResolverTasks: [clusterResolverTask],
          },
        )
          .then(hasResults)
          .catch(shouldHavePassed);
      });

      it('should fail if the task has a optional workspace but miss a required workspaces', async () => {
        const clusterResolverTask = {
          ...workspaceTask,
          spec: {
            ...workspaceTask.spec,
            workspaces: [
              { name: 'optional-workspace', optional: true },
              { name: 'required-workspace' },
            ],
          },
        };
        await withFormData(
          {
            ...initialPipelineFormData,
            workspaces: [{ name: 'workspace' }],
            tasks: [
              {
                name: 'test-task',
                taskRef: {
                  resolver: 'cluster',
                  params: [
                    { name: 'kind', value: 'task' },
                    { name: 'name', value: 'external-task-with-workspace' },
                    { name: 'namespace', value: PIPELINE_NAMESPACE },
                  ],
                },
                workspaces: [
                  { name: 'optional-workspace', workspace: 'workspace' },
                ],
              },
            ],
          },
          {
            clusterResolverTasks: [clusterResolverTask],
          },
        )
          .then(shouldHaveFailed)
          .catch(
            hasError(
              'formData.tasks[0].workspaces',
              getTaskErrorString(TaskErrorType.MISSING_WORKSPACES),
            ),
          );
      });

      it('should fail if the task contains all the required workspaces but a mismatch in name occurs', async () => {
        await withFormData(
          {
            ...initialPipelineFormData,
            workspaces: [{ name: 'name-change' }, { name: 'workspace2' }],
            tasks: [
              {
                name: 'test-task',
                taskRef: {
                  resolver: 'cluster',
                  params: [
                    { name: 'kind', value: 'task' },
                    { name: 'name', value: 'external-task-with-workspace' },
                    { name: 'namespace', value: PIPELINE_NAMESPACE },
                  ],
                },
                workspaces: [
                  { name: 'output', workspace: 'workspace' },
                  { name: 'second', workspace: 'workspace2' },
                ],
              },
            ],
          },
          {
            clusterResolverTasks: [workspaceTask],
          },
        )
          .then(shouldHaveFailed)
          .catch(
            hasError(
              'formData.tasks[0].workspaces[0].workspace',
              'Workspace name has changed; reselect.',
            ),
          );
      });

      it('should fail if the taskSpec requests a workspace', async () => {
        const taskSpecWithWorkspace = merge({}, embeddedTaskSpec, {
          workspaces: [{ name: 'test' }],
        });
        await withFormData({
          ...initialPipelineFormData,
          tasks: [{ name: 'test', taskSpec: taskSpecWithWorkspace }],
        })
          .then(shouldHaveFailed)
          .catch(
            hasError(
              'formData.tasks[0].workspaces',
              getTaskErrorString(TaskErrorType.MISSING_WORKSPACES),
            ),
          );
      });

      it('should pass if the taskSpec requests a workspace and it is provided', async () => {
        const taskSpecWithWorkspace = merge({}, embeddedTaskSpec, {
          workspaces: [{ name: 'test' }],
        });
        await withFormData({
          ...initialPipelineFormData,
          workspaces: [{ name: 'workspace' }],
          tasks: [
            {
              name: 'test',
              taskSpec: taskSpecWithWorkspace,
              workspaces: [{ name: 'test', workspace: 'workspace' }],
            },
          ],
        })
          .then(hasResults)
          .catch(shouldHavePassed);
      });
    });
    describe('Validate When Expresssions', () => {
      const invalidWhenExpressionCheck = hasError(
        'formData.tasks[0].when',
        getTaskErrorString(TaskErrorType.MISSING_REQUIRED_WHEN_EXPRESSIONS),
      );

      it('should fail if the when expression is missing input value', async () => {
        await withFormData({
          ...initialPipelineFormData,
          tasks: [
            {
              name: 'test-task',
              when: [{ input: '', operator: 'in', values: ['test-value'] }],
            },
          ],
        })
          .then(shouldHaveFailed)
          .catch(invalidWhenExpressionCheck);
      });

      it('should fail if the when expression is missing operator value', async () => {
        await withFormData({
          ...initialPipelineFormData,
          tasks: [
            {
              name: 'test-task',
              when: [
                {
                  input: '$(params.test)',
                  operator: 'in',
                  values: ['test-values'],
                },
                { input: '$(params.test)', operator: '', values: ['value-2'] },
              ],
            },
          ],
        })
          .then(shouldHaveFailed)
          .catch(invalidWhenExpressionCheck);
      });

      it('should fail if the when expression is missing values', async () => {
        await withFormData({
          ...initialPipelineFormData,
          tasks: [
            {
              name: 'test-task',
              when: [
                {
                  input: '$(params.test)',
                  operator: 'in',
                  values: ['test-values'],
                },
                { input: '$(params.test)', operator: 'in', values: [''] },
              ],
            },
          ],
        })
          .then(shouldHaveFailed)
          .catch(invalidWhenExpressionCheck);
      });

      it('should fail if the when expression has partial missing values', async () => {
        await withFormData({
          ...initialPipelineFormData,
          tasks: [
            {
              name: 'test-task',
              when: [
                {
                  input: '$(params.test)',
                  operator: 'in',
                  values: ['test-values'],
                },
                {
                  input: '$(params.test)',
                  operator: 'in',
                  values: ['value-2', ''],
                },
              ],
            },
          ],
        })
          .then(shouldHaveFailed)
          .catch(invalidWhenExpressionCheck);
      });

      it('should pass if the when expression is valid', async () => {
        await withFormData({
          ...initialPipelineFormData,
          tasks: [
            {
              name: 'test-task',
              taskSpec: embeddedTaskSpec,
              when: [
                {
                  input: '$(params.test)',
                  operator: 'in',
                  values: ['test-values'],
                },
                {
                  input: '$(params.test)',
                  operator: 'in',
                  values: ['test-value-two'],
                },
              ],
            },
          ],
        })
          .then(hasResults)
          .catch(shouldHavePassed);
      });
    });
  });
});
