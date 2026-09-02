import type { FC } from 'react';
import { useRef, useState, useCallback, useMemo, memo } from 'react';
import { debounce } from 'lodash-es';
import { useTranslation } from 'react-i18next';
import { CatalogItem, useFlag } from '@openshift-console/dynamic-plugin-sdk';
import {
  useAccessibleNamespaces,
  useCleanupOnFailure,
  useLoadingTaskCleanup,
  useNamespaceClusterResources,
} from '../pipeline-builder/hooks';
import {
  PipelineBuilderTaskGroup,
  TaskSearchCallback,
  UpdateTasksCallback,
} from '../pipeline-builder/types';
import {
  findInstalledTask,
  getSelectedVersionUrl,
  isArtifactHubTask,
  isTaskSearchable,
  normalizeResourceItems,
  TaskProviders,
} from './pipeline-quicksearch-utils';
import { safeName } from '../pipeline-builder/utils';
import PipelineQuickSearchDetails from './PipelineQuickSearchDetails';
import { CatalogServiceProvider } from '../catalog/service';
import { CatalogService, CatalogType } from '../catalog/types';
import {
  createArtifactHubTask,
  getArtifactHubTaskDetails,
  updateArtifactHubTask,
} from '../catalog/apis/artifactHub';
import { fetchArtifactHubTasks } from '../catalog/apis/artifactHub';
import { normalizeArtifactHubTasks } from '../catalog/providers/useArtifactHubTasksProvider';
import { quickSearch } from '../quick-search/utils/quick-search-utils';
import useTasksProvider from '../catalog/providers/useTasksProvider';
import { useAlphaApiFields } from '../hooks/useAlphaApiFields';
import { PipelineKind } from '../../types';
import { FLAGS } from '../../types';
import QuickSearchModal, { SearchKind } from '../quick-search/QuickSearchModal';

interface QuickSearchProps {
  namespace: string;
  viewContainer?: HTMLElement;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  callback: TaskSearchCallback;
  onUpdateTasks: UpdateTasksCallback;
  taskGroup: PipelineBuilderTaskGroup;
  pipelines: PipelineKind[];
  pipelinesLoaded: boolean;
}

const Contents: FC<
  {
    catalogService: CatalogService;
    selectedNamespace: string;
    setSelectedNamespace: (namespace: string) => void;
  } & QuickSearchProps
