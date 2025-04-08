import {
  consoleFetchJSON,
  K8sResourceKind,
} from '@openshift-console/dynamic-plugin-sdk';
import { HttpError } from '@openshift-console/dynamic-plugin-sdk/lib/utils/error/http-error';
import { load } from 'js-yaml';
import {
  ARTIFACTHUB_SEARCH_URL,
  ARTIFACTHUB_TASK_DETAILS_URL,
  GITHUB_ARTIFACTHUB_TASK_YAML_URL,
} from '../../../consts';
import {
  ArtifactHubTask,
  ArtifactHubTaskDetails,
  DevConsoleEndpointResponse,
  TaskDetailsRequest,
  TaskSearchRequest,
  TaskYAMLRequest,
} from '../../../types';

/**
 * Fetches the YAML content of a task from GitHub.
 * @param taskYAMLRequest The request object containing the path to the task YAML file.
 * @returns The parsed YAML content of the task.
 */
export const getTaskYAMLFromGithub = async (
  taskYAMLRequest: TaskYAMLRequest,
): Promise<K8sResourceKind> => {
  const taskYAMLResponse: DevConsoleEndpointResponse =
    await consoleFetchJSON.post(
      GITHUB_ARTIFACTHUB_TASK_YAML_URL,
      taskYAMLRequest,
    );

  if (!taskYAMLResponse.statusCode) {
    throw new Error('Unexpected proxy response: Status code is missing!');
  }

  if (taskYAMLResponse.statusCode < 200 || taskYAMLResponse.statusCode >= 300) {
    throw new HttpError(
      `Unexpected status code: ${taskYAMLResponse.statusCode}`,
      taskYAMLResponse.statusCode,
      null,
      taskYAMLResponse,
    );
  }

  try {
    // Parse the YAML response body
    return load(taskYAMLResponse.body);
  } catch (e) {
    throw new Error('Failed to parse task YAML response body as YAML');
  }
};

/**
 * Fetches the details of a task from ArtifactHub.
 * @param taskDetailsRequest The request object containing the task details.
 * @returns The details of the task.
 */
export const getTaskDetails = async (
  taskDetailsRequest: TaskDetailsRequest,
): Promise<ArtifactHubTaskDetails> => {
  const taskDetailsResponse: DevConsoleEndpointResponse =
    await consoleFetchJSON.post(
      ARTIFACTHUB_TASK_DETAILS_URL,
      taskDetailsRequest,
    );
  if (!taskDetailsResponse.statusCode) {
    throw new Error('Unexpected proxy response: Status code is missing!');
  }
  if (
    taskDetailsResponse.statusCode < 200 ||
    taskDetailsResponse.statusCode >= 300
  ) {
    throw new HttpError(
      `Unexpected status code: ${taskDetailsResponse.statusCode}`,
      taskDetailsResponse.statusCode,
      null,
      taskDetailsResponse,
    );
  }

  try {
    return JSON.parse(taskDetailsResponse.body) as ArtifactHubTaskDetails;
  } catch (e) {
    throw new Error('Failed to parse task details response body as JSON');
  }
};

/**
 * Fetches the tasks from ArtifactHub.
 * @param (optional) searchrequest The search request object.
 * @returns The array of tasks matching the search request.
 */
export const searchTasks = async (
  searchrequest?: TaskSearchRequest,
): Promise<ArtifactHubTask[]> => {
  const searchResponse: DevConsoleEndpointResponse =
    await consoleFetchJSON.post(ARTIFACTHUB_SEARCH_URL, searchrequest || {});
  if (!searchResponse.statusCode) {
    throw new Error('Unexpected proxy response: Status code is missing!');
  }
  if (searchResponse.statusCode < 200 || searchResponse.statusCode >= 300) {
    throw new HttpError(
      `Unexpected status code: ${searchResponse.statusCode}`,
      searchResponse.statusCode,
      null,
      searchResponse,
    );
  }

  try {
    return JSON.parse(searchResponse.body).packages as ArtifactHubTask[];
  } catch (e) {
    throw new Error('Failed to parse search response body as JSON');
  }
};
