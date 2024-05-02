import * as React from 'react';
import {
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
} from '@patternfly/react-core';
import cx from 'classnames';
import { useField, useFormikContext, FormikValues } from 'formik';
import { FieldProps } from '../pipelines-details/multi-column-field/types';
import { getFieldId } from '../pipelines-details/multi-column-field/utils';
import { useFormikValidationFix } from '../pipelines-details/multi-column-field/formik-validation-fix';
import { Dropdown } from './dropdown';
import { RedExclamationCircleIcon } from '@openshift-console/dynamic-plugin-sdk';

export interface DropdownFieldProps extends FieldProps {
  items?: object;
  selectedKey?: string;
  title?: React.ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  autocompleteFilter?: (text: string, item: object, key?: string) => boolean;
  onChange?: (value: string) => void;
  placeholder?: string;
}

const DropdownField: React.FC<DropdownFieldProps> = ({
  label,
  helpText,
  required,
  ...props
}) => {
  const [field, { touched, error }] = useField(props.name);
  const { setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const fieldId = getFieldId(props.name, 'dropdown');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';

  useFormikValidationFix(field.value);

  return (
    <FormGroup fieldId={fieldId} label={label} isRequired={required}>
      <Dropdown
        {...props}
        id={fieldId}
        selectedKey={field.value}
        dropDownClassName={cx({ 'dropdown--full-width': props.fullWidth })}
        aria-describedby={helpText ? `${fieldId}-helper` : undefined}
        onChange={(value: string) => {
          props.onChange && props.onChange(value);
          // Validation is automatically done by the useFormikValidationFix above
          setFieldValue(props.name, value, false);
          setFieldTouched(props.name, true, false);
        }}
      />

      <FormHelperText>
        <HelperText>
          {!isValid ? (
            <HelperTextItem variant="error" icon={<RedExclamationCircleIcon />}>
              {errorMessage}
            </HelperTextItem>
          ) : (
            <HelperTextItem>{helpText}</HelperTextItem>
          )}
        </HelperText>
      </FormHelperText>
    </FormGroup>
  );
};

export default DropdownField;
