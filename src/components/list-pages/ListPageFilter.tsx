import * as React from 'react';
import {
  ListPageFilter as ListPageFilterSDK,
  ListPageFilterProps,
} from '@openshift-console/dynamic-plugin-sdk';

import './ListPage.scss';

export const ListPageFilter: React.FC<ListPageFilterProps> = (props) => {
  return (
    <div className="cp-list-page-filter-toolbar">
      <ListPageFilterSDK {...props} />
    </div>
  );
};
