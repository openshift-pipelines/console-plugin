import * as React from 'react';
import {
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
} from '@patternfly/react-core';
import { useField } from 'formik';
import { FieldProps } from '../pipelines-details/multi-column-field/types';
import { getFieldId } from '../pipelines-details/multi-column-field/utils';
import { RedExclamationCircleIcon } from '@openshift-console/dynamic-plugin-sdk';

export interface CheckboxFieldProps extends FieldProps {
  formLabel?: string;
  value?: string;
  onChange?: (val: boolean) => void;
}

type ToggleableFieldBaseProps = CheckboxFieldProps & {
  children: (props) => React.ReactNode;
};

const ToggleableFieldBase: React.FC<ToggleableFieldBaseProps> = ({
  label,
  formLabel,
  helpText,
  required,
  children,
  value,
  onChange,
  name,
  ...props
}) => {
  const [field, { touched, error }] = useField({
    value,
    name,
    type: 'checkbox',
  });
  const fieldId = getFieldId(name, 'checkbox');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';

  return (
    <FormGroup fieldId={fieldId} label={formLabel} isRequired={required}>
      {children({
        ...field,
        ...props,
        value: field.value ?? false,
        id: fieldId,
        label,
        isChecked: field.checked,
        isValid,
        'aria-describedby': helpText ? `${fieldId}-helper` : undefined,
        onChange: (event, val) => {
          field.onChange(event);
          onChange && onChange(val);
        },
      })}

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

export default ToggleableFieldBase;
