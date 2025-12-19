import * as React from 'react';
import {
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Select,
  SelectOption,
  SelectList,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import { useField, useFormikContext, FormikValues } from 'formik';
import { FieldProps } from '../pipelines-details/multi-column-field/types';
import { getFieldId } from '../pipelines-details/multi-column-field/utils';
import { useFormikValidationFix } from '../pipelines-details/multi-column-field/formik-validation-fix';
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
  const [isOpen, setIsOpen] = React.useState(false);

  useFormikValidationFix(field.value);

  const onSelect = (
    _event: React.MouseEvent | undefined,
    value: string | number | undefined,
  ) => {
    const stringValue = String(value);
    props.onChange && props.onChange(stringValue);
    setFieldValue(props.name, stringValue, false);
    setFieldTouched(props.name, true, false);
    setIsOpen(false);
  };

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      onClick={() => setIsOpen(!isOpen)}
      isExpanded={isOpen}
      isDisabled={props.disabled}
      isFullWidth={props.fullWidth}
      aria-describedby={helpText ? `${fieldId}-helper` : undefined}
    >
      {props.items?.[field.value] ||
        props.title ||
        props.placeholder ||
        'Select...'}
    </MenuToggle>
  );

  return (
    <FormGroup fieldId={fieldId} label={label} isRequired={required}>
      <Select
        id={fieldId}
        isOpen={isOpen}
        selected={field.value}
        onSelect={onSelect}
        onOpenChange={setIsOpen}
        toggle={toggle}
        shouldFocusToggleOnSelect
      >
        <SelectList>
          {props.items &&
            Object.keys(props.items).map((key) => (
              <SelectOption key={key} value={key}>
                {props.items[key]}
              </SelectOption>
            ))}
        </SelectList>
      </Select>

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
