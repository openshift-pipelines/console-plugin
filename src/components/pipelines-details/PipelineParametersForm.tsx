import * as React from 'react';
import { Form } from '@patternfly/react-core';
import { FormikProps, FormikValues, getIn } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useAccessReview } from '@openshift-console/dynamic-plugin-sdk';
import PipelineParameters from './PipelineParameters';
import FormFooter from './multi-column-field/FormFooter';

type PipelineParametersFormProps = FormikProps<FormikValues> & {
  namespace: string;
};

const PipelineParametersForm: React.FC<PipelineParametersFormProps> = ({
  namespace,
  handleSubmit,
  handleReset,
  isSubmitting,
  status,
  errors,
  dirty,
}) => {
  const pipelineParameterAccess = useAccessReview({
    group: 'tekton.dev',
    resource: 'pipelines',
    namespace,
    verb: 'update',
  });
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const disableSubmit =
    !dirty || !_.isEmpty(_.compact(getIn(errors, 'parameters')));
  return (
    <Form onSubmit={handleSubmit}>
      <div className="co-m-pane__body">
        <PipelineParameters
          fieldName="parameters"
          isReadOnly={!pipelineParameterAccess}
          addLabel={t('Add Pipeline parameter')}
          nameLabel={t('Name')}
          nameFieldName="name"
          descriptionLabel={t('Description')}
          descriptionFieldName="description"
          valueLabel={t('Default value')}
          valueFieldName="default"
          emptyMessage={t('No parameters are associated with this Pipeline.')}
          emptyValues={{ name: '', description: '', default: '' }}
        />
      </div>
      {pipelineParameterAccess && (
        <FormFooter
          handleReset={handleReset}
          isSubmitting={isSubmitting}
          errorMessage={status && status.submitError}
          successMessage={status && !dirty && status.success}
          disableSubmit={disableSubmit}
          showAlert={!disableSubmit}
          submitLabel={t('Save')}
          resetLabel={t('Reload')}
          sticky
        />
      )}
    </Form>
  );
};

export default PipelineParametersForm;
