import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
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

      <div>
        <h2>
          {t('Tasks')}
          <span className="pf-c-form__label-required">*</span>
        </h2>
        <PipelineBuilderVisualization
          onTaskSelection={onTaskSelection}
          onUpdateTasks={onUpdateTasks}
          onTaskSearch={onTaskSearch}
          taskGroup={taskGroup}
          taskResources={taskResources}
        />
      </div>

      <div>
        <h2>{t('Parameters')}</h2>
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
        />
      </div>

      <div>
        <h2>{t('Workspaces')}</h2>
        <PipelineWorkspaces
          addLabel={t('Add workspace')}
          fieldName="formData.workspaces"
        />
      </div>
    </>
  );
};

export default PipelineBuilderFormEditor;
