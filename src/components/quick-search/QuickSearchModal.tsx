import * as React from 'react';
import {
	Modal,
	ModalVariant
} from '@patternfly/react-core/deprecated';
import { useTranslation } from 'react-i18next';
import { DetailsRendererFunction } from './QuickSearchDetails';
import QuickSearchModalBody from './QuickSearchModalBody';
import { QuickSearchData } from './utils/quick-search-types';
import './QuickSearchModal.scss';
import { useBoundingClientRect } from './useBoundingClientRect';
import { TaskSearchCallback } from '../pipeline-builder/types';

interface QuickSearchModalProps {
  isOpen: boolean;
  namespace: string;
  closeModal: () => void;
  allCatalogItemsLoaded: boolean;
  searchCatalog: (searchTerm: string) => QuickSearchData;
  searchPlaceholder: string;
  viewContainer?: HTMLElement;
  limitItemCount?: number;
  icon?: React.ReactNode;
  detailsRenderer?: DetailsRendererFunction;
  callback?: TaskSearchCallback;
  setFailedTasks?: React.Dispatch<React.SetStateAction<string[]>>;
}

const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  namespace,
  closeModal,
  searchCatalog,
  searchPlaceholder,
  allCatalogItemsLoaded,
  viewContainer,
  icon,
  limitItemCount,
  detailsRenderer,
  callback,
  setFailedTasks,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const clientRect = useBoundingClientRect(viewContainer);
  const maxHeight = clientRect?.height;
  const maxWidth = clientRect?.width;

  return viewContainer ? (
    <Modal
      className="ocs-quick-search-modal"
      variant={ModalVariant.medium}
      aria-label={t('Quick search')}
      isOpen={isOpen}
      showClose={false}
      position="top"
      positionOffset="15%"
      hasNoBodyWrapper
      appendTo={viewContainer}
    >
      <QuickSearchModalBody
        allCatalogItemsLoaded={allCatalogItemsLoaded}
        searchCatalog={searchCatalog}
        searchPlaceholder={searchPlaceholder}
        namespace={namespace}
        closeModal={closeModal}
        limitItemCount={limitItemCount}
        icon={icon}
        detailsRenderer={detailsRenderer}
        maxDimension={{ maxHeight, maxWidth }}
        viewContainer={viewContainer}
        callback={callback}
        setFailedTasks={setFailedTasks}
      />
    </Modal>
  ) : null;
};

export default QuickSearchModal;
