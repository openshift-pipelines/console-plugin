import { Alert, FormSection, Spinner } from '@patternfly/react-core';
import { useField, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { ResourceFlavorKind } from '../../types';
import DropdownField from '../common/DropdownField';
import { useResourceFlavors } from '../hooks/useMultiKueueResources';
import RadioGroupField from '../pipeline-builder/RadioGroupField';
import InputField from '../pipelines-details/multi-column-field/InputField';
import MultiColumnField from '../pipelines-details/multi-column-field/MultiColumnField';
import { createClusterQueueFlavor } from './form-utils';
import { ClusterQueueEditorValues } from './types';
import { canEditClusterQueueQuotas } from './validation-utils';
import './ClusterQueueForm.scss';

const ResourceFlavorField = ({
  name,
  flavors,
  disabled,
}: {
  name: string;
  flavors: ResourceFlavorKind[];
  disabled: boolean;
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [field] = useField<string>(name);
  const selected = flavors.find(
    (flavor) => flavor.metadata.name === field.value,
  );
  return (
    <DropdownField
      name={name}
      label={t('Resource flavor')}
      required
      fullWidth
      disabled={disabled}
      placeholder={t('Select a resource flavor')}
      title={field.value || undefined}
      items={Object.fromEntries(
        flavors.map(({ metadata }) => [metadata.name, metadata.name]).sort(),
      )}
      helpText={Object.entries(selected?.spec?.nodeLabels ?? {})
        .map(([key, value]) => `${key}=${value}`)
        .join(', ')}
    />
  );
};

const QuotaField = ({
  name,
  resource,
}: {
  name: string;
  resource: 'cpu' | 'memory';
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [field] = useField<string>(name);
  const presets =
    resource === 'cpu'
      ? ['1', '2', '4', '8', '16', '32', '64']
      : [
          '1Gi',
          '2Gi',
          '4Gi',
          '8Gi',
          '16Gi',
          '32Gi',
          '64Gi',
          '128Gi',
          '256Gi',
          '512Gi',
        ];
  const items = Object.fromEntries(
    presets.map((value) => [
      value,
      resource === 'cpu'
        ? value === '1'
          ? t('1 core')
          : t('{{value}} cores', { value })
        : value,
    ]),
  );
  // Keep quantities entered through YAML selectable even outside the presets.
  if (field.value && !items[field.value]) items[field.value] = field.value;
  return (
    <DropdownField
      name={name}
      label={resource === 'cpu' ? t('CPU') : t('Memory')}
      items={items}
      required
      fullWidth
    />
  );
};

const ClusterQueueForm = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const {
    values: { formData },
  } = useFormikContext<ClusterQueueEditorValues>();
  const [flavors = [], loaded, error] = useResourceFlavors();
  const canEditQuotas = canEditClusterQueueQuotas(formData.resource);

  return (
    <div className="pipelines-console-plugin-clusterqueue-form">
      <InputField
        name="formData.name"
        label={t('Name')}
        required
        placeholder={t('e.g. fleet-shared-cq')}
        helpText={t(
          'Use lowercase letters, numbers, hyphens or dots. ClusterQueues are cluster-scoped, so the name must be unique across the cluster.',
        )}
      />
      <InputField
        name="formData.cohort"
        label={t('Cohort')}
        placeholder={t('e.g. platform')}
        helpText={t(
          "ClusterQueues sharing a cohort can borrow each other's unused quota. Leave empty to keep this quota private.",
        )}
      />
      <RadioGroupField
        name="formData.queueingStrategy"
        label={t('Queueing strategy')}
        required
        options={[
          {
            value: 'BestEffortFIFO',
            label: t('Best effort FIFO'),
            children: t(
              'Try the oldest workload first, but move on to ones that fit when it cannot be admitted. Keeps the cluster busy at the cost of strict ordering.',
            ),
          },
          {
            value: 'StrictFIFO',
            label: t('Strict FIFO'),
            children: t(
              'Admit strictly in priority then arrival order. A workload that does not fit blocks everything behind it.',
            ),
          },
        ]}
      />
      <FormSection title={t('Nominal quota')} titleElement="h2">
        <p>
          {t(
            'Define the resource quota per hardware flavor. Each flavor corresponds to a ResourceFlavor object that describes specific node hardware.',
          )}
        </p>
        {!canEditQuotas ? (
          <Alert
            isInline
            variant="info"
            title={t('This ClusterQueue has additional quota settings.')}
          >
            {t(
              'These settings are preserved. Use YAML view to edit resource groups or resources other than CPU and memory.',
            )}
          </Alert>
        ) : (
          <>
            {error ? (
              <Alert
                isInline
                variant="danger"
                title={t('Unable to load resource flavors.')}
              >
                {(error as Error)?.message}
              </Alert>
            ) : !loaded ? (
              <div role="status">
                <Spinner size="sm" /> {t('Loading resource flavors...')}
              </div>
            ) : flavors.length === 0 ? (
              <Alert
                isInline
                variant="info"
                title={t('No resource flavors available.')}
              />
            ) : null}
            <MultiColumnField
              name="formData.flavors"
              headers={[]}
              emptyValues={createClusterQueueFlavor()}
              addLabel={t('Add flavor')}
              disableDeleteRow={formData.flavors.length <= 1}
              disableAddRow={formData.flavors.length >= 64}
            >
              <ResourceFlavorField
                name="name"
                flavors={flavors}
                disabled={!loaded || !!error || flavors.length === 0}
              />
              <QuotaField name="cpu" resource="cpu" />
              <QuotaField name="memory" resource="memory" />
            </MultiColumnField>
          </>
        )}
      </FormSection>
    </div>
  );
};

export default ClusterQueueForm;
