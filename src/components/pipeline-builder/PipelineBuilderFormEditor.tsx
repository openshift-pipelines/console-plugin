import * as React from 'react';
import { FormGroup, TextInputTypes } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import PipelineBuilderVisualization from './PipelineBuilderVisualization';
import {
  PipelineBuilderTaskResources,
  PipelineBuilderTaskGroup,
  SelectTaskCallback,
  UpdateTasksCallback,
  TaskSearchCallback,
} from './types';
import InputField from '../pipelines-details/multi-column-field/InputField';
import PipelineParameters from '../pipelines-details/PipelineParameters';
import PipelineWorkspaces from './PipelineWorkspaces';

import './PipelineBuilderForm.scss';

type PipelineBuilderFormEditorProps = {
  hasExistingPipeline: boolean;
  taskGroup: PipelineBuilderTaskGroup;
  taskResources: PipelineBuilderTaskResources;
  onTaskSelection: SelectTaskCallback;
  onTaskSearch: TaskSearchCallback;
  onUpdateTasks: UpdateTasksCallback;
};

const PipelineBuilderFormEditor: React.FC<PipelineBuilderFormEditorProps> = (
  props,
) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const {
    hasExistingPipeline,
    taskGroup,
    taskResources,
    onTaskSelection,
    onUpdateTasks,
    onTaskSearch,
  } = props;

  return (
    <>
      <div className="opp-pipeline-builder-form__short-section">
        <InputField
          label={t('Name')}
          name="formData.name"
          type={TextInputTypes.text}
          isDisabled={hasExistingPipeline}
          required
        />
      </div>

      <FormGroup label={t('Tasks')} isRequired>
        <PipelineBuilderVisualization
          onTaskSelection={onTaskSelection}
          onUpdateTasks={onUpdateTasks}
          onTaskSearch={onTaskSearch}
          taskGroup={taskGroup}
          taskResources={taskResources}
        />
      </FormGroup>

      <FormGroup
        label={t('Parameters')}
        className="pipelines-console-plugin__page-section-width"
      >
        <PipelineParameters
          fieldName="formData.params"
          addLabel={t('Add parameter')}
          nameLabel={t('Name')}
          nameFieldName="name"
          descriptionLabel={t('Description')}
          descriptionFieldName="description"
          valueLabel={t('Default value')}
          valueFieldName="default"
          emptyMessage={t('No parameters are associated with this Pipeline.')}
          emptyValues={{ name: '', description: '', default: '' }}
          className="pf-v6-u-p-0"
        />
      </FormGroup>

      <FormGroup label={t('Workspaces')}>
        <PipelineWorkspaces
          addLabel={t('Add workspace')}
          fieldName="formData.workspaces"
        />
      </FormGroup>
    </>
  );
};

export default PipelineBuilderFormEditor;
