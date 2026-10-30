import { TFunction } from 'i18next';
import { isPlainObject } from 'lodash-es';
import * as yup from 'yup';
import { ClusterQueueModel } from '../../models';
import { ClusterQueueKind } from '../../types';

const resourceNamePattern =
  /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;
const quantityPattern =
  /^\+?(?:\d+(?:\.\d*)?|\.\d+)(?:[numkMGTPE]|[KMGTPE]i|[eE][+-]?\d+)?$/;

// Other layouts remain in the source resource and are edited through YAML.
export const canEditClusterQueueQuotas = (
  resource: ClusterQueueKind,
): boolean => {
  const groups = resource?.spec?.resourceGroups;
  if (groups == null || (Array.isArray(groups) && groups.length === 0)) {
    return true;
  }
  if (!Array.isArray(groups) || groups.length !== 1) return false;
  const group = groups[0];
  if (
    !Array.isArray(group?.coveredResources) ||
    group.coveredResources.length !== 2 ||
    !group.coveredResources.includes('cpu') ||
    !group.coveredResources.includes('memory') ||
    !Array.isArray(group.flavors) ||
    group.flavors.length === 0
  ) {
    return false;
  }
  return group.flavors.every(
    (flavor) =>
      typeof flavor?.name === 'string' &&
      Array.isArray(flavor.resources) &&
      flavor.resources.length === 2 &&
      flavor.resources.every(
        (resource, index) =>
          resource?.name === group.coveredResources[index] &&
          (resource.nominalQuota == null ||
            typeof resource.nominalQuota === 'string' ||
            typeof resource.nominalQuota === 'number'),
      ),
  );
};

export const clusterQueueFormSchema = (t: TFunction) => {
  const required = t('plugin__pipelines-console-plugin~Required');
  const name = yup
    .string()
    .strict()
    .matches(resourceNamePattern, {
      message: t(
        'plugin__pipelines-console-plugin~Use lowercase letters, numbers, hyphens or dots. Each dot-separated part must start and end with a letter or number.',
      ),
      excludeEmptyString: true,
    })
    .max(
      253,
      t(
        'plugin__pipelines-console-plugin~Cannot be longer than {{characterCount}} characters.',
        {
          characterCount: 253,
        },
      ),
    );
  const quantityMessage = t(
    'plugin__pipelines-console-plugin~Enter a non-negative Kubernetes quantity.',
  );
  const quantity = yup
    .string()
    .strict()
    .typeError(quantityMessage)
    .matches(quantityPattern, {
      message: quantityMessage,
      excludeEmptyString: true,
    })
    .required(required);
  const flavor = yup.object({
    name: name.required(required),
    cpu: quantity,
    memory: quantity,
  });

  return yup.object({
    name: name.required(required),
    cohort: name,
    queueingStrategy: yup
      .string()
      .oneOf(
        ['BestEffortFIFO', 'StrictFIFO'],
        t('plugin__pipelines-console-plugin~Select a valid queueing strategy.'),
      )
      .required(required),
    flavors: yup.array().when('resource', ([resource], schema) => {
      if (!canEditClusterQueueQuotas(resource)) return schema;
      return schema
        .of(flavor)
        .required(required)
        .min(
          1,
          t(
            'plugin__pipelines-console-plugin~Add at least one resource flavor.',
          ),
        )
        .max(
          64,
          t(
            'plugin__pipelines-console-plugin~A resource group can contain at most 64 flavors.',
          ),
        )
        .test(
          'unique-flavors',
          t(
            'plugin__pipelines-console-plugin~Select each resource flavor only once.',
          ),
          (flavors, context) => {
            const names = flavors?.map((flavor) => flavor?.name) ?? [];
            const duplicate = names.findIndex(
              (name, index) => name && names.indexOf(name) !== index,
            );
            return (
              duplicate === -1 ||
              context.createError({
                path: `${context.path}[${duplicate}].name`,
              })
            );
          },
        );
    }),
  });
};

// Check the input shape before conversion; full API validation belongs to the YAML editor.
export const validateClusterQueueResource = (
  input: unknown,
  t: TFunction,
): ClusterQueueKind => {
  const resource = input as ClusterQueueKind;
  const apiVersion = `${ClusterQueueModel.apiGroup}/${ClusterQueueModel.apiVersion}`;
  const { metadata, spec } = resource ?? {};
  if (
    !isPlainObject(resource) ||
    resource.apiVersion !== apiVersion ||
    resource.kind !== ClusterQueueModel.kind ||
    (metadata !== undefined && !isPlainObject(metadata)) ||
    (spec !== undefined && !isPlainObject(spec)) ||
    [metadata?.name, spec?.cohortName].some(
      (value) => value != null && typeof value !== 'string',
    ) ||
    (spec?.queueingStrategy != null &&
      !['BestEffortFIFO', 'StrictFIFO'].includes(spec.queueingStrategy)) ||
    (spec?.namespaceSelector != null &&
      !isPlainObject(spec.namespaceSelector)) ||
    (spec?.resourceGroups != null &&
      (!Array.isArray(spec.resourceGroups) ||
        !spec.resourceGroups.every(isPlainObject)))
  ) {
    throw new Error(
      t(
        'plugin__pipelines-console-plugin~Use a ClusterQueue with apiVersion {{apiVersion}} and valid field types.',
        { apiVersion },
      ),
    );
  }
  if (metadata?.namespace != null && metadata.namespace !== '') {
    throw new Error(
      t(
        'plugin__pipelines-console-plugin~ClusterQueues must not have a namespace.',
      ),
    );
  }
  return resource;
};
