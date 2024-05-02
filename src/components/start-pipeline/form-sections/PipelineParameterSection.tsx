import * as React from 'react';
import { FormSection, TextInputTypes } from '@patternfly/react-core';
import { FieldArray, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import {
  CommonPipelineModalFormikValues,
  ModalParameter,
} from '../../../types';
import { paramIsRequired } from '../validation-utils';
import InputField from '../../pipelines-details/multi-column-field/InputField';
import TextColumnField from '../../text-column-field/TextColumnField';
import AutoCompletePopover from '../../auto-complete/AutoCompletePopover';

type ParametersSectionProps = {
  autoCompleteValues?: string[];
};

const PipelineParameterSection: React.FC<ParametersSectionProps> = ({
  autoCompleteValues,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  const {
    setFieldValue,
    values: { parameters },
  } = useFormikContext<CommonPipelineModalFormikValues>();

  return (
    <FieldArray
      name="parameters"
      key="parameters-row"
      render={() =>
        parameters.length > 0 && (
          <FormSection title={t('Parameters')}>
            {parameters.map((parameter: ModalParameter, index) => {
              const name = `parameters.${index}.value`;
              const isRequired = paramIsRequired(parameter);

              const input = (ref?) => (
                <InputField
                  ref={ref}
                  name={name}
                  type={TextInputTypes.text}
                  label={parameter.name}
                  helpText={parameter.description}
                  required={isRequired}
                  autoComplete="off"
                />
              );
              return parameter.type === 'array' ? (
                <TextColumnField
                  name={name}
                  label={parameter.name}
                  helpText={parameter.description}
                  required={isRequired}
                  addLabel={`Add ${parameter.name}`}
                  data-test={`${parameter.name}-text-column-field`}
                >
                  {({ name: arrayName }) =>
                    autoCompleteValues ? (
                      <AutoCompletePopover
                        autoCompleteValues={autoCompleteValues}
                        onAutoComplete={(value: string) =>
                          setFieldValue(name, value)
                        }
                      >
                        {(callbackRef) => (
                          <InputField
                            ref={callbackRef}
                            name={arrayName}
                            autoComplete="off"
                          />
                        )}
                      </AutoCompletePopover>
                    ) : (
                      <InputField name={arrayName} autoComplete="off" />
                    )
                  }
                </TextColumnField>
              ) : (
                <React.Fragment key={parameter.name}>
                  {autoCompleteValues ? (
                    <AutoCompletePopover
                      autoCompleteValues={autoCompleteValues}
                      onAutoComplete={(value: string) =>
                        setFieldValue(name, value)
                      }
                    >
                      {(callbackRef) => input(callbackRef)}
                    </AutoCompletePopover>
                  ) : (
                    input()
                  )}
                </React.Fragment>
              );
            })}
          </FormSection>
        )
      }
    />
  );
};

export default PipelineParameterSection;
