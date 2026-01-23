import * as React from 'react';
import { Formik, FormikBag } from 'formik';
import { load } from 'js-yaml';
import { useTranslation } from 'react-i18next';
import { PipelineKind } from '../../types';
import { initialPipelineFormData } from './const';
import { sanitizeToYaml } from './form-switcher-validation';
import PipelineBuilderForm from './PipelineBuilderForm';
import {
  EditorType,
  PipelineBuilderFormYamlValues,
  PipelineBuilderFormikValues,
} from './types';
import {
  convertBuilderFormToPipeline,
  convertPipelineToBuilderForm,
} from './utils';
import { validationSchema } from './validation-utils';
import { DocumentTitle, k8sCreate, k8sUpdate } from '@openshift-console/dynamic-plugin-sdk';
import { returnValidPipelineModel } from '../utils/pipeline-utils';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { useNavigate, useParams } from 'react-router-dom-v5-compat';

import './PipelineBuilderPage.scss';

type PipelineBuilderPageProps = {
  existingPipeline?: PipelineKind;
};

const PipelineBuilderPage: React.FC<PipelineBuilderPageProps> = (props) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const navigate = useNavigate();
  const { ns } = useParams();
  const { existingPipeline } = props;

  const initialValues: PipelineBuilderFormYamlValues = {
    editorType: EditorType.Form,
    yamlData: sanitizeToYaml(initialPipelineFormData, ns, existingPipeline),
    formData: {
      ...initialPipelineFormData,
      ...(convertPipelineToBuilderForm(existingPipeline) || {}),
    },
    taskResources: {
      clusterResolverTasks: [],
      namespacedTasks: [],
      tasksLoaded: false,
    },
  };

  const handleSubmit = (
    values: PipelineBuilderFormikValues,
    actions: FormikBag<any, PipelineBuilderFormYamlValues>,
  ) => {
    let pipeline;
    if (values.editorType === EditorType.YAML) {
      try {
        pipeline = load(values.yamlData);
        if (!pipeline.metadata?.namespace) {
          pipeline.metadata.namespace = ns;
        }
      } catch (err) {
        actions.setStatus({ submitError: `Invalid YAML - ${err}` });
        return null;
      }
    } else {
      pipeline = convertBuilderFormToPipeline(
        values.formData,
        ns,
        existingPipeline,
      );
    }

    let resourceCall: Promise<any>;
    const pipelineModel = returnValidPipelineModel(pipeline);
    if (existingPipeline) {
      resourceCall = k8sUpdate({
        model: pipelineModel,
        data: pipeline,
        ns,
        name: existingPipeline.metadata.name,
      });
    } else {
      resourceCall = k8sCreate({ model: pipelineModel, data: pipeline });
    }

    return resourceCall
      .then(() => {
        navigate(
          `/k8s/ns/${ns}/${getReferenceForModel(pipelineModel)}/${
            pipeline.metadata.name
          }`,
        );
      })
      .catch((e) => {
        actions.setStatus({ submitError: e.message });
      });
  };

  return (
    <div className="odc-pipeline-builder-page">
      <DocumentTitle>
        {t('Pipeline builder')}
      </DocumentTitle>
      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onReset={() => navigate(-1)}
        validationSchema={validationSchema(t)}
      >
        {(formikProps) => (
          <PipelineBuilderForm
            {...formikProps}
            namespace={ns}
            existingPipeline={existingPipeline}
          />
        )}
      </Formik>
    </div>
  );
};

export default PipelineBuilderPage;
