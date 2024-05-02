import * as React from 'react';
import { Alert, FormSection } from '@patternfly/react-core';
import { useFormikContext, FormikValues, useField } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import './PipelineWorkspacesSection.scss';
import { VolumeTypes } from '../../../consts';
import { ConfigMapModel, SecretModel } from '../../../models';
import { PipelineModalFormWorkspace } from '../types';
import MultipleResourceKeySelector from './MultipleResourceKeySelector';
import VolumeClaimTemplateForm from './VolumeClaimTemplateForm';
import DropdownField from '../../common/DropdownField';
import PVCDropdown from '../../common/PVCDropdown';
import { t } from '../../utils/common-utils';

const getVolumeTypeFields = (volumeType: VolumeTypes, index: number) => {
  switch (volumeType) {
    case VolumeTypes.Secret: {
      return (
        <MultipleResourceKeySelector
          resourceNameField={`workspaces.${index}.data.secret.secretName`}
          resourceKeysField={`workspaces.${index}.data.secret.items`}
          label={t('Secret')}
          resourceModel={SecretModel}
          addString={t('Add item')}
          required
        />
      );
    }
    case VolumeTypes.ConfigMap: {
      return (
        <MultipleResourceKeySelector
          resourceNameField={`workspaces.${index}.data.configMap.name`}
          resourceKeysField={`workspaces.${index}.data.configMap.items`}
          label={t('Config Map')}
          resourceModel={ConfigMapModel}
          addString={t('Add item')}
          required
        />
      );
    }
    case VolumeTypes.EmptyDirectory: {
      return (
        <div className="odc-PipelineWorkspacesSection__emptydir">
          <Alert
            isInline
            variant="info"
            title={t(
              "Empty Directory doesn't support shared data between tasks.",
            )}
          />
        </div>
      );
    }
    case VolumeTypes.VolumeClaimTemplate: {
      return (
        <VolumeClaimTemplateForm
          name={`workspaces.${index}.data.volumeClaimTemplate`}
          initialSizeValue="1"
          initialSizeUnit="Gi"
        />
      );
    }
    case VolumeTypes.PVC: {
      return (
        <PVCDropdown
          name={`workspaces.${index}.data.persistentVolumeClaim.claimName`}
        />
      );
    }
    default:
      return null;
  }
};

const PipelineWorkspacesSection: React.FC = () => {
  const { t } = useTranslation();
  const { setFieldValue } = useFormikContext<FormikValues>();
  const [{ value: workspaces }] =
    useField<PipelineModalFormWorkspace[]>('workspaces');

  const volumeTypeOptions: { [type in VolumeTypes]: string } = {
    [VolumeTypes.NoWorkspace]: t('No workspace'),
    [VolumeTypes.EmptyDirectory]: t('Empty Directory'),
    [VolumeTypes.ConfigMap]: t('Config Map'),
    [VolumeTypes.Secret]: t('Secret'),
    [VolumeTypes.PVC]: t('PersistentVolumeClaim'),
    [VolumeTypes.VolumeClaimTemplate]: t('VolumeClaimTemplate'),
  };

  return (
    workspaces.length > 0 && (
      <FormSection title={t('Workspaces')}>
        {workspaces.map((workspace, index) => {
          return (
            <div className="form-group" key={workspace.name}>
              <DropdownField
                name={`workspaces.${index}.type`}
                label={workspace.name}
                items={
                  workspace.optional
                    ? volumeTypeOptions
                    : _.omit(volumeTypeOptions, VolumeTypes.NoWorkspace)
                }
                onChange={(type) =>
                  setFieldValue(
                    `workspaces.${index}.data`,
                    type === VolumeTypes.EmptyDirectory ? { emptyDir: {} } : {},
                    // Validation is automatically done by DropdownField useFormikValidationFix
                    false,
                  )
                }
                fullWidth
                required={!workspace.optional}
                helpText={workspace.description}
              />
              {getVolumeTypeFields(workspace.type, index)}
            </div>
          );
        })}
      </FormSection>
    )
  );
};

export default PipelineWorkspacesSection;
