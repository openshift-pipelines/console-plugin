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
import { ApiResult } from '../hooks/useApiResponse';
import { getTaskDetails, getTaskYAMLFromGithub, searchTasks } from './utils';

export const ARTIFACTHUB = 'ArtifactHub';

export const getArtifactHubTaskDetails = async (
  item: CatalogItem,
  v?: string,
): Promise<ArtifactHubTaskDetails> => {
  const { name, data } = item;
  const {
    task: {
      version,
      repository: { name: repoName },
    },
  } = data;
  return getTaskDetails({
    repoName,
    name,
    version: v || version,
    allowAuthHeader: true,
    allowInsecure: true,
  });
};

export const useGetArtifactHubTasks = (
  hasPermission: boolean,
): ApiResult<ArtifactHubTask[]> => {
  const [resultData, setResult] = React.useState<ArtifactHubTask[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [loadedError, setLoadedError] = React.useState<string>();

  React.useEffect(() => {
    let mounted = true;
    if (hasPermission) {
      searchTasks({ allowAuthHeader: true, allowInsecure: true })
        .then((packages) => {
          if (mounted) {
            setLoaded(true);
            setResult(packages);
          }
        })
        .catch((err) => {
          if (mounted) {
            setLoaded(true);
            setLoadedError(err?.message);
          }
        });
    } else {
      setLoaded(true);
    }
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
) => {
  const yamlPath = url.startsWith(GITHUB_BASE_URL)
    ? url.slice(GITHUB_BASE_URL.length)
    : null;
  if (!yamlPath) {
    throw new Error('Not a valid GitHub URL');
  }

  return getTaskYAMLFromGithub({
    yamlPath,
    allowAuthHeader: true,
    allowInsecure: true,
  })
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
) => {
  const yamlPath = url.startsWith(GITHUB_BASE_URL)
    ? url.slice(GITHUB_BASE_URL.length)
    : null;
  if (!yamlPath) {
    throw new Error('Not a valid GitHub raw URL');
  }

  return getTaskYAMLFromGithub({
    yamlPath,
    allowAuthHeader: true,
    allowInsecure: true,
  })
    .then((task: K8sResourceKind) => {
      task.metadata.namespace = namespace;
      task.metadata.annotations = {
        ...task.metadata.annotations,
        [TektonTaskAnnotation.semVersion]: version,
      };
      task.metadata = _.merge({}, taskData.data.metadata, task.metadata);
      return k8sUpdate({
        model:
          task.apiVersion === 'tekton.dev/v1' ? TaskModel : TaskModelV1Beta1,
        data: task,
        ns: namespace,
        name,
      });
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.warn('Error while updating ArtifactHub Task:', err);
      throw err;
    });
};
