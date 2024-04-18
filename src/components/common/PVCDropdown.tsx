import * as React from 'react';
import * as fuzzy from 'fuzzysearch';
import { useTranslation } from 'react-i18next';
import {
  K8sResourceKind,
  RedExclamationCircleIcon,
  useActiveNamespace,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { useField, useFormikContext, FormikValues } from 'formik';
import cx from 'classnames';
import { PersistentVolumeClaimModel } from '../../models';
import ResourceDropdown from './ResourceDropdown';
import {
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
} from '@patternfly/react-core';
import { getFieldId } from '../pipelines-details/multi-column-field/utils';
import { useFormikValidationFix } from '../pipelines-details/multi-column-field/formik-validation-fix';
import './PVCDropdown.scss';

interface PVCDropdownProps {
  name: string;
}

const PVCDropdown: React.FC<PVCDropdownProps> = ({ name }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [field, { touched, error }] = useField(name);
  const { setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const fieldId = getFieldId(name, 'ns-dropdown');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';

  useFormikValidationFix(field.value);
  const [namespace] = useActiveNamespace();
  const autocompleteFilter = (strText, item): boolean =>
    fuzzy(strText, item?.props?.name);
  const resource = {
    isList: true,
    kind: PersistentVolumeClaimModel.kind,
    namespace,
    optional: true,
  };
  const [resources, loaded, loadError] = useK8sWatchResource(resource);
  return (
    <>
      <FormGroup fieldId={fieldId} isRequired data-test="pvc-dropdown">
        <ResourceDropdown
          resources={[
            {
              kind: PersistentVolumeClaimModel.kind,
              loaded,
              loadError,
              data: resources as K8sResourceKind[],
            },
          ]}
          loaded={loaded}
          loadError={loadError}
          dataSelector={['metadata', 'name']}
          selectedKey={field.value}
          placeholder={t('Select a PVC')}
          autocompleteFilter={autocompleteFilter}
          dropDownClassName={cx({ 'dropdown--full-width': true })}
          onChange={(value: string) => {
            setFieldValue(name, value);
            setFieldTouched(name, true);
          }}
          showBadge
        />
        <FormHelperText>
          <HelperText>
            {!isValid && (
              <HelperTextItem
                variant="error"
                icon={<RedExclamationCircleIcon />}
              >
                {errorMessage}
              </HelperTextItem>
            )}
          </HelperText>
        </FormHelperText>
      </FormGroup>
    </>
  );
};

export default PVCDropdown;
