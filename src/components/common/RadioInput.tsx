import type { ReactNode, InputHTMLAttributes, FC } from 'react';
import { Radio } from '@patternfly/react-core';

export type RadioInputProps = {
  children?: ReactNode;
  checked: boolean;
  desc?: string | JSX.Element;
  onChange: (v: any) => void;
  subTitle?: string | JSX.Element;
  value: any;
  disabled?: boolean;
  title?: string;
  name?: string;
} & Omit<InputHTMLAttributes<any>, 'children'>;

export const RadioInput: FC<RadioInputProps> = (props) => {
  const {
    checked,
    desc,
    onChange,
    subTitle,
    value,
    disabled,
    title,
    name,
    children,
    ...rest
  } = props;

  const label = (
    <>
      {title}
      {subTitle && (
        <span className="pf-v6-u-font-weight-normal"> {subTitle}</span>
      )}
    </>
  );

  return (
    <div>
      <Radio
        id={`${name}-${value}`}
        name={name}
        label={label}
        description={desc}
        isChecked={checked}
        onChange={(event) => onChange(event)}
        value={value}
        isDisabled={disabled}
        data-test={`${title}-radio-input`}
        data-checked-state={checked}
        {...rest}
      />
      {children}
    </div>
  );
};
