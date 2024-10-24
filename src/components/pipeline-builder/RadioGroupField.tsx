import * as React from 'react';
import {
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
} from '@patternfly/react-core';
import classNames from 'classnames';
import { useField } from 'formik';
import { getFieldId } from '../pipelines-details/multi-column-field/utils';
import { RedExclamationCircleIcon } from '@openshift-console/dynamic-plugin-sdk';
import RadioButtonField from './RadioButtonField';
import { FieldProps } from '../pipelines-details/multi-column-field/types';

import './RadioGroupField.scss';

interface RadioGroupOption {
  value: React.ReactText;
  label: React.ReactNode;
  isDisabled?: boolean;
  isChecked?: boolean;
  children?: React.ReactNode;
  activeChildren?: React.ReactElement;
}

interface RadioGroupFieldProps extends FieldProps {
  isInline?: boolean;
  labelIcon?: React.ReactElement;
  options: RadioGroupOption[];
  onChange?: (value: React.ReactText) => void;
}

const RadioGroupField: React.FC<RadioGroupFieldProps> = ({
  label,
  labelIcon,
  options,
  helpText,
  required,
  isInline,
  onChange,
  ...props
}) => {
  const [field, { touched, error }] = useField(props.name);
  const fieldId = getFieldId(props.name, 'radiogroup');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';
  return (
    <FormGroup
      className={classNames('ocs-radio-group-field', {
        'ocs-radio-group-field--inline': isInline,
      })}
      fieldId={fieldId}
      isRequired={required}
      label={label}
      labelIcon={labelIcon}
      isInline={isInline}
    >
      {options.map((option) => {
        const activeChild =
          field.value === option.value && option.activeChildren;
        const staticChild = option.children;

        const description = (activeChild || staticChild) && (
          <div className="ocs-radio-group-field__children">
            {staticChild}
            {activeChild}
          </div>
        );

        return (
          <React.Fragment key={option.value}>
            <RadioButtonField
              {...field}
              {...props}
              value={option.value}
              label={option.label}
              isDisabled={option.isDisabled}
              isChecked={option.isChecked}
              aria-describedby={helpText ? `${fieldId}-helper` : undefined}
              description={description}
              onChange={onChange}
            />
          </React.Fragment>
        );
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

export default RadioGroupField;
