import * as React from 'react';
import {
  TextInput,
  TextInputProps,
  TextInputTypes,
} from '@patternfly/react-core';
import BaseInputField from './BaseInputField';
import { BaseInputFieldProps } from './types';

import './InputField.scss';

// const InputField: React.FC<BaseInputFieldProps> = (
//   { type = TextInputTypes.text, ...baseProps },
//   ref,
// ) => (
//   <BaseInputField type={type} {...baseProps}>
//     {(props) => (
//       <div className="oc-inputfield">
//         <TextInput ref={ref} {...props} />
//         {props.validated && props.validated !== ValidatedOptions.default ? (
//           <div
//             className={`oc-inputfield__validation-icon ${props.validated}`}
//             // The BaseInputField will show an description (helper-text) below
//             // the input field that describes the validation error.
//             aria-hidden="true"
//           />
//         ) : null}
//       </div>
//     )}
//   </BaseInputField>
// );

// export default React.forwardRef(InputField);

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
  BaseInputFieldProps &
    React.RefAttributes<HTMLInputElement> &
    Omit<TextInputProps, 'type' | 'validated'>
> = React.forwardRef(renderFunction);

export default InputField;
