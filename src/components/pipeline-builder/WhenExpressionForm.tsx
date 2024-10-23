import * as React from 'react';
import { Grid, GridItem, TextInputTypes } from '@patternfly/react-core';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { WhenExpressionOperatorType } from '../pipeline-builder/const';
import { PipelineBuilderFormikValues } from '../pipeline-builder/types';
import AutoCompletePopover from '../auto-complete/AutoCompletePopover';
import InputField from '../pipelines-details/multi-column-field/InputField';
import DropdownField from '../common/DropdownField';
import TextColumnField from '../text-column-field/TextColumnField';

type WhenExpressionFormProps = {
  namePrefix?: string;
  autoCompleteValues: string[];
};

const WhenExpressionForm: React.FC<WhenExpressionFormProps> = ({
  namePrefix,
  autoCompleteValues,
}) => {
  const { setFieldValue } = useFormikContext<PipelineBuilderFormikValues>();
  const { t } = useTranslation();

  return (
    <Grid hasGutter>
      <GridItem span={6}>
        <AutoCompletePopover
          autoCompleteValues={autoCompleteValues}
          onAutoComplete={(input: string) =>
            setFieldValue(`${namePrefix}.input`, input)
          }
        >
          {(ref) => (
            <InputField
              ref={ref}
              data-test="input"
              type={TextInputTypes.text}
              name={`${namePrefix}.input`}
              label={t('pipelines-plugin~Input')}
              autoComplete="off"
            />
          )}
        </AutoCompletePopover>
      </GridItem>
      <GridItem span={6}>
        <DropdownField
          dataTest="operator"
          name={`${namePrefix}.operator`}
          label={t('pipelines-plugin~Operator')}
          items={WhenExpressionOperatorType}
          title={t('pipelines-plugin~Select operator')}
          onChange={(operator: string) =>
            setFieldValue(`${namePrefix}.operator`, operator)
          }
          fullWidth
        />
      </GridItem>
      <GridItem>
        <TextColumnField
          data-test="values"
          name={`${namePrefix}.values`}
          label={t('pipelines-plugin~Values')}
        >
          {({ name: arrayName, ...additionalProps }) => (
            <AutoCompletePopover
              autoCompleteValues={autoCompleteValues}
              onAutoComplete={(newValue: string) => {
                setFieldValue(arrayName, newValue);
              }}
            >
              {(ref) => (
                <InputField
                  data-test={`${arrayName} value`}
                  ref={ref}
                  name={arrayName}
                  autoComplete="off"
                  {...additionalProps}
                />
              )}
            </AutoCompletePopover>
          )}
        </TextColumnField>
      </GridItem>
    </Grid>
  );
};

export default WhenExpressionForm;
