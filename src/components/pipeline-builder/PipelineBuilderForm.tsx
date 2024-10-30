import * as React from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerContentBody,
} from '@patternfly/react-core';
import { FormikProps } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { PipelineModel } from '../../models';
import {
  PipelineKind,
  PipelineTask,
  SelectedBuilderTask,
  TaskKind,
} from '../../types';
import { STATUS_KEY_NAME_ERROR, UpdateOperationType } from './const';
import { sanitizeToForm, sanitizeToYaml } from './form-switcher-validation';
import {
  useExplicitPipelineTaskTouch,
  useFormikFetchAndSaveTasks,
} from './hooks';
import RemoveTaskModal from './modals';
import PipelineBuilderFormEditor from './PipelineBuilderFormEditor';
import PipelineBuilderHeader from './PipelineBuilderHeader';
import TaskSidebar from './task-sidebar/TaskSidebar';
import {
  CleanupResults,
  PipelineBuilderTaskGroup,
  UpdateOperationRenameTaskData,
  PipelineBuilderFormikValues,
  TaskType,
  TaskSearchCallback,
  EditorType,
} from './types';
import { applyChange } from './update-utils';

import './PipelineBuilderForm.scss';
import CodeEditorField from './CodeEditorField';
import FormFooter from '../pipelines-details/multi-column-field/FormFooter';
import { FlexForm, FormBody } from './form-utils';
import SyncedEditorField from './SyncedEditorField';
import PipelineQuickSearch from '../task-quicksearch/PipelineQuickSearch';
import { useModal } from '@openshift-console/dynamic-plugin-sdk';

type PipelineBuilderFormProps = FormikProps<PipelineBuilderFormikValues> & {
  existingPipeline: PipelineKind;
  namespace: string;
};

