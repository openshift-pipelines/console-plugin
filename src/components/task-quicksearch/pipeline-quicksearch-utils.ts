import { CatalogItem } from '@openshift-console/dynamic-plugin-sdk';
import { TaskModel } from '../../models';
import { t } from '../utils/common-utils';
import { ARTIFACTHUB, CTALabel } from './const';

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
