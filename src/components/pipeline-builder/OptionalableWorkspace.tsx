import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import InputField from '../pipelines-details/multi-column-field/InputField';
import CheckboxField from './CheckboxField';

type OptionalableWorkspace = {
  namePrefix?: string;
  isReadOnly?: boolean;
};

const OptionalableWorkspace: React.FC<OptionalableWorkspace> = ({
  namePrefix,
  isReadOnly,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  return (
    <>
      <InputField
        data-test="name"
        name={`${namePrefix}.name`}
        type={TextInputTypes.text}
        placeholder={t('Name')}
        isReadOnly={isReadOnly}
        aria-label={t('Name')}
      />
      <div style={{ marginBottom: 'var(--pf-global--spacer--xs)' }} />
      <CheckboxField
        name={`${namePrefix}.optional`}
        label={t('Optional workspace')}
      />
    </>
  );
};

export default OptionalableWorkspace;
