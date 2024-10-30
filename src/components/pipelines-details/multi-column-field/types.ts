import {
  TextInputTypes,
  ValidatedOptions,
  gridItemSpanValueShape,
} from '@patternfly/react-core';

export interface FieldProps {
  name: string;
  label?: React.ReactNode | string;
  helpText?: React.ReactNode;
  helpTextInvalid?: React.ReactNode;
  required?: boolean;
  style?: React.CSSProperties;
  isReadOnly?: boolean;
  className?: string;
  isDisabled?: boolean;
  validated?: ValidatedOptions;
  dataTest?: string;
}

export interface RowRendererProps {
  fieldName: string;
  isReadOnly?: boolean;
  spans: gridItemSpanValueShape[];
  complexFields?: boolean[];
  disableDeleteRow?: boolean;
  tooltipDeleteRow?: string;
  onDelete: () => void;
}

export interface BaseInputFieldProps extends FieldProps {
  type?: TextInputTypes;
  placeholder?: string;
  onChange?: (event) => void;
  onBlur?: (event) => void;
  autoComplete?: string;
}

export interface MultiColumnFieldProps extends FieldProps {
  addLabel?: string;
  emptyValues: { [name: string]: string | boolean | string[] };
  emptyMessage?: string;
  headers: ({ name: string; required: boolean } | string)[];
  complexFields?: boolean[];
  children?: React.ReactNode;
  spans?: gridItemSpanValueShape[];
  rowRenderer?: (row: RowRendererProps) => React.ReactNode;
  disableDeleteRow?: boolean;
  tooltipDeleteRow?: string;
  disableAddRow?: boolean;
  tooltipAddRow?: string;
}
