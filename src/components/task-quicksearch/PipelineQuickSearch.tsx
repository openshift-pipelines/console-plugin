import * as React from 'react';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { useTranslation } from 'react-i18next';
import { useFlag } from '@openshift-console/dynamic-plugin-sdk';
import {
  useCleanupOnFailure,
  useLoadingTaskCleanup,
} from '../pipeline-builder/hooks';
import {
  PipelineBuilderTaskGroup,
  TaskSearchCallback,
  UpdateTasksCallback,
} from '../pipeline-builder/types';
import {
  createTask,
  findInstalledTask,
  getSelectedVersionUrl,
  isArtifactHubTask,
  isTaskSearchable,
  TaskProviders,
  updateTask,
} from './pipeline-quicksearch-utils';
import PipelineQuickSearchDetails from './PipelineQuickSearchDetails';
import { CatalogServiceProvider } from '../catalog/service';
import { CatalogService } from '../catalog/types';
import { QuickSearchProviders } from './quick-search-types';
import { QuickSearchController } from '../quick-search';
import {
  createArtifactHubTask,
  updateArtifactHubTask,
} from '../catalog/apis/artifactHub';
import { FLAGS } from '../../types';

interface QuickSearchProps {
  namespace: string;
  viewContainer?: HTMLElement;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  callback: TaskSearchCallback;
  onUpdateTasks: UpdateTasksCallback;
  taskGroup: PipelineBuilderTaskGroup;
}

const Contents: React.FC<
  {
    catalogService: CatalogService;
  } & QuickSearchProps
> = ({
  catalogService,
  namespace,
  viewContainer,
  isOpen,
  setIsOpen,
  callback,
  onUpdateTasks,
  taskGroup,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const savedCallback = React.useRef(null);
  const isDevConsoleProxyAvailable = useFlag(FLAGS.DEVCONSOLE_PROXY);
  savedCallback.current = callback;
  const [failedTasks, setFailedTasks] = React.useState<string[]>([]);

  useLoadingTaskCleanup(onUpdateTasks, taskGroup);
  useCleanupOnFailure(failedTasks, onUpdateTasks, taskGroup);

  const catalogServiceItems = catalogService.items.reduce((acc, item) => {
    const installedTask = findInstalledTask(catalogService.items, item);

    if (
      (item.provider === TaskProviders.artifactHub ||
        item.provider === TaskProviders.tektonHub) &&
      item.type !== TaskProviders.redhat
    ) {
      item.attributes.installed = '';
      if (installedTask) {
        item.attributes.installed =
          installedTask.attributes?.versions[0]?.version?.toString();
      }
    }

    item.cta.callback = ({ selectedVersion }) => {
      return new Promise((resolve) => {
        if (!isArtifactHubTask(item)) {
          if (item.provider === TaskProviders.tektonHub) {
            const selectedVersionUrl = getSelectedVersionUrl(
              item,
              selectedVersion,
            );
            if (installedTask) {
              if (selectedVersion === item.attributes.installed) {
                resolve(savedCallback.current(installedTask.data));
              } else {
                resolve(
                  savedCallback.current({ metadata: { name: item.data.name } }),
                );
                updateTask(
                  selectedVersionUrl,
                  installedTask,
                  namespace,
                  item.data.name,
                ).catch(() => setFailedTasks([...failedTasks, item.data.name]));
              }
            } else {
              resolve(
                savedCallback.current({ metadata: { name: item.data.name } }),
              );
              createTask(selectedVersionUrl, namespace).catch(() =>
                setFailedTasks([...failedTasks, item.data.name]),
              );
            }
          } else {
            resolve(savedCallback.current(item.data));
          }
        }

        if (
          item.provider === TaskProviders.artifactHub &&
          isArtifactHubTask(item)
        ) {
          const selectedVersionUrl = getSelectedVersionUrl(
            item,
            selectedVersion,
          );
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
              ).catch(() =>
                setFailedTasks([...failedTasks, item.data.task.name]),
              );
            }
          } else {
            resolve(
              savedCallback.current({
                metadata: { name: item.data.task.name },
              }),
            );
            createArtifactHubTask(
              selectedVersionUrl,
              namespace,
              selectedVersion,
              isDevConsoleProxyAvailable,
            ).catch(() =>
              setFailedTasks([...failedTasks, item.data.task.name]),
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

  const quickSearchProviders: QuickSearchProviders = [
    {
      catalogType: 'pipelinesTaskCatalog',
      items: catalogServiceItems,
      loaded: catalogService.loaded,
      getCatalogURL: (searchTerm: string, ns: string) =>
        `/search/ns/${ns}?keyword=${searchTerm}`,
      catalogLinkLabel: t('View all tekton tasks ({{itemCount, number}})'),
      extensions: catalogService.catalogExtensions,
    },
  ];
  return (
    <QuickSearchController
      quickSearchProviders={quickSearchProviders}
      allItemsLoaded={catalogService.loaded}
      searchPlaceholder={`${t('Add task')}...`}
      namespace={namespace}
      viewContainer={viewContainer}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      disableKeyboardOpen
      icon={<PlusCircleIcon width="1.5em" height="1.5em" />}
      callback={savedCallback.current}
      setFailedTasks={setFailedTasks}
      detailsRenderer={(props) => <PipelineQuickSearchDetails {...props} />}
    />
  );
};

const PipelineQuickSearch: React.FC<QuickSearchProps> = ({
  namespace,
  viewContainer,
  isOpen,
  setIsOpen,
  callback,
  onUpdateTasks,
  taskGroup,
}) => {
  return (
    <CatalogServiceProvider
      namespace={namespace}
      catalogId="pipelines-task-catalog"
    >
      {(catalogService: CatalogService) => (
        <Contents
          {...{
            namespace,
            viewContainer,
            isOpen,
            setIsOpen,
            catalogService,
            callback,
            onUpdateTasks,
            taskGroup,
          }}
        />
      )}
    </CatalogServiceProvider>
  );
};

export default React.memo(PipelineQuickSearch);
