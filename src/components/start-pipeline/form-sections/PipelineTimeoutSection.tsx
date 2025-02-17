import * as React from 'react';
import { RequestSizeInput } from '../../common/request-size-input';
import { useTranslation } from 'react-i18next';
import { FormikValues, useField, useFormikContext } from 'formik';
import {
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
} from '@patternfly/react-core';

const PipelineTimeoutSection = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [, { touched, error }] = useField<string | string[]>(
    'timeouts.timeValue',
  );
  const [timeoutUnit, setTimeoutUnit] = React.useState('m');
  const [timeoutValue, setTimeoutValue] = React.useState(60);
  const { setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const isValid = !(touched && !!error);
  const errorMessage = !isValid ? error : '';
  const handleTimeOutChange = (timeoutValue) => {
    const { value, unit } = timeoutValue;
    setTimeoutValue(value);
    setTimeoutUnit(unit);
    setFieldValue('timeouts.timeValue', value);
    setFieldTouched('timeouts.timeValue', true);
    setFieldValue('timeouts.timeUnit', unit);
  };
  const dropdownUnits = React.useMemo(
    () => ({
      h: t('Hr'),
      m: t('Min'),
      s: t('Sec'),
    }),
    [t],
  );
  return (
    <FormGroup label={t('Timeouts')}>
      <RequestSizeInput
        name="timeouts.time"
        onChange={handleTimeOutChange}
        defaultRequestSizeUnit={timeoutUnit}
        defaultRequestSizeValue={timeoutValue}
        dropdownUnits={dropdownUnits}
        describedBy="timeout-help"
        inputID="timeout-input"
        data-test-id="timeout-input"
        minValue={0}
        allowDecimalValue
      />
      <FormHelperText>
        <HelperText>
          {!isValid ? (
            <HelperTextItem variant="error">{errorMessage}</HelperTextItem>
          ) : (
            <HelperTextItem>{t('Timeout for the pipeline')}</HelperTextItem>
          )}
        </HelperText>
      </FormHelperText>
    </FormGroup>
  );
};

export default PipelineTimeoutSection;
