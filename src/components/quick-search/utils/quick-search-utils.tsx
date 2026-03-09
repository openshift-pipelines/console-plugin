import type { SyntheticEvent } from 'react';
import { CatalogItem } from '@openshift-console/dynamic-plugin-sdk';
import { keywordCompare } from '../../catalog/catalog-utils';
import { removeQueryArgument } from '../../utils/router';

export const quickSearch = (items: CatalogItem[], query: string) => {
  return keywordCompare(query, items);
};

export const handleCta = async (
  e: SyntheticEvent,
  item: CatalogItem,
  closeModal: () => void,
  navigate: (path: string) => void,
  callbackProps: { [key: string]: any } = {},
) => {
  e.preventDefault();
  const { href, callback } = item.cta;
  if (callback) {
    closeModal();
    await callback({
      ...callbackProps,
      selectedVersion: item.data?.version ?? item.data?.task?.version,
      selectedItem: item,
    });
    removeQueryArgument('catalogSearch');
  } else navigate(href);
};
