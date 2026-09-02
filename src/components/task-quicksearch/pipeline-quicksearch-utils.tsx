import {
  CatalogItem,
  ResourceIcon,
  getGroupVersionKindForModel,
} from '@openshift-console/dynamic-plugin-sdk';
import { PipelineModel, TaskModel } from '../../models';
import { t } from '../utils/common-utils';
import { ARTIFACTHUB, CTALabel } from './const';
import { TaskKind } from 'src/types/task';
import { PipelineKind } from 'src/types/pipeline';
import { SearchKind } from '../quick-search/QuickSearchModal';
import { TaskSearchCallback } from '../pipelines-details/types';

export enum TaskProviders {
  redhat = 'Red Hat',
  community = 'Community',
  artifactHub = 'ArtifactHub',
}

export enum TektonTaskAnnotation {
  minVersion = ' tekton.dev/pipelines.minVersion',
  tags = 'tekton.dev/tags',
  categories = 'tekton.dev/categories',
  installedFrom = 'openshift.io/installed-from',
  semVersion = 'openshift.io/sem-version',
}

export enum TektonTaskLabel {
  providerType = 'operator.tekton.dev/provider-type',
  version = 'app.kubernetes.io/version',
}

export const isSelectedVersionInstalled = (
  item: CatalogItem,
  selectedVersion: string,
): boolean => {
  return item.attributes?.installed === selectedVersion;
};

export const isTaskVersionInstalled = (item: CatalogItem): boolean =>
  !!item.attributes?.installed;

export const isOneVersionInstalled = (item: CatalogItem): boolean => {
  return !!(
    item.attributes?.installed &&
    item.attributes?.versions?.some(
      (v) => v.version?.toString() === item.attributes?.installed?.toString(),
    )
  );
};

export const isArtifactHubTask = (item: CatalogItem): boolean => {
  return (
    item.data.source === ARTIFACTHUB &&
    item.provider === TaskProviders.artifactHub
  );
};

export const isSelectedVersionUpgradable = (
  item: CatalogItem,
  selectedVersion: string,
): boolean => {
  return (
    !isSelectedVersionInstalled(item, selectedVersion) &&
    isOneVersionInstalled(item)
  );
};

export const getTaskCtaType = (item: CatalogItem, selectedVersion: string) => {
  return isSelectedVersionInstalled(item, selectedVersion)
    ? CTALabel.Add
    : isSelectedVersionUpgradable(item, selectedVersion)
    ? CTALabel.Update
    : CTALabel.Install;
};

export const getCtaButtonText = (
  item: CatalogItem,
  selectedVersion: string,
): string => {
  const ctaType = getTaskCtaType(item, selectedVersion);
  switch (ctaType) {
    case CTALabel.Add:
      return t('Add');
    case CTALabel.Install:
      return t('Install and add');
    case CTALabel.Update:
      return t('Update and add');
    default:
      throw new Error(`Unknown button type, ${ctaType}`);
  }
};

export const isInstalledNamespaceTask = (item: CatalogItem) => {
  return (
    item.data.kind === TaskModel.kind &&
    item.data.metadata?.annotations?.[TektonTaskAnnotation.installedFrom] ===
      ARTIFACTHUB
  );
};

export const isExternalTask = (item: CatalogItem) => {
  return !Object.prototype.hasOwnProperty.call(item.data, 'apiVersion');
};

export const isTaskSearchable = (items: CatalogItem[], item: CatalogItem) => {
  const hasExternalTasks = items.some(isExternalTask);
  return !hasExternalTasks || !isInstalledNamespaceTask(item);
};

export const getSelectedVersionUrl = (
  item: CatalogItem,
  version: string,
): string | null => {
  if (!item?.attributes?.versions) {
    return null;
  }
  if (item.attributes.selectedVersionForContentUrl !== version) {
    return null;
  }

  return item.attributes.selectedVersionContentUrl ?? null;
};

export const findInstalledTask = (
  items: CatalogItem[],
  item: CatalogItem,
): CatalogItem => {
  return items.find(
    (i) =>
      i.uid !== item.uid &&
      i.name === item.name &&
      i.data.kind === TaskModel.kind &&
      i.data.metadata?.annotations?.[TektonTaskAnnotation.installedFrom] ===
        ARTIFACTHUB,
  );
};

export const normalizeResourceItems = (
  resources: (TaskKind | PipelineKind)[],
  resourceKind: SearchKind, // 'Task' | 'Pipeline'
  onAdd: TaskSearchCallback | undefined,
): CatalogItem[] =>
  (Array.isArray(resources) ? resources : []).map((resource) => {
    const {
      uid,
      name,
      annotations = {},
      creationTimestamp,
      labels = {},
    } = resource.metadata;
    const version =
      resource.metadata.labels?.[TektonTaskLabel.version] ?? undefined;
    const categories =
      annotations[TektonTaskAnnotation.categories]?.split(/\s*,\s*/) || [];
    const provider =
      annotations[TektonTaskAnnotation.installedFrom] || TaskProviders.redhat;

    return {
      uid,
      name,
      description:
        (resource.spec as { description?: string })?.description ?? '',
      type: resourceKind,
      namespace: resource.metadata.namespace,
      labels,
      creationTimestamp,
      provider,
      icon: {
        node: (
          <ResourceIcon
            groupVersionKind={getGroupVersionKindForModel(
              resourceKind === 'Pipeline' ? PipelineModel : TaskModel,
            )}
          />
        ),
      },
      cta: {
        label: 'Add',
        callback: async () => {
          onAdd?.(resource as any);
        },
      },
      attributes: {
        installed: version ?? 'installed',
        versions: version ? [{ id: version, version }] : [],
        categories,
      },
      tags:
        resourceKind === 'Pipeline'
          ? Object.keys(resource?.spec)
              .filter((key) => key !== 'description')
              .map((key) => `${resource.spec[key].length} ${key}`)
          : [],
      data: resource,
    };
  });
