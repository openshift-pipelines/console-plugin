/* eslint-disable no-unused-vars, no-undef */
import * as React from 'react';
import { Checkbox } from '@patternfly/react-core';
import ToggleableFieldBase, { CheckboxFieldProps } from './ToggleableFieldBase';

const CheckboxField: React.FC<CheckboxFieldProps> = (baseProps) => (
  <ToggleableFieldBase {...baseProps}>
    {(props) => <Checkbox {...props} data-checked-state={props.isChecked} />}
  </ToggleableFieldBase>
);

export default CheckboxField;
