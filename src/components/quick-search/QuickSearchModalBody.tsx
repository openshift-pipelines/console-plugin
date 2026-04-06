import type { ReactNode, SetStateAction, Dispatch, FC, FormEvent } from 'react';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { debounce } from 'lodash-es';
import { useNavigate } from 'react-router';
import { ResizeDirection } from 're-resizable';
import { Rnd } from 'react-rnd';
import { CatalogItem, useFlag } from '@openshift-console/dynamic-plugin-sdk';
import QuickSearchBar from './QuickSearchBar';
import QuickSearchContent from './QuickSearchContent';
import { DetailsRendererFunction } from './QuickSearchDetails';
import { CatalogLinkData, QuickSearchData } from './utils/quick-search-types';
import { handleCta } from './utils/quick-search-utils';
import { CatalogType } from '../catalog/types';
import {
  getQueryArgument,
  removeQueryArgument,
  setQueryArgument,
} from '../utils/router';
import { fetchArtifactHubTasks } from '../catalog/apis/artifactHub';
import { normalizeArtifactHubTasks } from '../catalog/providers/useArtifactHubTasksProvider';
import { TaskSearchCallback } from '../pipeline-builder/types';
import useTasksProvider from '../catalog/providers/useTasksProvider';

import './QuickSearchModalBody.scss';
import { FLAGS } from '../../types';

interface QuickSearchModalBodyProps {
  allCatalogItemsLoaded: boolean;
  searchCatalog: (searchTerm: string) => QuickSearchData;
  searchPlaceholder: string;
  namespace: string;
  closeModal: () => void;
  limitItemCount?: number;
  icon?: ReactNode;
  detailsRenderer?: DetailsRendererFunction;
  maxDimension?: { maxHeight: number; maxWidth: number };
  viewContainer?: HTMLElement; // pass the html container element to specifythe movement boundary
  callback?: TaskSearchCallback;
  setFailedTasks?: Dispatch<SetStateAction<string[]>>;
}

