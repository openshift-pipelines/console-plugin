import * as React from 'react';
import { PageSection, TextInputTypes } from '@patternfly/react-core';
import MultiColumnField from './multi-column-field/MultiColumnField';
import InputField from './multi-column-field/InputField';

type PipelineParametersProps = {
  addLabel?: string;
  nameLabel: string;
  nameFieldName: string;
  descriptionLabel: string;
  descriptionFieldName: string;
  valueLabel: string;
  valueFieldName: string;
  emptyMessage: string;
  fieldName: string;
  emptyValues: { [name: string]: string };
  isReadOnly?: boolean;
};

const PipelineParameters: React.FC<PipelineParametersProps> = ({
  addLabel,
  nameLabel,
  nameFieldName,
  descriptionLabel,
  descriptionFieldName,
  valueLabel,
  valueFieldName,
  emptyMessage,
  fieldName,
  emptyValues,
  isReadOnly = false,
}) => {
  return (
    <PageSection variant="light" isFilled>
      <MultiColumnField
        data-test="pipeline-parameters"
        name={fieldName}
        addLabel={addLabel}
        headers={[
          {
            name: nameLabel,
            required: true,
          },
          descriptionLabel,
          valueLabel,
        ]}
        emptyValues={emptyValues}
        emptyMessage={emptyMessage}
        isReadOnly={isReadOnly}
      >
        <InputField
          data-test={nameFieldName}
          name={nameFieldName}
          type={TextInputTypes.text}
          placeholder={nameLabel}
          isDisabled={isReadOnly}
          aria-label={nameLabel}
        />
        <InputField
          data-test={descriptionFieldName}
          name={descriptionFieldName}
          type={TextInputTypes.text}
          placeholder={descriptionLabel}
          isDisabled={isReadOnly}
          aria-label={descriptionLabel}
        />
        <InputField
          data-test={valueFieldName}
          name={valueFieldName}
          type={TextInputTypes.text}
          placeholder={valueLabel}
          isDisabled={isReadOnly}
          aria-label={valueLabel}
        />
      </MultiColumnField>
    </PageSection>
  );
};

export default PipelineParameters;
