import * as React from 'react';
import { Split, SplitItem, Divider } from '@patternfly/react-core';
import cx from 'classnames';
import { CatalogItem } from '@openshift-console/dynamic-plugin-sdk';
import QuickSearchDetails, {
  DetailsRendererFunction,
} from './QuickSearchDetails';
import QuickSearchList from './QuickSearchList';
import { CatalogLinkData } from './utils/quick-search-types';
import { CatalogType } from '../catalog/types';
import { TaskSearchCallback } from '../pipeline-builder/types';
import './QuickSearchContent.scss';

interface QuickSearchContentProps {
  catalogItems: CatalogItem[];
  catalogItemTypes: CatalogType[];
  searchTerm: string;
  namespace: string;
  selectedItemId: string;
  selectedItem: CatalogItem;
  limitItemCount?: number;
  onSelect: (itemId: string) => void;
  viewAll?: CatalogLinkData[];
  closeModal: () => void;
  detailsRenderer?: DetailsRendererFunction;
  onListChange?: (items: number) => void;
  callback?: TaskSearchCallback;
  setFailedTasks?: React.Dispatch<React.SetStateAction<string[]>>;
}

const QuickSearchContent: React.FC<QuickSearchContentProps> = ({
  catalogItems,
  catalogItemTypes,
  viewAll,
  searchTerm,
  namespace,
  selectedItem,
  selectedItemId,
  onSelect,
  closeModal,
  limitItemCount,
  detailsRenderer,
  onListChange,
  callback,
  setFailedTasks,
}) => {
  return (
    <Split className="ocs-quick-search-content">
      <SplitItem
        className={cx('ocs-quick-search-content__list', {
          'ocs-quick-search-content__list--overflow':
            catalogItems.length >= limitItemCount,
        })}
      >
        <QuickSearchList
          listItems={catalogItems}
          limitItemCount={limitItemCount}
          catalogItemTypes={catalogItemTypes}
          viewAll={viewAll}
          selectedItemId={selectedItemId}
          searchTerm={searchTerm}
          namespace={namespace}
          onSelectListItem={(_event, itemId) => onSelect(itemId)}
          closeModal={closeModal}
          onListChange={onListChange}
        />
      </SplitItem>
      <Divider component="div" orientation={{ default: 'vertical' }} />
      <SplitItem className="ocs-quick-search-content__details">
        <QuickSearchDetails
          detailsRenderer={detailsRenderer}
          selectedItem={selectedItem}
          closeModal={closeModal}
          namespace={namespace}
          callback={callback}
          setFailedTasks={setFailedTasks}
        />
      </SplitItem>
    </Split>
  );
};

export default QuickSearchContent;
