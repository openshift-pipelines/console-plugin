import type { FC } from 'react';
import {
  ListPageFilter as ListPageFilterSDK,
  ListPageFilterProps,
} from '@openshift-console/dynamic-plugin-sdk';

import './ListPage.scss';

export const ListPageFilter: FC<ListPageFilterProps> = (props) => {
  return (
    <div className="cp-list-page-filter-toolbar">
      <ListPageFilterSDK {...props} />
    </div>
  );
};
