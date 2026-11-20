import type { FC } from 'react';
import { Form, FormGroup, TextInput } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useSyncedResourceEditor } from '../synced-resource-editor';
import type {
  ClusterQueueFormData,
  ClusterQueueResource,
} from './clusterQueueAdapter';

type ClusterQueueFieldsProps = {
  isEdit?: boolean;
};

const ClusterQueueFields: FC<ClusterQueueFieldsProps> = ({
  isEdit = false,
}) => {
  const { formData, setFormData } = useSyncedResourceEditor<
    ClusterQueueFormData,
    ClusterQueueResource
  >();
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  return (
    <Form className="pipelines-console-plugin-clusterqueue-page__form">
      <FormGroup fieldId="clusterqueue-name" isRequired label={t('Name')}>
        <TextInput
          id="clusterqueue-name"
          isDisabled={isEdit}
          isRequired
          onChange={(_event, name) =>
            setFormData((current) => ({ ...current, name }))
          }
          value={formData.name}
        />
      </FormGroup>
      <FormGroup fieldId="clusterqueue-cohort" label={t('Cohort')}>
        <TextInput
          id="clusterqueue-cohort"
          onChange={(_event, cohort) =>
            setFormData((current) => ({ ...current, cohort }))
          }
          value={formData.cohort}
        />
      </FormGroup>
    </Form>
  );
};

export default ClusterQueueFields;
