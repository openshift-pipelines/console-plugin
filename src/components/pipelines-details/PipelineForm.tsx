import * as React from 'react';
import { Formik } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  K8sResourceKind,
  k8sUpdate,
} from '@openshift-console/dynamic-plugin-sdk';
import { PipelineModel } from '../../models';
import { sanitizePipelineParams } from './utils';

export interface PipelineFormProps {
  PipelineFormComponent: React.ComponentType<any>;
  formName: string;
  validationSchema: any;
  obj: K8sResourceKind;
}

const PipelineForm: React.FC<PipelineFormProps> = ({
  PipelineFormComponent,
  formName,
  validationSchema,
  obj,
}) => {
  const { t } = useTranslation();
  const initialValues = {
    parameters: _.get(obj.spec, 'params', []),
    resources: _.get(obj.spec, 'resources', []),
  };

  const handleSubmit = (values, actions) => {
    return k8sUpdate({
      model: PipelineModel,
      data: {
        ...obj,
        spec: {
          ...obj.spec,
          params: sanitizePipelineParams(values.parameters),
          resources: values.resources,
        },
      },
      ns: obj.metadata.namespace,
      name: obj.metadata.name,
    })
      .then((newObj) => {
        actions.resetForm({
          values: {
            parameters: _.get(newObj.spec, 'params', []),
            resources: _.get(newObj.spec, 'resources', []),
          },
          status: {
            success: t('Successfully updated the pipeline {{formName}}.', {
              formName,
            }),
          },
        });
      })
      .catch((err) => {
        actions.setStatus({ submitError: err.message });
      });
  };

  const handleReset = () => {
    return { status: {} };
  };

  return (
    <>
      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onReset={handleReset}
        validationSchema={validationSchema}
      >
        {(formikProps) => (
          <PipelineFormComponent
            namespace={obj.metadata.namespace}
            {...formikProps}
          />
        )}
      </Formik>
    </>
  );
};

export default PipelineForm;
