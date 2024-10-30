import {
  CatalogItem,
  CatalogItemType,
  ResolvedExtension,
} from '@openshift-console/dynamic-plugin-sdk';

export type CatalogType = {
  label: string;
  value: string;
  description: string;
};

export type CatalogService = {
  type: string;
  items: CatalogItem[];
  itemsMap: { [type: string]: CatalogItem[] };
  loaded: boolean;
  loadError: any;
  searchCatalog: (query: string) => CatalogItem[];
  catalogExtensions: ResolvedExtension<CatalogItemType>[];
};