> = ({
  catalogService,
  namespace,
  selectedNamespace,
  setSelectedNamespace,
  isOpen,
  setIsOpen,
  callback,
  onUpdateTasks,
  taskGroup,
  pipelines,
  pipelinesLoaded,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const savedCallback = useRef(null);
  const isDevConsoleProxyAvailable = useFlag(FLAGS.DEVCONSOLE_PROXY);
  const [isAlphaEnabled] = useAlphaApiFields();
  savedCallback.current = callback;
  const [failedTasks, setFailedTasks] = useState<string[]>([]);
  const [kind, setKind] = useState<SearchKind>('Task');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [catalogItems, setCatalogItems] = useState<CatalogItem[] | null>(null);
  const [catalogTypes, setCatalogTypes] = useState<CatalogType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchError, setIsSearchError] = useState(false);
  const { namespaces, loaded: namespacesLoaded } = useAccessibleNamespaces();
  const isClusterResolverMode = selectedNamespace !== namespace;
  const searchVersionRef = useRef(0);

  const [tektonTasks] = useTasksProvider({});

  useLoadingTaskCleanup(onUpdateTasks, taskGroup);
  useCleanupOnFailure(failedTasks, onUpdateTasks, taskGroup);

  const pipelineItems = useMemo(
    () =>
      normalizeResourceItems(pipelines, 'Pipeline', callback).filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [pipelines, callback, searchTerm, t],
  );

  // Get all existing task names from taskGroup and installed tasks
  const getExistingTaskNames = (): string[] => {
    const taskNames = new Set<string>();
    [
      ...taskGroup.tasks,
      ...taskGroup.finallyTasks,
      ...taskGroup.listTasks,
      ...taskGroup.loadingTasks,
      ...taskGroup.finallyListTasks,
    ].forEach((t) => {
      if (t?.name) taskNames.add(t.name);
    });

    // Add installed catalog items (avoid duplicates)
    catalogService.items.forEach((catalogItem) => {
      const name = catalogItem.data?.metadata?.name;
      if (name) taskNames.add(name);
    });
    return Array.from(taskNames);
  };

  const handleTaskCreationWithNameConflict = (
    taskName: string,
    createTaskFn: (taskNameToUse?: string) => Promise<any>,
    resolve: (value: any) => void,
  ) => {
    // Checking if task with same name already exists, if yes then create with a different name to avoid conflict
    const existingTaskNames = getExistingTaskNames();
    if (existingTaskNames.includes(taskName)) {
      const taskNameToUse = safeName(existingTaskNames, taskName);
      createTaskFn(taskNameToUse)
        .then(() =>
          resolve(
            savedCallback.current({
              metadata: { name: taskNameToUse },
            }),
          ),
        )
        .catch(() => setFailedTasks([...failedTasks, taskNameToUse]));
    } else {
      resolve(savedCallback.current({ metadata: { name: taskName } }));
      createTaskFn().catch(() => setFailedTasks([...failedTasks, taskName]));
    }
  };

  const catalogServiceItems = useMemo(() => {
    return catalogService.items.reduce<CatalogItem[]>((acc, item) => {
      const installedTask = findInstalledTask(catalogService.items, item);

      if (
        item.provider === TaskProviders.artifactHub &&
        item.type !== TaskProviders.redhat
      ) {
        item.attributes.installed = '';
        if (installedTask) {
          item.attributes.installed =
            installedTask.attributes?.versions[0]?.version?.toString() ??
            installedTask.attributes?.installed?.toString();
        }
      }

      item.cta.callback = async ({ selectedVersion }) => {
        let selectedVersionUrl = getSelectedVersionUrl(item, selectedVersion);
        if (isArtifactHubTask(item) && !selectedVersionUrl) {
          try {
            const details = await getArtifactHubTaskDetails(
              item,
              selectedVersion,
              isDevConsoleProxyAvailable,
            );
            selectedVersionUrl = details.content_url;
          } catch (err) {
            console.warn('Error fetching ArtifactHub task details:', err);
            return;
          }
        }

        return new Promise((resolve) => {
          if (!isArtifactHubTask(item)) {
            resolve(savedCallback.current(item.data));
            return;
          }

          if (
            item.provider === TaskProviders.artifactHub &&
            isArtifactHubTask(item)
          ) {
            if (installedTask) {
              if (selectedVersion === item.attributes.installed) {
                resolve(savedCallback.current(installedTask.data));
              } else {
                resolve(
                  savedCallback.current({
                    metadata: { name: item.data.task.name },
                  }),
                );
                updateArtifactHubTask(
                  selectedVersionUrl,
                  installedTask,
                  namespace,
                  item.data.task.name,
                  selectedVersion,
                  isDevConsoleProxyAvailable,
                ).catch((error) => {
                  console.warn(
                    'Error updating ArtifactHub task - callsite PipelineQuickSearch:',
                    error,
                  );
                  setFailedTasks([...failedTasks, item.data.task.name]);
                });
              }
            } else {
              handleTaskCreationWithNameConflict(
                item.data.task.name,
                (taskNameToUse) =>
                  createArtifactHubTask(
                    selectedVersionUrl,
                    namespace,
                    selectedVersion,
                    isDevConsoleProxyAvailable,
                    taskNameToUse,
                  ),
                resolve,
              );
            }
          }
        });
      };

      if (isTaskSearchable(catalogService.items, item)) {
        acc.push(item);
      }
      return acc;
    }, []);
  }, [
    catalogService.items,
    namespace,
    isDevConsoleProxyAvailable,
    failedTasks,
  ]);

  const searchCatalog = useCallback(
    (searchTermValue: string) => {
      const items = catalogService.loaded
        ? quickSearch(catalogServiceItems, searchTermValue)
        : [];
      const catalogItemTypes = catalogService.catalogExtensions.map(
        (extension) => ({
          label: extension.properties.title,
          value: extension.properties.type,
          description: extension.properties.typeDescription,
        }),
      );
      return {
        filteredItems: items.sort((a, b) => a.name.localeCompare(b.name)),
        viewAllLinks: [],
        catalogItemTypes,
      };
    },
    [
      catalogService.loaded,
      catalogServiceItems,
      catalogService.catalogExtensions,
    ],
  );

  const handleSearch = useCallback(
    async (value: string) => {
      const currentVersion = ++searchVersionRef.current;

      if (kind === 'Pipeline') {
        setIsSearching(false);
        setIsSearchError(false);

        return;
      }

      if (!value) {
        setCatalogItems(null);
        setCatalogTypes([]);
        setIsSearching(false);
        setIsSearchError(false);
        return;
      }

      setIsSearching(true);
      setIsSearchError(false);
      try {
        const [artifactHubResults, catalogResults] = await Promise.all([
          fetchArtifactHubTasks(value),
          Promise.resolve(searchCatalog(value)),
        ]);

        if (currentVersion !== searchVersionRef.current) return;

        const normalizedArtifactHubItems = normalizeArtifactHubTasks(
          artifactHubResults,
          tektonTasks,
        );
        const { filteredItems, catalogItemTypes } = catalogResults;

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
      } catch {
        if (currentVersion !== searchVersionRef.current) return;
        setIsSearchError(true);
        setCatalogItems(null);
      } finally {
        if (currentVersion === searchVersionRef.current) {
          setIsSearching(false);
        }
      }
    },
    [searchCatalog, kind, tektonTasks],
  );

  const debouncedHandleSearch = useMemo(
    () => debounce(handleSearch, 300),
    [handleSearch],
  );

  const onSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);
      if (!value) {
        debouncedHandleSearch.cancel();
        handleSearch(value);
      } else {
        debouncedHandleSearch(value);
      }
    },
    [debouncedHandleSearch, handleSearch],
  );

  const {
    tasks: clusterTasks,
    pipelines: clusterPipelines,
    loaded: clusterResourcesLoaded,
    loadError: clusterResourcesLoadError,
  } = useNamespaceClusterResources(
    isClusterResolverMode ? selectedNamespace : null,
  );

  const clusterResolverItems = useMemo(() => {
    if (!isClusterResolverMode) return [];
    const resources = kind === 'Pipeline' ? clusterPipelines : clusterTasks;
    return normalizeResourceItems(resources, kind, callback).filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [
    isClusterResolverMode,
    kind,
    clusterPipelines,
    clusterTasks,
    selectedNamespace,
    callback,
    searchTerm,
  ]);

  const handleKindChange = useCallback(
    (newKind: SearchKind) => {
      if (newKind === kind) return;

      ++searchVersionRef.current;
      debouncedHandleSearch.cancel();

      setKind(newKind);
      setSearchTerm('');
      setIsSearching(false);
      setIsSearchError(false);

      if (newKind === 'Task') {
        setCatalogItems(null);
        setCatalogTypes([]);
      }
    },
    [kind, debouncedHandleSearch],
  );

  const handleCloseModal = useCallback(() => {
    setIsOpen(false);
    onSearchChange('');
    setSelectedNamespace(namespace);
  }, [setIsOpen, onSearchChange, namespace]);

  let displayedItems;

  if (isClusterResolverMode) {
    displayedItems = clusterResolverItems;
  } else if (kind === 'Pipeline') {
    displayedItems = pipelineItems;
  } else if (searchTerm) {
    displayedItems = catalogItems;
  } else {
    displayedItems = catalogServiceItems;
  }

  const isLoading = isClusterResolverMode
    ? !clusterResourcesLoaded
    : kind === 'Task'
    ? !catalogService.loaded || isSearching
    : !pipelinesLoaded;

  const isSearchErrorState = isClusterResolverMode
    ? !!clusterResourcesLoadError
    : isSearchError;

  let showEmpty = false;

  if (
    !isLoading &&
    !isSearchErrorState &&
    (displayedItems?.length ?? 0) === 0
  ) {
    if (isClusterResolverMode || kind === 'Pipeline' || searchTerm) {
      showEmpty = catalogItems !== null;
    } else {
      showEmpty = true;
    }
  }

  const customPlaceholder =
    kind === 'Pipeline'
      ? t('Search pipelines by name in the project - {{namespace}}', {
          namespace: selectedNamespace,
        })
      : isClusterResolverMode
      ? t('Search installed tasks by name in the project - {{namespace}}', {
          namespace: selectedNamespace,
        })
      : t('Search by name...');

  return (
    <QuickSearchModal
      isOpen={isOpen}
      namespace={namespace}
      closeModal={handleCloseModal}
      searchPlaceholder={customPlaceholder}
      callback={savedCallback.current}
      setFailedTasks={setFailedTasks}
      isDevConsoleProxyAvailable={isDevConsoleProxyAvailable}
      showPipelineKind={isAlphaEnabled}
      items={displayedItems}
      catalogTypes={catalogTypes}
      isLoading={isLoading}
      isSearchError={isSearchError}
      showEmpty={showEmpty}
      kind={kind}
      onKindChange={handleKindChange}
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      detailsRenderer={(props) => <PipelineQuickSearchDetails {...props} />}
      namespaces={namespaces}
      namespacesLoaded={namespacesLoaded}
      selectedNamespace={selectedNamespace}
      onNamespaceChange={setSelectedNamespace}
      isClusterResolverMode={isClusterResolverMode}
    />
  );
};

const PipelineQuickSearch: FC<QuickSearchProps> = ({
  namespace,
  viewContainer,
  isOpen,
  setIsOpen,
  callback,
  onUpdateTasks,
  taskGroup,
  pipelines,
  pipelinesLoaded,
}) => {
  const [selectedNamespace, setSelectedNamespace] = useState<string>(namespace);

  return (
    <CatalogServiceProvider
      namespace={selectedNamespace}
      catalogId="pipelines-task-catalog"
    >
      {(catalogService: CatalogService) => (
        <Contents
          {...{
            namespace,
            selectedNamespace,
            setSelectedNamespace,
            viewContainer,
            isOpen,
            setIsOpen,
            catalogService,
            callback,
            onUpdateTasks,
            taskGroup,
            pipelines,
            pipelinesLoaded,
          }}
        />
      )}
    </CatalogServiceProvider>
  );
};

export default memo(PipelineQuickSearch);
