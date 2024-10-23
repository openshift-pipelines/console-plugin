import {
  CatalogItem,
  CatalogItemMetadataProviderFunction,
  CatalogItemType,
  isCatalogItemType,
  K8sResourceKind,
  useResolvedExtensions,
} from '@openshift-console/dynamic-plugin-sdk';
import * as _ from 'lodash';
import { TektonConfigModel } from '../../models';
import { useK8sGet } from '../hooks/use-k8sGet-hook';
import { TEKTON_HUB_INTEGRATION_KEY, TektonHubTask } from './apis/tektonHub';
import * as catalogImg from './imgs/catalog-icon.svg';

enum CatalogVisibilityState {
  Enabled = 'Enabled',
  Disabled = 'Disabled',
}

export const keywordFilter = <T>(
  filterText: string,
  items: T[],
  compareFunction: (keyword: string, item: T) => boolean,
): T[] => {
  if (!filterText) {
    return items;
  }
  const keywords = _.uniq(filterText.match(/\S+/g)).map((w) => w.toLowerCase());

  // Sort the longest keyword fist
  keywords.sort(function (a: string, b: string) {
    return b.length - a.length;
  });

  return items.filter((item) => {
    return keywords.every((keyword) => {
      return compareFunction(keyword, item);
    });
  });
};

const catalogItemCompare = (keyword: string, item: CatalogItem): boolean => {
  if (!item) {
    return false;
  }
  return (
    item.name.toLowerCase().includes(keyword) ||
    (typeof item.description === 'string' &&
      item.description.toLowerCase().includes(keyword)) ||
    item.type.toLowerCase().includes(keyword) ||
    item.tags?.some((tag) => tag.includes(keyword)) ||
    item.cta?.label.toLowerCase().includes(keyword)
  );
};

export const keywordCompare = (
  filterString: string,
  items: CatalogItem[],
): CatalogItem[] => {
  return keywordFilter(filterString, items, catalogItemCompare);
};

export const applyCatalogItemMetadata = (
  catalogItems: CatalogItem[],
  metadataProviderMap: {
    [type: string]: { [id: string]: CatalogItemMetadataProviderFunction };
  },
) =>
  catalogItems.map((item) => {
    const metadataProviders = Object.values(
      metadataProviderMap[item.type] ?? {},
    );
    if (metadataProviders?.length) {
      const metadata = metadataProviders
        .map((metadataProvider) => metadataProvider(item))
        .filter((x) => x);

      const tags = _.flatten(metadata.map((m) => m.tags).filter((x) => x));
      const badges = _.flatten(metadata.map((m) => m.badges).filter((x) => x));
      const attributes = metadata.reduce(
        (acc, m) => Object.assign(acc, m.attributes),
        {} as CatalogItem['attributes'],
      );
      const attributeCount = Object.keys(attributes).length;
      if (tags.length > 0 || badges.length > 0 || attributeCount > 0) {
        return {
          ...item,
          tags: tags.length > 0 ? [...(item.tags ?? []), ...tags] : item.tags,
          badges:
            badges.length > 0
              ? [...(item.badges ?? []), ...badges]
              : item.badges,
          attributes: attributeCount
            ? { ...item.attributes, ...attributes }
            : item.attributes,
        };
      }
    }
    return item;
  });

export const useGetAllDisabledSubCatalogs = () => {
  const [catalogExtensionsArray] =
    useResolvedExtensions<CatalogItemType>(isCatalogItemType);
  const catalogTypeExtensions = catalogExtensionsArray.map((type) => {
    return type.properties.type;
  });
  let disabledSubCatalogs = [];
  if ((window as any).SERVER_FLAGS.developerCatalogTypes) {
    const developerCatalogTypes = JSON.parse(
      (window as any).SERVER_FLAGS.developerCatalogTypes,
    );
    if (
      developerCatalogTypes?.state === CatalogVisibilityState.Enabled &&
      developerCatalogTypes?.enabled?.length > 0
    ) {
      disabledSubCatalogs = catalogTypeExtensions.filter(
        (val) => !developerCatalogTypes?.enabled.includes(val),
      );
      return [disabledSubCatalogs];
    }
    if (developerCatalogTypes?.state === CatalogVisibilityState.Disabled) {
      if (developerCatalogTypes?.disabled?.length > 0) {
        return [developerCatalogTypes?.disabled, catalogTypeExtensions];
      }
      return [catalogTypeExtensions];
    }
  }
  return [disabledSubCatalogs];
};

export const normalizeIconClass = (iconClass: string): string => {
  return _.startsWith(iconClass, 'icon-')
    ? `font-icon ${iconClass}`
    : iconClass;
};

export const getIconProps = (item: CatalogItem) => {
  const { icon } = item;
  if (!icon) {
    return {};
  }
  if (icon.url) {
    return { iconImg: icon.url, iconClass: null };
  }
  if (icon.class) {
    return { iconImg: null, iconClass: normalizeIconClass(icon.class) };
  }
  if (icon.node) {
    return { iconImg: null, iconClass: null, icon: icon.node };
  }
  return { iconImg: catalogImg, iconClass: null };
};

export const getClusterPlatform = (): string =>
  `${(window as any).SERVER_FLAGS.GOOS}/${(window as any).SERVER_FLAGS.GOARCH}`;

export const filterBySupportedPlatforms = (task: TektonHubTask): boolean => {
  const supportedPlatforms = task?.platforms.map((p) => p.name) ?? [];
  return supportedPlatforms.includes(getClusterPlatform());
};

export const useTektonHubIntegration = () => {
  const [config, configLoaded, configLoadErr] = useK8sGet<K8sResourceKind>(
    TektonConfigModel,
    'config',
  );
  if (!configLoaded) {
    return false;
  }
  // return false only if TEKTON_HUB_INTEGRATION_KEY value is set to 'false'
  if (config && configLoaded && !configLoadErr) {
    const devconsoleIntegrationEnabled = config.spec?.hub?.params?.find(
      (p) => p.name === TEKTON_HUB_INTEGRATION_KEY,
    );
    return devconsoleIntegrationEnabled?.value?.toLowerCase() !== 'false';
  }
  return true;
};
