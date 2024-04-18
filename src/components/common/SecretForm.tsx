import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { FormikProps } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { SecretType } from '../../types';
import { SecretAnnotationId } from '../../consts';
import { ButtonBar } from './button-bar';
import InputField from '../pipelines-details/multi-column-field/InputField';
import DropdownField from './DropdownField';
import ActionGroupWithIcons from './ActionGroupWithIcons';
import {
  BasicAuthSubform,
  CreateConfigSubform,
  SSHAuthSubform,
} from './create-secret';
import './SecretForm.scss';

const renderSecretForm = (
  type: SecretType,
  stringData: {
    [key: string]: any;
  },
  onDataChanged: (value: string) => void,
) => {
  switch (type) {
    case SecretType.basicAuth:
      return (
        <BasicAuthSubform
          onChange={onDataChanged}
          stringData={stringData[SecretType.basicAuth]}
        />
      );
    case SecretType.sshAuth:
      return (
        <SSHAuthSubform
          onChange={onDataChanged}
          stringData={stringData[SecretType.sshAuth]}
        />
      );
    case SecretType.dockerconfigjson:
      return (
        <CreateConfigSubform
          onChange={onDataChanged}
          stringData={stringData[SecretType.dockerconfigjson]}
        />
      );
    default:
      return null;
  }
};

interface SecretFormValues {
  secretName: string;
  type: SecretType;
  annotations: {
    key: SecretAnnotationId;
    value: string; // url
  };
  formData: any;
}

const SecretForm: React.FC<FormikProps<SecretFormValues>> = ({
  values,
  setFieldValue,
  setFieldTouched,
  handleSubmit,
  handleReset,
  status,
  isSubmitting,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [stringData, setStringData] = React.useState({
    [SecretType.basicAuth]: {},
    [SecretType.sshAuth]: {},
    [SecretType.dockerconfigjson]: {},
  });

  const secretTypes = React.useMemo<Record<string, string>>(
    () => ({
      [SecretAnnotationId.Git]: t('Git Server'),
      [SecretAnnotationId.Image]: t('Image Registry'),
    }),
    [t],
  );

  const authTypes = React.useMemo<Record<string, string>>(() => {
    switch (values.annotations.key) {
      case SecretAnnotationId.Git:
        return {
          [SecretType.basicAuth]: t('Basic Authentication'),
          [SecretType.sshAuth]: t('SSH Key'),
        };
      case SecretAnnotationId.Image:
        return {
          [SecretType.basicAuth]: t('Basic Authentication'),
          [SecretType.dockerconfigjson]: t('Image Registry Credentials'),
        };
      default:
        return {};
    }
  }, [values.annotations.key, t]);

  const clearServerURL = React.useCallback(() => {
    setFieldValue('annotations', {
      key: values.annotations.key,
      value: '', // clear url
    });
    setFieldTouched('annotations', false);
  }, [setFieldTouched, setFieldValue, values.annotations.key]);

  React.useEffect(() => {
    const availableAuthTypes = Object.keys(authTypes);
    if (!availableAuthTypes.includes(values.type)) {
      setFieldValue('type', SecretType.basicAuth);
      clearServerURL();
    }
  }, [authTypes, values.type, setFieldValue, clearServerURL]);

  // Uses a memo instead of const outside of the function so that we can add i18n right here
  const helpText = React.useMemo(
    () => ({
      [SecretType.dockerconfigjson]: t(
        'The base server url (e.g. https://quay.io/)',
      ),
      [SecretType.basicAuth]: t(
        'The base server url (e.g. https://github.com)',
      ),
      [SecretType.sshAuth]: t(
        'Server hostname without schema or path (e.g. github.com)',
      ),
    }),
    [t],
  );

  const setValues = (type: SecretType) => {
    if (type === SecretType.dockerconfigjson) {
      setFieldValue(
        'formData',
        _.mapValues({ '.dockerconfigjson': stringData[type] }, JSON.stringify),
      );
    } else {
      setFieldValue('formData', stringData[type]);
    }
    if (values.type !== type) {
      clearServerURL();
    }
  };

  const onDataChanged = (value: string) => {
    setStringData({ ...stringData, [values.type]: value });
    setValues(values.type);
  };

  return (
    <div className="odc-secret-form">
      <h1 className="co-section-heading-tertiary odc-secret-form__title">
        {t('Create Secret')}
      </h1>
      <div className="form-group">
        <InputField
          type={TextInputTypes.text}
          name="secretName"
          label={t('Secret name')}
          helpText={t('Unique name of the new secret.')}
          required
        />
      </div>
      <div className="form-group">
        <DropdownField
          name="annotations.key"
          label={t('Access to')}
          helpText={t('Designate provider to be authenticated.')}
          items={secretTypes}
          fullWidth
          required
        />
      </div>
      <div className="form-group">
        <DropdownField
          name="type"
          label={t('Authentication type')}
          items={authTypes}
          title={authTypes[values.type]}
          onChange={(type: SecretType) => setValues(type)}
          fullWidth
          required
        />
      </div>
      <div className="form-group">
        <InputField
          name="annotations.value"
          label={t('Server URL')}
          helpText={helpText[values.type]}
          type={TextInputTypes.text}
          required
        />
      </div>
      {renderSecretForm(values.type, stringData, onDataChanged)}
      <ButtonBar errorMessage={status?.submitError} inProgress={isSubmitting}>
        <ActionGroupWithIcons onSubmit={handleSubmit} onClose={handleReset} />
      </ButtonBar>
    </div>
  );
};

export default SecretForm;
