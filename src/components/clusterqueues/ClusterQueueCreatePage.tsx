import {
  DocumentTitle,
  k8sCreate,
} from '@openshift-console/dynamic-plugin-sdk';
import { Alert } from '@patternfly/react-core';
import { Formik, FormikHelpers, useFormikContext } from 'formik';
import { isEqual } from 'lodash';
import { startTransition, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useLocation, useNavigate } from 'react-router';
import * as yup from 'yup';
import { ClusterQueueModel } from '../../models';
import BreadCrumbs from '../details-page/breadcrumbs/BreadCrumbs';
import {
  FlexForm,
  FormBody,
  FormHeader,
  PageBody,
} from '../pipeline-builder/form-utils';
import FormFooter from '../pipelines-details/multi-column-field/FormFooter';
import CodeEditorField from '../pipeline-builder/CodeEditorField';
import RadioGroupField from '../pipeline-builder/RadioGroupField';
import { EditorType } from '../pipeline-builder/types';
import ClusterQueueForm from './ClusterQueueForm';
import {
  convertClusterQueueFormToYAML,
  convertFormToClusterQueue,
  createInitialClusterQueueValues,
  parseClusterQueueYAML,
} from './form-utils';
import { ClusterQueueEditorValues } from './types';
import {
  clusterQueueFormSchema,
  clusterQueueNameSchema,
} from './validation-utils';
import './ClusterQueueCreatePage.scss';

const parseSubmittableClusterQueueYAML = (yamlData: string, t: TFunction) => {
  const formData = parseClusterQueueYAML(yamlData, t);
  clusterQueueNameSchema(t).validateSync(formData.name);
  return formData;
};

const ClusterQueueEditor = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { values, setFieldValue, setValues } =
    useFormikContext<ClusterQueueEditorValues>();
  const [yamlError, setYAMLError] = useState<string>();
  const [preloadYAMLEditor, setPreloadYAMLEditor] = useState(false);

  // Render the console's asynchronous editor after the form has painted so its
  // first visible use does not wait for the editor bundle to initialize.
  useEffect(() => {
    startTransition(() => setPreloadYAMLEditor(true));
  }, []);

  useEffect(() => {
    if (values.editorType !== EditorType.YAML || !values.yamlData) return;

    try {
      const formData = parseClusterQueueYAML(values.yamlData, t);
      if (!isEqual(formData, values.formData)) {
        setFieldValue('formData', formData);
      }
      setYAMLError(undefined);
    } catch {
      // Keep the last valid form values while the user edits invalid YAML.
    }
  }, [setFieldValue, t, values.editorType, values.formData, values.yamlData]);

  const onChangeEditorType = (editorType: EditorType) => {
    let formData = values.formData;
    let yamlData = values.yamlData;

    if (editorType === EditorType.YAML) {
      yamlData = convertClusterQueueFormToYAML(values.formData);
      setYAMLError(undefined);
    } else {
      try {
        formData = parseClusterQueueYAML(values.yamlData, t);
        setYAMLError(undefined);
      } catch (error) {
        const message = (error as Error).message;
        setYAMLError(message);
        return;
      }
    }
    setValues({ ...values, editorType, formData, yamlData });
  };

  return (
    <>
      <div className="pipelines-console-plugin-clusterqueue-page__editor-toggle">
        <RadioGroupField
          isInline
          label={t('Configure via:')}
          name="editorType"
          onChange={(value) => onChangeEditorType(value as EditorType)}
          options={[
            { label: t('Form view'), value: EditorType.Form },
            { label: t('YAML view'), value: EditorType.YAML },
          ]}
        />
      </div>
      {yamlError && (
        <Alert
          className="pipelines-console-plugin-clusterqueue-page__yaml-error"
          isInline
          variant="danger"
          title={t('Fix the YAML before switching to Form view.')}
        >
          {yamlError}
        </Alert>
      )}
      <div
        aria-hidden={values.editorType !== EditorType.Form}
        hidden={values.editorType !== EditorType.Form}
      >
        <ClusterQueueForm />
      </div>
      {preloadYAMLEditor && (
        <div
          aria-hidden={values.editorType !== EditorType.YAML}
          hidden={values.editorType !== EditorType.YAML}
        >
          <CodeEditorField
            label={t('ClusterQueue')}
            model={ClusterQueueModel}
            minHeight="600px"
            name="yamlData"
            showSamples={false}
          />
        </div>
      )}
    </>
  );
};

const ClusterQueueCreatePage = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const navigate = useNavigate();
  const { state } = useLocation();
  const returnPath =
    typeof state?.from === 'string' &&
    /^\/(?:dev-)?pipelines\/(?:ns\/[^/?#]+|all-namespaces)(?:[/?#].*)?$/.test(
      state.from,
    )
      ? state.from
      : '/pipelines/all-namespaces';
  const pipelinesContextPath =
    returnPath.match(
      /^\/(?:dev-)?pipelines\/(?:ns\/[^/?#]+|all-namespaces)/,
    )?.[0] || '/pipelines/all-namespaces';
  const clusterQueuesPath = `${pipelinesContextPath}/clusterqueues`;
  const title = t('Create ClusterQueue');
  const handleSubmit = async (
    values: ClusterQueueEditorValues,
    actions: FormikHelpers<ClusterQueueEditorValues>,
  ) => {
    try {
      const resource =
        values.editorType === EditorType.YAML
          ? parseSubmittableClusterQueueYAML(values.yamlData, t).resource
          : convertFormToClusterQueue(values.formData);
      await k8sCreate({ model: ClusterQueueModel, data: resource });
      navigate(clusterQueuesPath);
    } catch (error) {
      actions.setStatus({ submitError: (error as Error).message });
    }
  };

  return (
    <div className="pipelines-console-plugin-clusterqueue-page">
      <DocumentTitle>{title}</DocumentTitle>
      <div className="pipelines-console-plugin-clusterqueue-page__header">
        <PageBody>
          <BreadCrumbs
            breadcrumbs={[
              { name: t('Pipelines'), path: pipelinesContextPath },
              { name: t('ClusterQueues'), path: clusterQueuesPath },
              { name: title, path: '' },
            ]}
          />
          <FormHeader title={title} marginTop="lg" />
        </PageBody>
      </div>
      <Formik
        initialValues={createInitialClusterQueueValues()}
        validationSchema={yup.object({
          formData: yup.mixed().when('editorType', {
            is: EditorType.Form,
            then: () => clusterQueueFormSchema(t),
          }),
        })}
        onSubmit={handleSubmit}
        validateOnMount
      >
        {({ handleSubmit, isSubmitting, status, values }) => {
          const isActiveEditorValid =
            values.editorType === EditorType.Form
              ? clusterQueueFormSchema(t).isValidSync(values.formData)
              : (() => {
                  try {
                    parseSubmittableClusterQueueYAML(values.yamlData, t);
                    return true;
                  } catch {
                    return false;
                  }
                })();

          return (
            <FlexForm onSubmit={handleSubmit}>
              <FormBody
                className="pipelines-console-plugin-clusterqueue-page__body"
                flexLayout
              >
                <ClusterQueueEditor />
              </FormBody>
              <FormFooter
                sticky
                submitLabel={t('Create')}
                disableSubmit={!isActiveEditorValid || isSubmitting}
                isSubmitting={isSubmitting}
                errorMessage={status?.submitError}
                handleCancel={() => navigate(returnPath)}
              />
            </FlexForm>
          );
        }}
      </Formik>
    </div>
  );
};

export default ClusterQueueCreatePage;
