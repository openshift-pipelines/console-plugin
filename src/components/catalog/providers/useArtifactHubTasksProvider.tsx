import * as React from 'react';
import * as _ from 'lodash';
import {
  ARTIFACTHUB,
  createArtifactHubTask,
  updateArtifactHubTask,
  useGetArtifactHubTasks,
} from '../apis/artifactHub';
import { TektonHubTask } from '../apis/tektonHub';
import {
  CatalogItem,
  ExtensionHook,
  ResourceIcon,
  useAccessReview,
  useFlag,
} from '@openshift-console/dynamic-plugin-sdk';
import { TaskProviders } from '../../task-quicksearch/pipeline-quicksearch-utils';
import { TaskModel } from '../../../models';
import { getReferenceForModel } from '../../pipelines-overview/utils';
import { useTektonHubIntegration } from '../catalog-utils';
import { t } from '../../utils/common-utils';
import { ArtifactHubTask, FLAGS } from '../../../types';
import useTasksProvider from './useTasksProvider';

export const normalizeArtifactHubTasks = (
  artifactHubTasks: ArtifactHubTask[],
  tektonTasks: CatalogItem[],
): CatalogItem<any>[] => {
  return artifactHubTasks.map((task) => {
    const { package_id, name, description, version } = task;
    const installedTask = tektonTasks?.find(
      (tektonTask) =>
        tektonTask.provider === TaskProviders.artifactHub &&
        tektonTask.name === name,
    );
    return {
      uid: package_id.toString(),
      type: TaskProviders.community,
      name,
      description,
      provider: TaskProviders.artifactHub,
      icon: {
        node: <ResourceIcon kind={getReferenceForModel(TaskModel)} />,
      },
      attributes: {
        installed: installedTask ? version : '',
      },
      cta: {
        label: t('Add'),
        callback: ({
          selectedVersion,
          selectedItem,
          isDevConsoleProxyAvailable,
          namespace,
          callback,
          setFailedTasks,
        }) => {
          return new Promise((resolve) => {
            const selectedVersionUrl =
              selectedItem?.attributes?.selectedVersionContentUrl;
            if (installedTask) {
              if (selectedVersion === selectedItem.attributes.installed) {
                resolve(callback(installedTask.data));
              } else {
                resolve(
                  callback({
                    metadata: { name: selectedItem.data.task.name },
                  }),
                );
                updateArtifactHubTask(
                  selectedVersionUrl,
                  installedTask,
                  namespace,
                  selectedItem.data.task.name,
                  selectedVersion,
                  isDevConsoleProxyAvailable,
                ).catch((error) => {
                  setFailedTasks((prev) => [
                    ...prev,
                    selectedItem.data.task.name,
                  ]);
                });
              }
            } else {
              resolve(
                callback({
                  metadata: { name: selectedItem.data.task.name },
                }),
              );
              createArtifactHubTask(
                selectedVersionUrl,
                namespace,
                selectedVersion,
                isDevConsoleProxyAvailable,
              ).catch((error) => {
                setFailedTasks((prev) => [
                  ...prev,
                  selectedItem.data.task.name,
                ]);
              });
            }
          });
        },
      },
      data: {
        task,
        source: ARTIFACTHUB,
      },
    };
  });
};

const useArtifactHubTasksProvider: ExtensionHook<CatalogItem[]> = ({
  namespace,
}): [CatalogItem[], boolean, string] => {
  const artifactHubIntegration = useTektonHubIntegration();
  const [tektonTasks] = useTasksProvider({});
  const isDevConsoleProxyAvailable = useFlag(FLAGS.DEVCONSOLE_PROXY);
  const canCreateTask = useAccessReview({
    group: TaskModel.apiGroup,
    resource: TaskModel.plural,
    namespace,
    verb: 'create',
  });

  const canUpdateTask = useAccessReview({
    group: TaskModel.apiGroup,
    resource: TaskModel.plural,
    namespace,
    verb: 'update',
  });

  const [artifactHubTasks, tasksLoaded, tasksError] = useGetArtifactHubTasks(
    canCreateTask && canUpdateTask && artifactHubIntegration,
    isDevConsoleProxyAvailable,
  );
  const normalizedArtifactHubTasks = React.useMemo<
    CatalogItem<TektonHubTask>[]
  >(
    () => normalizeArtifactHubTasks(artifactHubTasks, tektonTasks),
    [artifactHubTasks, tektonTasks],
  );
  return [normalizedArtifactHubTasks, tasksLoaded, tasksError];
};

export default useArtifactHubTasksProvider;
