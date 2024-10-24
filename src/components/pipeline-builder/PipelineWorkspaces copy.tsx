import * as React from 'react';
import { useTranslation } from 'react-i18next';
import OptionalableWorkspace from './OptionalableWorkspace';
import MultiColumnField from '../pipelines-details/multi-column-field/MultiColumnField';

type PipelineWorkspacesParam = {
  addLabel?: string;
  fieldName: string;
  isReadOnly?: boolean;
};

const PipelineWorkspaces: React.FC<PipelineWorkspacesParam> = (props) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const {
    addLabel = t('Add Pipeline workspace'),
    fieldName,
    isReadOnly = false,
  } = props;
  const emptyMessage = t('No workspaces are associated with this pipeline.');
  return (
    <div className="co-m-pane__form">
      <MultiColumnField
        data-test="pipeline-workspaces"
        name={fieldName}
        addLabel={addLabel}
        headers={[{ name: t('Name'), required: true }]}
        emptyValues={{ name: '', optional: false }}
        emptyMessage={emptyMessage}
        isReadOnly={isReadOnly}
        complexFields={[true]}
      >
        <OptionalableWorkspace />
      </MultiColumnField>
    </div>
  );
};

export default PipelineWorkspaces;
