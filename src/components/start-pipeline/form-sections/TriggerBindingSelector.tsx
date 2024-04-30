import * as React from 'react';
import { useFormikContext, useField, FormikValues } from 'formik';
import * as fuzzy from 'fuzzysearch';
import { useTranslation } from 'react-i18next';
import { AddTriggerFormValues, TriggerBindingKind } from '../../../types';
import {
  ClusterTriggerBindingModel,
  TriggerBindingModel,
} from '../../../models';
import ResourceDropdown from '../../common/ResourceDropdown';
import { getReferenceForModel } from '../../pipelines-overview/utils';
import {
  K8sResourceKind,
  RedExclamationCircleIcon,
  useK8sWatchResources,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
} from '@patternfly/react-core';
import { getFieldId } from '../../pipelines-details/multi-column-field/utils';
import { useFormikValidationFix } from '../../pipelines-details/multi-column-field/formik-validation-fix';

type TriggerBindingSelectorProps = {
  description?: string;
  label?: string;
  onChange: (selectedTriggerBinding: TriggerBindingKind) => void;
};

const KEY_DIVIDER = '~';

const TriggerBindingSelector: React.FC<TriggerBindingSelectorProps> = (
  props,
) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const {
    description,
    label = t(TriggerBindingModel.labelKey),
    onChange,
  } = props;
  const { values } = useFormikContext<AddTriggerFormValues>();
  const [field, { touched, error }] = useField('triggerBinding.name');
  const { setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const fieldId = getFieldId('triggerBinding.name', 'ns-dropdown');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';
  useFormikValidationFix(field.value);

  const autoCompleteFilter = (
    strText: string,
    item: React.ReactElement,
  ): boolean => fuzzy(strText, item?.props?.name);
  const onTriggerChange = (
    key: string,
    value: string,
    selectedResource: TriggerBindingKind,
  ) => {
    if (selectedResource) {
      onChange && onChange(selectedResource);
    }
    setFieldValue('triggerBinding.name', value);
    setFieldTouched('triggerBinding.name', true);
  };

  const resources = {
    triggerBindingData: {
      isList: true,
      namespace: values.namespace,
      kind: getReferenceForModel(TriggerBindingModel),
      optional: true,
    },
    clusterTriggerBindingData: {
      isList: true,
      kind: getReferenceForModel(ClusterTriggerBindingModel),
      optional: true,
    },
  };
  const triggerBindings = useK8sWatchResources<{
    triggerBindingData: TriggerBindingKind[];
    clusterTriggerBindingData: K8sResourceKind[];
  }>(resources);

  return (
    <FormGroup fieldId={fieldId} label={label} isRequired>
      <ResourceDropdown
        name="triggerBinding.name"
        resources={[
          {
            kind: TriggerBindingModel.kind,
            loaded: triggerBindings.triggerBindingData.loaded,
            loadError: triggerBindings.triggerBindingData.loadError,
            data: triggerBindings.triggerBindingData.data,
          },
          {
            kind: ClusterTriggerBindingModel.kind,
            loaded: triggerBindings.clusterTriggerBindingData.loaded,
            loadError: triggerBindings.clusterTriggerBindingData.loadError,
            data: triggerBindings.clusterTriggerBindingData.data,
          },
        ]}
        loaded={
          triggerBindings.clusterTriggerBindingData.loaded ||
          triggerBindings.triggerBindingData.loaded
        }
        loadError={triggerBindings.triggerBindingData.loadError}
        autocompleteFilter={autoCompleteFilter}
        dataSelector={['metadata', 'name']}
        dropDownClassName="dropdown--full-width"
        customResourceKey={(key: string, resource: K8sResourceKind) => {
          const { kind } = resource;
          const order = kind === ClusterTriggerBindingModel.kind ? 2 : 1;
          return `${order}${KEY_DIVIDER}${key}`;
        }}
        placeholder={t('Select {{label}}', { label })}
        title={t('Select {{label}}', { label })}
        showBadge
        onChange={onTriggerChange}
      />
      <FormHelperText>
        <HelperText>
          {!isValid ? (
            <HelperTextItem variant="error" icon={<RedExclamationCircleIcon />}>
              {errorMessage}
            </HelperTextItem>
          ) : (
            <HelperTextItem>{description}</HelperTextItem>
          )}
        </HelperText>
      </FormHelperText>
    </FormGroup>
  );
};

export default TriggerBindingSelector;
