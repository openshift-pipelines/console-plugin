import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { Formik, useField, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { SecretAnnotationId } from '../../consts';
import { SecretModel } from '../../models';
import {
  associateServiceAccountToSecret,
  getSecretAnnotations,
} from '../utils/pipeline-utils';
import { k8sCreate } from '@openshift-console/dynamic-plugin-sdk';
import { CommonPipelineModalFormikValues, SecretType } from '../../types';
import { ExpandCollapse } from './expand-collapse';
import { advancedSectionValidationSchema } from '../start-pipeline/validation-utils';
import SecretForm from './SecretForm';
import SecretsList from './SecretsList';
import './PipelineSecretSection.scss';

const initialValues = {
  secretName: '',
  annotations: { key: SecretAnnotationId.Image, value: '' },
  type: SecretType.dockerconfigjson,
  formData: {},
};

const PipelineSecretSection: React.FC = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [secretOpenField] = useField<boolean>('secretOpen');
  const {
    setFieldValue,
    values: { namespace },
  } = useFormikContext<CommonPipelineModalFormikValues>();

  const handleSubmit = (values, actions) => {
    const newSecret = {
      apiVersion: SecretModel.apiVersion,
      kind: SecretModel.kind,
      metadata: {
        name: values.secretName,
        namespace,
        annotations: getSecretAnnotations(values.annotations),
      },
      type: values.type,
      stringData: values.formData,
    };
    return k8sCreate({ model: SecretModel, data: newSecret })
      .then((resp) => {
        setFieldValue(secretOpenField.name, false);
        associateServiceAccountToSecret(
          resp,
          namespace,
          values.annotations.key === SecretAnnotationId.Image,
        );
      })
      .catch((err) => {
        actions.setStatus({ submitError: err.message });
      });
  };

  const handleReset = (values, actions) => {
    actions.resetForm({ values: initialValues, status: {} });
    setFieldValue(secretOpenField.name, false);
  };

  return (
    <ExpandCollapse
      textExpanded={t('Hide credential options')}
      textCollapsed={t('Show credential options')}
    >
      <div className="odc-pipeline-secret-section">
        <p>
          {t(
            'The following secrets are available for all pipelines in this namespace to authenticate to the specified Git server or Image registry:',
          )}
        </p>
        <div className="odc-pipeline-secret-section__secrets">
          <SecretsList namespace={namespace} />
          {secretOpenField.value ? (
            <div className="odc-pipeline-secret-section__secret-form">
              <Formik
                initialValues={initialValues}
                validationSchema={advancedSectionValidationSchema()}
                onSubmit={handleSubmit}
                onReset={handleReset}
              >
                {(formikProps) => <SecretForm {...formikProps} />}
              </Formik>
            </div>
          ) : (
            <Button
              variant="link"
              onClick={() => {
                setFieldValue(secretOpenField.name, true);
              }}
              className="odc-pipeline-secret-section__secret-action"
              icon={<PlusCircleIcon />}
            >
              {t('Add Secret')}
            </Button>
          )}
        </div>
      </div>
    </ExpandCollapse>
  );
};

export default PipelineSecretSection;
