import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  InputGroup,
  InputGroupItem,
  NumberInput,
  Select,
  SelectOption,
  SelectList,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';

export const RequestSizeInput: React.FC<RequestSizeInputProps> = ({
  children,
  defaultRequestSizeUnit,
  defaultRequestSizeValue,
  describedBy,
  dropdownUnits,
  inputID,
  isInputDisabled,
  minValue,
  name,
  onChange,
  placeholder,
  required,
  testID,
  allowDecimalValue,
}) => {
  const parsedRequestSizeValue =
    typeof defaultRequestSizeValue === 'string'
      ? allowDecimalValue
        ? parseFloat(defaultRequestSizeValue)
        : parseInt(defaultRequestSizeValue, 10)
      : defaultRequestSizeValue;
  const defaultValue = Number.isFinite(parsedRequestSizeValue)
    ? parsedRequestSizeValue
    : 0;
  const [unit, setUnit] = React.useState<string>(defaultRequestSizeUnit);
  const [value, setValue] = React.useState<number>(defaultValue);
  const [isOpen, setIsOpen] = React.useState(false);

  const onValueChange = (event: React.FormEvent<HTMLInputElement>) => {
    const newValue = allowDecimalValue
      ? parseFloat(event.currentTarget.value)
      : parseInt(event.currentTarget.value, 10);
    const validValue = Number.isFinite(newValue) ? newValue : 0;
    setValue(validValue);
    onChange({ value: validValue, unit });
  };

  const onMinus = () => {
    const newValue = Number.isFinite(value) ? value - 1 : -1;
    setValue(newValue);
    onChange({ value: newValue, unit });
  };

  const onPlus = () => {
    const newValue = Number.isFinite(value) ? value + 1 : 1;
    setValue(newValue);
    onChange({ value: newValue, unit });
  };

  const onUnitChange = (
    _event: React.MouseEvent | undefined,
    newUnit: string | number | undefined,
  ) => {
    const unitValue = String(newUnit);
    setUnit(unitValue);
    setIsOpen(false);
    onChange({ value, unit: unitValue });
  };

  React.useEffect(() => {
    setUnit(defaultRequestSizeUnit);
    const numValue =
      typeof defaultValue === 'number'
        ? defaultValue
        : parseFloat(String(defaultValue));
    setValue(Number.isFinite(numValue) ? numValue : 0);
  }, [defaultRequestSizeUnit, defaultValue]);

  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const inputName = `${name}Value`;

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      onClick={() => setIsOpen(!isOpen)}
      isExpanded={isOpen}
      isDisabled={isInputDisabled}
      aria-label={t('Number of {{sizeUnit}}', {
        sizeUnit: dropdownUnits[unit],
      })}
    >
      {dropdownUnits[unit]}
    </MenuToggle>
  );

  return (
    <div>
      <InputGroup>
        <InputGroupItem>
          <NumberInput
            value={value}
            min={minValue}
            onMinus={onMinus}
            onChange={onValueChange}
            onPlus={onPlus}
            inputName={inputName}
            inputAriaLabel={inputName}
            minusBtnAriaLabel={t('Decrement')}
            plusBtnAriaLabel={t('Increment')}
            id={inputID}
            isDisabled={isInputDisabled}
            widthChars={10}
            inputProps={{
              'data-test': testID,
              'aria-describedby': describedBy,
              placeholder: placeholder,
              required: required,
            }}
          />
        </InputGroupItem>
        <InputGroupItem>
          <Select
            isOpen={isOpen}
            selected={unit}
            onSelect={onUnitChange}
            onOpenChange={setIsOpen}
            toggle={toggle}
            shouldFocusToggleOnSelect
          >
            <SelectList>
              {Object.keys(dropdownUnits).map((key) => (
                <SelectOption key={key} value={key}>
                  {dropdownUnits[key]}
                </SelectOption>
              ))}
            </SelectList>
          </Select>
        </InputGroupItem>
      </InputGroup>
      {children}
    </div>
  );
};

export type RequestSizeInputProps = {
  placeholder?: string;
  name: string;
  onChange: Function;
  required?: boolean;
  dropdownUnits: any;
  defaultRequestSizeUnit: string;
  defaultRequestSizeValue: number | string;
  describedBy?: string;
  step?: number;
  minValue?: number;
  inputID?: string;
  testID?: string;
  isInputDisabled?: boolean;
  allowDecimalValue?: boolean;
};
