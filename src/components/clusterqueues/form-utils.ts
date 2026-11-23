import { TFunction } from 'i18next';
import { dump, JSON_SCHEMA, load } from 'js-yaml';
import { cloneDeep } from 'lodash-es';
import { ClusterQueueModel } from '../../models';
import { ClusterQueueKind, Flavor, Resource } from '../../types';
import { EditorType } from '../pipeline-builder/types';
import {
  ClusterQueueEditorValues,
  ClusterQueueFlavorFormValues,
  ClusterQueueFormValues,
} from './types';
import {
  canEditClusterQueueQuotas,
  validateClusterQueueResource,
} from './validation-utils';

export const createClusterQueueFlavor = (): ClusterQueueFlavorFormValues => ({
  name: '',
  cpu: '4',
  memory: '8Gi',
});

const flavorToForm = (flavor: Flavor): ClusterQueueFlavorFormValues => ({
  name: flavor.name,
  originalName: flavor.name,
  cpu: String(
    flavor.resources.find(({ name }) => name === 'cpu')?.nominalQuota ?? '',
  ),
  memory: String(
    flavor.resources.find(({ name }) => name === 'memory')?.nominalQuota ?? '',
  ),
});

export const convertClusterQueueToForm = (
  input: unknown,
  t: TFunction,
): ClusterQueueFormValues => {
  const resource = cloneDeep(validateClusterQueueResource(input, t));
  return {
    name: resource.metadata?.name ?? '',
    cohort: resource.spec?.cohortName ?? '',
    queueingStrategy: resource.spec?.queueingStrategy ?? 'BestEffortFIFO',
    flavors: canEditClusterQueueQuotas(resource)
      ? resource.spec?.resourceGroups?.[0]?.flavors?.map(flavorToForm) ?? []
      : [],
    resource,
  };
};

const updateQuota = (
  original: Resource,
  name: string,
  value: string,
): Resource =>
  original && String(original.nominalQuota ?? '') === value
    ? original
    : { ...original, name, nominalQuota: value };

export const convertFormToClusterQueue = (
  values: ClusterQueueFormValues,
): ClusterQueueKind => {
  const resource = cloneDeep(values.resource);
  if (values.name !== (resource.metadata?.name ?? '')) {
    resource.metadata = { ...resource.metadata, name: values.name };
  }
  if (values.cohort !== (resource.spec?.cohortName ?? '')) {
    resource.spec ??= {};
    if (values.cohort) resource.spec.cohortName = values.cohort;
    else delete resource.spec.cohortName;
  }
  if (
    values.queueingStrategy !==
    (resource.spec?.queueingStrategy ?? 'BestEffortFIFO')
  ) {
    resource.spec = {
      ...resource.spec,
      queueingStrategy: values.queueingStrategy,
    };
  }
  if (canEditClusterQueueQuotas(resource)) {
    const group = resource.spec?.resourceGroups?.[0];
    if (values.flavors.length > 0) {
      const coveredResources = group?.coveredResources ?? ['cpu', 'memory'];
      const flavors = values.flavors.map((flavor) => {
        const original = group?.flavors.find(
          ({ name }) => name === flavor.originalName,
        );
        return {
          ...original,
          name: flavor.name,
          resources: coveredResources.map((name) =>
            updateQuota(
              original?.resources.find((resource) => resource.name === name),
              name,
              name === 'cpu' ? flavor.cpu : flavor.memory,
            ),
          ),
        };
      });
      resource.spec = {
        ...resource.spec,
        resourceGroups: [{ ...group, coveredResources, flavors }],
      };
    } else if (group) {
      resource.spec.resourceGroups = [];
    }
  }
  return resource;
};

export const parseClusterQueueYAML = (
  yaml: string,
  t: TFunction,
): ClusterQueueFormValues =>
  convertClusterQueueToForm(load(yaml, { schema: JSON_SCHEMA }), t);

export const convertClusterQueueFormToYAML = (
  values: ClusterQueueFormValues,
): string => dump(convertFormToClusterQueue(values), { noRefs: true });

export const createInitialClusterQueueValues = (): ClusterQueueEditorValues => {
  const formData: ClusterQueueFormValues = {
    name: '',
    cohort: '',
    queueingStrategy: 'BestEffortFIFO',
    flavors: [createClusterQueueFlavor()],
    resource: {
      apiVersion: `${ClusterQueueModel.apiGroup}/${ClusterQueueModel.apiVersion}`,
      kind: ClusterQueueModel.kind,
      metadata: { name: '' },
      spec: { queueingStrategy: 'BestEffortFIFO', namespaceSelector: {} },
    },
  };
  return {
    editorType: EditorType.Form,
    formData,
    yamlData: convertClusterQueueFormToYAML(formData),
  };
};