const QuickSearchModalBody: FC<QuickSearchModalBodyProps> = ({
  searchCatalog,
  namespace,
  closeModal,
  limitItemCount,
  searchPlaceholder,
  allCatalogItemsLoaded,
  icon,
  detailsRenderer,
  maxDimension,
  viewContainer,
  callback,
  setFailedTasks,
}) => {
  const DEFAULT_HEIGHT_WITH_NO_ITEMS = 60;
  const DEFAULT_HEIGHT_WITH_ITEMS = 483;
  const MIN_HEIGHT = 240;
  const MIN_WIDTH = 225;
  const navigate = useNavigate();
  const isDevConsoleProxyAvailable = useFlag(FLAGS.DEVCONSOLE_PROXY);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>(null);
  const [catalogTypes, setCatalogTypes] = useState<CatalogType[]>([]);
  const [isRndActive, setIsRndActive] = useState(false);
  const [maxHeight, setMaxHeight] = useState(
    DEFAULT_HEIGHT_WITH_NO_ITEMS,
  );
  const [minHeight, setMinHeight] = useState(
    DEFAULT_HEIGHT_WITH_NO_ITEMS,
  );
  const [minWidth, setMinWidth] = useState(MIN_WIDTH);
  const [searchTerm, setSearchTerm] = useState<string>(
    getQueryArgument('catalogSearch') || '',
  );
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<CatalogItem>(null);
  const [viewAll, setViewAll] = useState<CatalogLinkData[]>(null);
  const [items, setItems] = useState<number>(limitItemCount);
  const [modalSize, setModalSize] = useState<{
    height: number;
    width: number;
  }>();
  const [tektonTasks] = useTasksProvider({});
  const [draggableBoundary, setDraggableBoundary] =
    useState<string>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchError, setIsSearchError] = useState(false);
  const ref = useRef<HTMLDivElement>();
  const listCatalogItems =
    limitItemCount > 0 ? catalogItems?.slice(0, items) : catalogItems;

  const getModalHeight = () => {
    let height: number = DEFAULT_HEIGHT_WITH_NO_ITEMS;
    if (catalogItems?.length > 0) {
      if (modalSize?.height >= minHeight) {
        return modalSize?.height;
      }
      setModalSize({ ...modalSize, height: DEFAULT_HEIGHT_WITH_ITEMS });
      height = DEFAULT_HEIGHT_WITH_ITEMS;
    }
    return height;
  };

  useEffect(() => {
    if (viewContainer) {
      const className = viewContainer.classList;
      setDraggableBoundary(`.${className[0]}`);
    }
  }, [viewContainer]);

  useEffect(() => {
    if (catalogItems === null || catalogItems?.length === 0) {
      setMaxHeight(DEFAULT_HEIGHT_WITH_NO_ITEMS);
      setMinHeight(DEFAULT_HEIGHT_WITH_NO_ITEMS);
      setMinWidth(MIN_WIDTH);
    } else if (catalogItems?.length > 0) {
      setMaxHeight(maxDimension?.maxHeight || undefined);
      setMinHeight(MIN_HEIGHT);
      setMinWidth(MIN_WIDTH);
    }
  }, [catalogItems, maxDimension]);

  useEffect(() => {
    if (ref.current) {
      const { width, height } = ref.current.getBoundingClientRect();
      setModalSize({ width, height });
    }
  }, []);

  useEffect(() => {
    if (catalogItems && !selectedItemId) {
      setSelectedItemId(catalogItems[0]?.uid);
      setSelectedItem(catalogItems[0]);
    }
  }, [catalogItems, selectedItemId]);

  const handleDrag = () => {
    setIsRndActive(true);
  };

  const handleResize = (
    e: MouseEvent,
    direction: ResizeDirection,
    elementRef: HTMLElement,
  ) => {
    setIsRndActive(true);
    setModalSize({
      height: elementRef.offsetHeight,
      width: elementRef.offsetWidth,
    });
  };

  const handleResizeStop = () => {
    setTimeout(() => setIsRndActive(false), 0);
  };

  const searchVersion = useRef(0);

  const handleSearch = useCallback(
    async (value: string) => {
      const currentVersion = ++searchVersion.current;

      if (!value) {
        setCatalogItems(null);
        removeQueryArgument('catalogSearch');
        setIsSearching(false);
        setIsSearchError(false);
        return;
      }

      setIsSearching(true);
      setIsSearchError(false);
      try {
        const [artifactHubResults, catalogResults] = await Promise.all([
          fetchArtifactHubTasks(value),
          searchCatalog(value),
        ]);

        // Ignore results if a newer search version has started
        if (currentVersion !== searchVersion.current) return;

        const normalizedArtifactHubItems = normalizeArtifactHubTasks(
          artifactHubResults,
          tektonTasks,
        );
        const { filteredItems, viewAllLinks, catalogItemTypes } = catalogResults;

        const mergedItems = [
          ...filteredItems,
          ...normalizedArtifactHubItems,
        ].filter(
          (item, index, self) =>
            index ===
            self.findIndex(
              (i) =>
                i.name === item.name &&
                i.data?.version === item.data?.version &&
                i.provider === item.provider,
            ),
        );
        setCatalogItems(mergedItems);
        setCatalogTypes(catalogItemTypes);
        setViewAll(viewAllLinks);
        setQueryArgument('catalogSearch', value);
        setSelectedItemId(null);
      } catch (error) {
        setIsSearchError(true);
        setCatalogItems(null);
      } finally {
        setIsSearching(false);
      }
    },
    [searchCatalog],
  );

  const debouncedHandleSearch = useMemo(
    () => debounce(handleSearch, 300),
    [handleSearch],
  );

  const onSearch = useCallback(
    (_event: FormEvent<HTMLInputElement>, value: string) => {
      setSearchTerm(value);
      debouncedHandleSearch(value);
    },
    [debouncedHandleSearch],
  );

  const onCancel = useCallback(() => {
    const searchInput = ref.current?.firstElementChild
      ?.children?.[1] as HTMLInputElement;
    if (searchInput?.value) {
      document.activeElement !== searchInput && searchInput.focus();
      onSearch(null, '');
    } else {
      closeModal();
    }
  }, [closeModal, onSearch]);

  const getIndexOfSelectedItem = useCallback(
    () => listCatalogItems?.findIndex((item) => item.uid === selectedItemId),
    [listCatalogItems, selectedItemId],
  );

  const onEnter = useCallback(
    (e) => {
      const { id } = document.activeElement;
      const activeViewAllLink = viewAll?.find(
        (link) => link.catalogType === id,
      );
      if (activeViewAllLink) {
        navigate(activeViewAllLink.to);
      } else if (selectedItem) {
        handleCta(e, selectedItem, closeModal, navigate, {
          callback,
          setFailedTasks,
          namespace,
          isDevConsoleProxyAvailable,
        });
      }
    },
    [closeModal, selectedItem, viewAll],
  );

  const selectPrevious = useCallback(() => {
    let index = getIndexOfSelectedItem();
    if (index === 0) index = listCatalogItems?.length;
    setSelectedItemId(listCatalogItems?.[index - 1]?.uid);
    setSelectedItem(listCatalogItems?.[index - 1]);
  }, [listCatalogItems, getIndexOfSelectedItem]);

  const selectNext = useCallback(() => {
    const index = getIndexOfSelectedItem();
    setSelectedItemId(listCatalogItems?.[index + 1]?.uid);
    setSelectedItem(listCatalogItems?.[index + 1]);
  }, [listCatalogItems, getIndexOfSelectedItem]);

  const handleListChange = (i: number) => {
    setItems(i);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'Escape': {
          e.preventDefault();
          onCancel();
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          selectPrevious();
          break;
        }
        case 'ArrowDown': {
          e.preventDefault();
          selectNext();
          break;
        }
        case 'Enter': {
          e.preventDefault();
          onEnter(e);
          break;
        }
        case 'Space': {
          if (e.ctrlKey) {
            e.preventDefault();
            closeModal();
          }
          break;
        }
        default:
      }
    };

    const onOutsideClick = (e: MouseEvent) => {
      const modalBody = ref.current.parentElement;
      if (!modalBody?.contains(e.target as Node) && !isRndActive) {
        closeModal();
      }
    };

    document.addEventListener('click', onOutsideClick);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('click', onOutsideClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [closeModal, onCancel, onEnter, selectNext, selectPrevious, isRndActive]);

  return (
    <Rnd
      style={{ position: 'relative' }}
      size={{ height: modalSize?.height, width: modalSize?.width }}
      onDrag={handleDrag}
      onDragStop={handleResizeStop}
      onResize={handleResize}
      maxHeight={maxHeight}
      maxWidth={maxDimension?.maxWidth || undefined}
      minHeight={minHeight}
      minWidth={minWidth}
      bounds={draggableBoundary}
      onResizeStop={handleResizeStop}
      dragHandleClassName="ocs-quick-search-bar"
      cancel=".ocs-quick-search-bar__input"
      enableResizing={
        catalogItems === null || catalogItems?.length === 0
          ? {
              bottom: false,
              bottomLeft: false,
              bottomRight: false,
              left: true,
              right: true,
              top: false,
              topLeft: false,
              topRight: false,
            }
          : true
      }
    >
      <div
        ref={ref}
        className="ocs-quick-search-modal-body"
        style={{
          height: getModalHeight(),
        }}
      >
        <QuickSearchBar
          searchTerm={searchTerm}
          searchPlaceholder={searchPlaceholder}
          onSearch={onSearch}
          showNoResults={!isSearchError && catalogItems?.length === 0}
          showError={isSearchError}
          itemsLoaded={allCatalogItemsLoaded && !isSearching}
          icon={icon}
          autoFocus
        />
        {catalogItems && selectedItem && (
          <QuickSearchContent
            catalogItems={catalogItems}
            catalogItemTypes={catalogTypes}
            viewAll={viewAll}
            searchTerm={searchTerm}
            selectedItemId={selectedItemId}
            closeModal={closeModal}
            selectedItem={selectedItem}
            namespace={namespace}
            limitItemCount={limitItemCount}
            detailsRenderer={detailsRenderer}
            onListChange={handleListChange}
            onSelect={(itemId) => {
              setSelectedItemId(itemId);
              setSelectedItem(
                catalogItems?.find((item) => item.uid === itemId),
              );
            }}
            callback={callback}
            setFailedTasks={setFailedTasks}
          />
        )}
      </div>
    </Rnd>
  );
};

export default QuickSearchModalBody;
