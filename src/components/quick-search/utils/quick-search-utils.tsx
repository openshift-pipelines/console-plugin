import * as React from 'react';
import { CatalogItem } from '@openshift-console/dynamic-plugin-sdk';
import { keywordCompare } from '../../catalog/catalog-utils';
import { removeQueryArgument } from '../../utils/router';

export const quickSearch = (items: CatalogItem[], query: string) => {
  return keywordCompare(query, items);
};

export const handleCta = async (
  e: React.SyntheticEvent,
  item: CatalogItem,
  closeModal: () => void,
  history,
  callbackProps: { [key: string]: string } = {},
) => {
  e.preventDefault();
  const { href, callback } = item.cta;
  if (callback) {
    closeModal();
    await callback(callbackProps);
    removeQueryArgument('catalogSearch');
  } else history.push(href);
};
