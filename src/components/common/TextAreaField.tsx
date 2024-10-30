import * as React from 'react';
import {
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  TextArea,
} from '@patternfly/react-core';
import { useField } from 'formik';
import { FieldProps } from '../pipelines-details/multi-column-field/types';
import { getFieldId } from '../pipelines-details/multi-column-field/utils';

export interface TextAreaProps extends FieldProps {
  placeholder?: string;
  onChange?: (event) => void;
  onBlur?: (event) => void;
  rows?: number;
  resizeOrientation?: 'vertical' | 'horizontal' | 'both';
}

const TextAreaField = (
  { label, helpText, required, onChange, ...props },
  ref,
) => {
  const [field, { touched, error }] = useField(props.name);
  const fieldId = getFieldId(props.name, 'input');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';
  return (
    <FormGroup fieldId={fieldId} label={label} isRequired={required}>
      <TextArea
        {...field}
        {...props}
        ref={ref}
        id={fieldId}
        style={{ resize: 'vertical' }}
        validated={isValid ? 'default' : 'error'}
        isRequired={required}
        aria-describedby={helpText ? `${fieldId}-helper` : undefined}
        onChange={(event, value) => {
          onChange && onChange(value);
          field.onChange(event);
        }}
      />
      <FormHelperText>
        <HelperText>
          <HelperTextItem variant={!isValid ? 'error' : 'default'}>
            {!isValid ? errorMessage : helpText}
          </HelperTextItem>
        </HelperText>
      </FormHelperText>
    </FormGroup>
  );
};

export default React.forwardRef(TextAreaField);