const PipelineBuilderForm: React.FC<PipelineBuilderFormProps> = (props) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const launchModal = useModal();
  const [selectedTask, setSelectedTask] =
    React.useState<SelectedBuilderTask>(null);
  const selectedTaskRef = React.useRef<SelectedBuilderTask>(null);
  selectedTaskRef.current = selectedTask;
  const contentRef = React.useRef<HTMLDivElement>(null);

  const {
    existingPipeline,
    status,
    isSubmitting,
    dirty,
    handleReset,
    handleSubmit,
    errors,
    namespace,
    setFieldValue,
    values: { editorType, formData, taskResources },
    validateForm,
  } = props;
  useFormikFetchAndSaveTasks(namespace, validateForm);
  useExplicitPipelineTaskTouch();

  const statusRef = React.useRef(status);
  const [menuOpen, setMenuOpen] = React.useState<boolean>(false);
  const savedCallback = React.useRef(() => {});

  statusRef.current = status;

  const resetSelectedTask = (): void => {
    setSelectedTask(null);
    selectedTaskRef.current = null;
  };
  const onTaskSearch: TaskSearchCallback = (callback: () => void): void => {
    setMenuOpen(true);
    resetSelectedTask();
    savedCallback.current = callback;
  };
  const onTaskSelection = (
    task: PipelineTask,
    resource: TaskKind,
    isFinallyTask: boolean,
  ) => {
    const builderNodes = isFinallyTask ? formData.finallyTasks : formData.tasks;
    setSelectedTask({
      isFinallyTask,
      taskIndex: builderNodes.findIndex(({ name }) => name === task.name),
      resource,
    });
  };

  const updateTasks = (changes: CleanupResults): void => {
    const { tasks, listTasks, finallyTasks, finallyListTasks, loadingTasks } =
      changes;

    setFieldValue('formData', {
      ...formData,
      tasks,
      listTasks,
      loadingTasks,
      finallyTasks,
      finallyListTasks,
    });
  };

  const nodeType: TaskType = selectedTask?.isFinallyTask
    ? 'finallyTasks'
    : 'tasks';
  const selectedId = formData[nodeType][selectedTask?.taskIndex]?.name;
  const selectedIds = selectedId ? [selectedId] : [];

  const taskGroup: PipelineBuilderTaskGroup = {
    tasks: formData.tasks,
    listTasks: formData.listTasks,
    loadingTasks: formData.loadingTasks,
    highlightedIds: selectedIds,
    finallyTasks: formData.finallyTasks,
    finallyListTasks: formData.finallyListTasks,
  };

  const onUpdateTasks = (updatedTaskGroup, op) => {
    updateTasks(applyChange(updatedTaskGroup, op));
  };

  const closeSidebarAndHandleReset = React.useCallback(() => {
    resetSelectedTask();
    handleReset();
  }, [handleReset]);

  const LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY =
    'pipeline.pipelineBuilderForm.editor.lastView';

  const formEditor = (
    <PipelineBuilderFormEditor
      hasExistingPipeline={!!existingPipeline}
      taskGroup={taskGroup}
      taskResources={taskResources}
      onTaskSelection={onTaskSelection}
      onTaskSearch={onTaskSearch}
      onUpdateTasks={onUpdateTasks}
    />
  );

  const yamlEditor = (
    <CodeEditorField
      name="yamlData"
      model={PipelineModel}
      showSamples={!existingPipeline}
      onSave={handleSubmit}
    />
  );

  const closeRef = React.useCallback(() => {
    if (!!contentRef.current && !!selectedTask) {
      const currentSelection: SelectedBuilderTask = selectedTaskRef.current;
      setTimeout(() => {
        if (
          currentSelection?.taskIndex === selectedTaskRef.current?.taskIndex &&
          currentSelection?.isFinallyTask ===
            selectedTaskRef.current?.isFinallyTask
        ) {
          // Clicked on itself or on a non-node
          setSelectedTask(null);
        }
      }, 0); // let the click logic flow through
    }
  }, [selectedTask]);

  return (
    <Drawer isExpanded={!!selectedTask} position="right">
      <DrawerContent
        panelContent={
          selectedTask ? (
            <TaskSidebar
              // Intentional remount when selection changes
              key={selectedTask?.taskIndex}
              onClose={() => setSelectedTask(null)}
              resourceList={formData.resources || []}
              workspaceList={formData.workspaces || []}
              errorMap={status?.tasks || {}}
              onRenameTask={(data: UpdateOperationRenameTaskData) => {
                updateTasks(
                  applyChange(taskGroup, {
                    type: UpdateOperationType.RENAME_TASK,
                    data,
                  }),
                );
              }}
              onRemoveTask={(taskName: string) => {
                launchModal(RemoveTaskModal, {
                  taskName,
                  onRemove: () => {
                    setSelectedTask(null);
                    updateTasks(
                      applyChange(taskGroup, {
                        type: UpdateOperationType.REMOVE_TASK,
                        data: { taskName },
                      }),
                    );
                  },
                });
              }}
              selectedData={selectedTask}
            />
          ) : null
        }
      >
        <DrawerContentBody onClick={closeRef}>
          <div
            className="opp-pipeline-builder ocs-quick-search-modal__no-backdrop"
            ref={contentRef}
          >
            <PipelineBuilderHeader />
            <FlexForm
              className="opp-pipeline-builder-form"
              onSubmit={handleSubmit}
            >
              <div className="opp-pipeline-builder-form__content">
                <FormBody
                  flexLayout
                  disablePaneBody
                  className="co-m-pane__body co-m-pane__body--no-top-margin"
                >
                  <PipelineQuickSearch
                    namespace={namespace}
                    viewContainer={contentRef.current}
                    isOpen={menuOpen}
                    callback={savedCallback.current}
                    setIsOpen={(open) => setMenuOpen(open)}
                    onUpdateTasks={onUpdateTasks}
                    taskGroup={taskGroup}
                  />
                  <SyncedEditorField
                    noMargin
                    name="editorType"
                    formContext={{
                      name: 'formData',
                      editor: formEditor,
                      label: t('Pipeline builder'),
                      sanitizeTo: (yamlPipeline: PipelineKind) =>
                        sanitizeToForm(formData, yamlPipeline),
                    }}
                    yamlContext={{
                      name: 'yamlData',
                      editor: yamlEditor,
                      sanitizeTo: () =>
                        sanitizeToYaml(formData, namespace, existingPipeline),
                    }}
                    lastViewUserSettingKey={
                      LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY
                    }
                  />
                </FormBody>
              </div>
              <FormFooter
                handleReset={closeSidebarAndHandleReset}
                errorMessage={status?.submitError}
                isSubmitting={isSubmitting}
                submitLabel={existingPipeline ? t('Save') : t('Create')}
                disableSubmit={
                  editorType === EditorType.YAML
                    ? !dirty
                    : !dirty ||
                      !_.isEmpty(errors) ||
                      !_.isEmpty(status?.tasks) ||
                      !_.isEmpty(status?.[STATUS_KEY_NAME_ERROR]) ||
                      formData.tasks.length === 0 ||
                      formData.loadingTasks.length > 0
                }
                resetLabel={t('Cancel')}
                sticky
              />
            </FlexForm>
          </div>
        </DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
};

export default PipelineBuilderForm;
