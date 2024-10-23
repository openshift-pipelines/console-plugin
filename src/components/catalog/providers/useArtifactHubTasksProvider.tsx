import * as React from 'react';
import {
  ARTIFACTHUB,
  ArtifactHubTask,
  useGetArtifactHubTasks,
} from '../apis/artifactHub';
import { TektonHubTask } from '../apis/tektonHub';
import {
  CatalogItem,
  ExtensionHook,
  ResourceIcon,
  useAccessReview,
} from '@openshift-console/dynamic-plugin-sdk';
import { TaskProviders } from '../../task-quicksearch/pipeline-quicksearch-utils';
import { TaskModel } from '../../../models';
import { getReferenceForModel } from '../../pipelines-overview/utils';
import { useTektonHubIntegration } from '../catalog-utils';
import { t } from '../../utils/common-utils';

const normalizeArtifactHubTasks = (
  artifactHubTasks: ArtifactHubTask[],
): CatalogItem<any>[] => {
  const normalizedArtifactHubTasks: CatalogItem<ArtifactHubTask>[] =
    artifactHubTasks.reduce((acc, task) => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { package_id, name, description } = task;
      const provider = TaskProviders.artifactHub;
      const normalizedArtifactHubTask: CatalogItem<any> = {
        uid: package_id.toString(),
        type: TaskProviders.community,
        name,
        description,
        provider,
        icon: {
          node: <ResourceIcon kind={getReferenceForModel(TaskModel)} />,
        },
        attributes: { installed: '' },
        cta: {
          label: t('pipelines-plugin~Add'),
        },
        data: {
          task,
          source: ARTIFACTHUB,
        },
      };
      acc.push(normalizedArtifactHubTask);

      return acc;
    }, []);

  return normalizedArtifactHubTasks;
};

const useArtifactHubTasksProvider: ExtensionHook<CatalogItem[]> = ({
  namespace,
}): [CatalogItem[], boolean, string] => {
  const artifactHubIntegration = useTektonHubIntegration();
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
  );
  const normalizedArtifactHubTasks = React.useMemo<
    CatalogItem<TektonHubTask>[]
  >(() => normalizeArtifactHubTasks(artifactHubTasks), [artifactHubTasks]);
  return [normalizedArtifactHubTasks, tasksLoaded, tasksError];
};

export default useArtifactHubTasksProvider;
