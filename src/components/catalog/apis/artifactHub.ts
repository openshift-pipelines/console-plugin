import {
  CatalogItem,
  k8sCreate,
  K8sResourceKind,
  k8sUpdate,
} from '@openshift-console/dynamic-plugin-sdk';
import * as _ from 'lodash';
import * as React from 'react';
import { GITHUB_BASE_URL } from '../../../consts';
import { TaskModel, TaskModelV1Beta1 } from '../../../models';
import { ArtifactHubTask, ArtifactHubTaskDetails } from '../../../types';
import { TektonTaskAnnotation } from '../../task-quicksearch/pipeline-quicksearch-utils';
import { consoleProxyFetchJSON } from '../../utils/proxy';
import { ApiResult } from '../hooks/useApiResponse';
import { getTaskDetails, getTaskYAMLFromGithub, searchTasks } from './utils';

export const ARTIFACTHUB = 'ArtifactHub';
export const ARTIFACTHUB_API_BASE_URL = 'https://artifacthub.io/api/v1';

const ARTIFACRHUB_TASKS_SEARCH_URL = `${ARTIFACTHUB_API_BASE_URL}/packages/search?offset=0&limit=60&facets=false&kind=7&deprecated=false&sort=relevance`;

export const getArtifactHubTaskDetails = async (
  item: CatalogItem,
  v?: string,
  isDevConsoleProxyAvailable?: boolean,
): Promise<ArtifactHubTaskDetails> => {
  const { name, data } = item;
  const {
    task: {
      version,
      repository: { name: repoName },
    },
  } = data;
  if (isDevConsoleProxyAvailable) {
    return getTaskDetails({
      repoName,
      name,
      version: v || version,
    });
  } else {
    const API_BASE_URL = `${ARTIFACTHUB_API_BASE_URL}/packages/tekton-task`;
    const url = `${API_BASE_URL}/${repoName}/${name}/${v || version}`;
    return consoleProxyFetchJSON({ url, method: 'GET' });
  }
};

export const useGetArtifactHubTasks = (
  hasPermission: boolean,
  isDevConsoleProxyAvailable?: boolean,
): ApiResult<ArtifactHubTask[]> => {
  const [resultData, setResult] = React.useState<ArtifactHubTask[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [loadedError, setLoadedError] = React.useState<string>();

  React.useEffect(() => {
    let mounted = true;

    const fetchTasks = async () => {
      try {
        if (!hasPermission) {
          setLoaded(true);
          return;
        }

        let packages: ArtifactHubTask[] = [];

        if (isDevConsoleProxyAvailable) {
          packages = await searchTasks();
        } else {
          const response = await consoleProxyFetchJSON<{
            packages: ArtifactHubTask[];
          }>({
            url: ARTIFACRHUB_TASKS_SEARCH_URL,
            method: 'GET',
          });
          packages = response.packages;
        }

        if (mounted) {
          setLoaded(true);
          setResult(packages);
        }
      } catch (err) {
        if (mounted) {
          setLoaded(true);
          setLoadedError(err?.message);
        }
      }
    };

    fetchTasks();

    return () => {
      mounted = false;
    };
  }, [hasPermission]);
  return [resultData, loaded, loadedError];
};

export const createArtifactHubTask = (
  url: string,
  namespace: string,
  version: string,
  isDevConsoleProxyAvailable?: boolean,
) => {
  const fetchTask = async (): Promise<K8sResourceKind> => {
    if (isDevConsoleProxyAvailable) {
      const yamlPath = url.startsWith(GITHUB_BASE_URL)
        ? url.slice(GITHUB_BASE_URL.length)
        : null;

      if (!yamlPath) {
        throw new Error('Not a valid GitHub URL');
      }

      return getTaskYAMLFromGithub({ yamlPath });
    } else {
      return consoleProxyFetchJSON({ url, method: 'GET' });
    }
  };

  return fetchTask()
    .then((task: K8sResourceKind) => {
      task.metadata.namespace = namespace;
      task.metadata.annotations = {
        ...task.metadata.annotations,
        [TektonTaskAnnotation.installedFrom]: ARTIFACTHUB,
        [TektonTaskAnnotation.semVersion]: version,
      };
      return k8sCreate({
        model:
          task.apiVersion === 'tekton.dev/v1' ? TaskModel : TaskModelV1Beta1,
        data: task,
      });
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.warn('Error while importing ArtifactHub Task:', err);
      throw err;
    });
};

export const updateArtifactHubTask = async (
  url: string,
  taskData: CatalogItem,
  namespace: string,
  name: string,
  version: string,
  isDevConsoleProxyAvailable?: boolean,
) => {
  const fetchTask = async (): Promise<K8sResourceKind> => {
    if (isDevConsoleProxyAvailable) {
      const yamlPath = url.startsWith(GITHUB_BASE_URL)
        ? url.slice(GITHUB_BASE_URL.length)
        : null;
      if (!yamlPath) {
        throw new Error('Not a valid GitHub raw URL');
      }
      return getTaskYAMLFromGithub({ yamlPath });
    } else {
      return consoleProxyFetchJSON({ url, method: 'GET' });
    }
  };

  try {
    const task = await fetchTask();
    task.metadata.namespace = namespace;
    task.metadata.annotations = {
      ...task.metadata.annotations,
      [TektonTaskAnnotation.semVersion]: version,
    };
    task.metadata = _.merge({}, taskData.data.metadata, task.metadata);
    return k8sUpdate({
      model: task.apiVersion === 'tekton.dev/v1' ? TaskModel : TaskModelV1Beta1,
      data: task,
      ns: namespace,
      name,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Error while updating ArtifactHub Task:', err);
    throw err;
  }
};
