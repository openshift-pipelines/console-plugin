import * as React from 'react';
import { Formik } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import PipelineRunParameters from './PipelineRunParameters';
import { K8sResourceKind } from '@openshift-console/dynamic-plugin-sdk';

export interface PipelineRunParametersFormProps {
  obj: K8sResourceKind;
}

const PipelineRunParametersForm: React.FC<PipelineRunParametersFormProps> = ({
  obj,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const initialValues = {
    parameters: _.get(obj.spec, 'params', []),
  };
  return (
    <>
      <Formik initialValues={initialValues} onSubmit={null}>
        {() => (
          <div className="co-m-pane__body">
            <PipelineRunParameters
              fieldName="parameters"
              isReadOnly
              nameLabel={t('Name')}
              nameFieldName="name"
              valueLabel={t('Value')}
              valueFieldName="value"
              emptyMessage={t(
                'No parameters are associated with this PipelineRun.',
              )}
              emptyValues={{
                name: '',
                value: '',
              }}
            />
          </div>
        )}
      </Formik>
    </>
  );
};

export default PipelineRunParametersForm;
