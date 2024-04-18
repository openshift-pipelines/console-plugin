import * as React from 'react';
import { ButtonProps, NumberInput } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

export const NumberSpinner: React.FC<NumberSpinnerProps> = ({
  className,
  changeValueBy,
  min,
  value,
  ...inputProps
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  return (
    <div className="co-m-number-spinner">
      <NumberInput
        min={min}
        value={value}
        onMinus={() => changeValueBy(-1)}
        onChange={inputProps.onChange}
        onPlus={() => changeValueBy(1)}
        inputProps={{ ...inputProps }}
        className={className}
        minusBtnAriaLabel={t('Decrement')}
        minusBtnProps={{ 'data-test-id': 'Decrement' } as ButtonProps}
        plusBtnAriaLabel={t('Increment')}
        plusBtnProps={{ 'data-test-id': 'Increment' } as ButtonProps}
        isDisabled={inputProps.disabled}
      />
    </div>
  );
};

type NumberSpinnerProps = {
  value: number;
  className?: string;
  changeValueBy: (operation: number) => void;
  min?: number;
} & React.HTMLProps<HTMLInputElement>;
