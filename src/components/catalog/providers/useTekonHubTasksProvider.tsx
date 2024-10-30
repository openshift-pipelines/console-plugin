import * as React from 'react';
import { Label } from '@patternfly/react-core';
import {
  TektonHubTask,
  useInclusterTektonHubURLs,
  useTektonHubResources,
} from '../apis/tektonHub';
import {
  filterBySupportedPlatforms,
  useTektonHubIntegration,
} from '../catalog-utils';
import {
  CatalogItem,
  ExtensionHook,
  ResourceIcon,
  useAccessReview,
} from '@openshift-console/dynamic-plugin-sdk';
import { TaskModel } from '../../../models';
import { TaskProviders } from '../../task-quicksearch/pipeline-quicksearch-utils';
import { getReferenceForModel } from '../../pipelines-overview/utils';
import { t } from '../../utils/common-utils';

const normalizeTektonHubTasks = (
  tektonHubTasks: TektonHubTask[],
  apiURL: string,
  uiURL: string,
): CatalogItem<TektonHubTask>[] => {
  const normalizedTektonHubTasks: CatalogItem<TektonHubTask>[] = tektonHubTasks
    .filter(filterBySupportedPlatforms)
    .reduce((acc, task) => {
      if (task.kind !== TaskModel.kind) {
        return acc;
      }
      const { id, name } = task;
      const { description } = task.latestVersion;
      const provider = TaskProviders.tektonHub;
      const tags = task.tags?.map((t) => t.name) ?? [];
      const categories = task.categories?.map((ct) => ct.name) ?? [];
      const [secondaryLabelName] = categories;
      const versions = [];
      const normalizedTektonTask: CatalogItem<TektonHubTask> = {
        uid: id.toString(),
        type: TaskProviders.community,
        name,
        description,
        provider,
        tags,
        secondaryLabel: secondaryLabelName && (
          <Label color="blue">{secondaryLabelName}</Label>
        ),
        icon: {
          node: <ResourceIcon kind={getReferenceForModel(TaskModel)} />,
        },
        attributes: { installed: '', versions, categories, apiURL, uiURL },
        cta: {
          label: t('Add'),
        },
        data: task,
      };
      acc.push(normalizedTektonTask);

      return acc;
    }, []);

  return normalizedTektonHubTasks;
};

const useTektonHubTasksProvider: ExtensionHook<CatalogItem[]> = ({
  namespace,
}): [CatalogItem[], boolean, string] => {
  const [normalizedTektonHubTasks, setNormalizedTektonHubTasks] =
    React.useState<CatalogItem<TektonHubTask>[]>([]);

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

  const integrationEnabled = useTektonHubIntegration();
  const { apiURL, uiURL, loaded: baseURLLoaded } = useInclusterTektonHubURLs();

  const [tektonHubTasks, tasksLoaded, tasksError] = useTektonHubResources(
    apiURL,
    canCreateTask && canUpdateTask && integrationEnabled && baseURLLoaded,
  );

  React.useMemo(
    () =>
      setNormalizedTektonHubTasks(
        normalizeTektonHubTasks(tektonHubTasks, apiURL, uiURL),
      ),
    [apiURL, tektonHubTasks, uiURL],
  );
  return [normalizedTektonHubTasks, tasksLoaded, tasksError];
};

export default useTektonHubTasksProvider;
