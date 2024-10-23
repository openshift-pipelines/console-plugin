import * as React from 'react';
import {
  TextInput,
  TextInputProps,
  TextInputTypes,
} from '@patternfly/react-core';
import BaseInputField from './BaseInputField';
import { BaseInputFieldProps } from './types';

import './InputField.scss';

const renderFunction = (
  {
    type = TextInputTypes.text,
    ...baseProps
  }: BaseInputFieldProps & Omit<TextInputProps, 'type' | 'validated'>,
  ref: React.Ref<HTMLInputElement>,
) => (
  <BaseInputField type={type} {...baseProps}>
    {(props) => (
      <TextInput ref={ref} {...props} value={baseProps.value ?? props.value} />
    )}
  </BaseInputField>
);

renderFunction.displayName = 'InputField';
const InputField: React.ForwardRefExoticComponent<
  BaseInputFieldProps & React.RefAttributes<HTMLInputElement>
> = React.forwardRef(renderFunction);

export default InputField;
