import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import MultiColumnField from '../pipelines-details/multi-column-field/MultiColumnField';
import InputField from '../pipelines-details/multi-column-field/InputField';
import { TextInputTypes } from '@patternfly/react-core';
import DropdownField from '../common/DropdownField';
import PVCDropdownForm from '../common/PVCDropdown';
import CheckboxField from './CheckboxField';
import { VolumeTypes } from '../../consts';

type PipelineWorkspacesParam = {
  addLabel?: string;
  fieldName: string;
  isReadOnly?: boolean;
};

const PipelineWorkspaces: FC<PipelineWorkspacesParam> = (props) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const {
    addLabel = t('Add Pipeline workspace'),
    fieldName,
    isReadOnly = false,
  } = props;
  const emptyMessage = t('No workspaces are associated with this pipeline.');

  const volumeTypeOptions: { [VolumeTypes.PVC]: string } = {
    [VolumeTypes.PVC]: t('PersistentVolumeClaim'),
  };
  return (
    <div className="co-m-pane__form pipeline-workspaces">
      <MultiColumnField
        data-test="pipeline-workspaces"
        name={fieldName}
        addLabel={addLabel}
        headers={[
          { name: t('Name'), required: true },
          { name: t('Type'), required: false },
          { name: t('Default value'), required: false },
        ]}
        emptyValues={{ name: '', type: VolumeTypes.PVC, optional: false }}
        emptyMessage={emptyMessage}
        isReadOnly={isReadOnly}
        spans={[4, 4, 4, 4]}
      >
        <InputField
          data-test="name"
          name="name"
          type={TextInputTypes.text}
          placeholder={t('Name')}
          isReadOnly={isReadOnly}
          aria-label={t('Name')}
        />
        <DropdownField name="type" items={volumeTypeOptions} disabled />
        <PVCDropdownForm name="claimName" isFullWidth />
        <CheckboxField
          name="optional"
          label={t('Optional workspace')}
          className="pf-v6-u-mt-sm"
        />
      </MultiColumnField>
    </div>
  );
};

export default PipelineWorkspaces;
