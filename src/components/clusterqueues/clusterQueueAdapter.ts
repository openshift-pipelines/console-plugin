import { dump, load } from 'js-yaml';
import { ClusterQueueModel } from '../../models';
import type { SyncedResourceEditorAdapter } from '../synced-resource-editor';
import { typeChecks } from '../utils/type-guards';

export type ClusterQueueFormData = {
  name: string;
  cohort: string;
};

// this does not represent the actual ClusterQueue resource
export type ClusterQueueResource = {
  apiVersion: string;
  kind: string;
  metadata: Record<string, unknown> & { name: string };
  spec?: Record<string, unknown> & { cohortName?: string };
};

const apiVersion = `${ClusterQueueModel.apiGroup}/${ClusterQueueModel.apiVersion}`;

export const initialClusterQueueResource: ClusterQueueResource = {
  apiVersion,
  kind: ClusterQueueModel.kind,
  metadata: { name: '' },
  spec: { namespaceSelector: {} },
};

export const clusterQueueAdapter: SyncedResourceEditorAdapter<
  ClusterQueueFormData,
  ClusterQueueResource
> = {
  resourceToForm: (resource) => ({
    name: resource.metadata.name,
    cohort: typeChecks.isString(resource.spec?.cohortName)
      ? resource.spec.cohortName
      : '',
  }),
  formToResource: (formData, resource) => {
    const spec = { ...(resource.spec ?? {}) };
    if (formData.cohort) spec.cohortName = formData.cohort;
    else delete spec.cohortName;

    return {
      ...resource,
      metadata: { ...resource.metadata, name: formData.name },
      spec,
    };
  },
  yamlToResource: (yaml) => {
    const resource = load(yaml);
    if (
      !typeChecks.isRecord(resource) ||
      resource.apiVersion !== apiVersion ||
      resource.kind !== ClusterQueueModel.kind ||
      !typeChecks.isRecord(resource.metadata) ||
      !typeChecks.isString(resource.metadata.name) ||
      (resource.spec !== undefined && !typeChecks.isRecord(resource.spec)) ||
      (typeChecks.isRecord(resource.spec) &&
        resource.spec.cohortName !== undefined &&
        !typeChecks.isString(resource.spec.cohortName))
    ) {
      throw new Error('YAML must describe a valid ClusterQueue.');
    }
    return resource as ClusterQueueResource;
  },
  resourceToYAML: (resource) => dump(resource, { noRefs: true }),
};
