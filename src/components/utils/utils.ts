import { K8sModel } from '@openshift-console/dynamic-plugin-sdk';
import _ from 'lodash';
import {
  DELETED_RESOURCE_IN_K8S_ANNOTATION,
  preferredNameAnnotation,
  RESOURCE_LOADED_FROM_RESULTS_ANNOTATION,
} from '../../consts';
import { PipelineRunModel } from '../../models';
import {
  PipelineKind,
  PipelineRunKind,
  RouteIngress,
  RouteKind,
} from '../../types';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { getPipelineRunParams } from './pipeline-utils';

export const resourcePathFromModel = (
  model: K8sModel,
  name?: string,
  namespace?: string,
) => {
  const { plural, namespaced, crd } = model;

  let url = '/k8s/';

  if (!namespaced) {
    url += 'cluster/';
  }

  if (namespaced) {
    url += namespace ? `ns/${namespace}/` : 'all-namespaces/';
  }
  if (crd) {
    url += getReferenceForModel(model);
  } else if (plural) {
    url += plural;
  }

  if (name) {
    // Some resources have a name that needs to be encoded. For instance,
    // Users can have special characters in the name like `#`.
    url += `/${encodeURIComponent(name)}`;
  }

  return url;
};

const getRouteHost = (route: RouteKind, onlyAdmitted: boolean): string => {
  let oldestAdmittedIngress: RouteIngress;
  let oldestTransitionTime: string;
  _.each(route.status.ingress, (ingress) => {
    const admittedCondition = _.find(ingress.conditions, {
      type: 'Admitted',
      status: 'True',
    });
    if (
      admittedCondition &&
      (!oldestTransitionTime ||
        oldestTransitionTime > admittedCondition.lastTransitionTime)
    ) {
      oldestAdmittedIngress = ingress;
      oldestTransitionTime = admittedCondition.lastTransitionTime;
    }
  });

  if (oldestAdmittedIngress) {
    return oldestAdmittedIngress.host;
  }

  return onlyAdmitted ? null : route.spec.host;
};

export const getRouteWebURL = (route: RouteKind): string => {
  const scheme = _.get(route, 'spec.tls.termination') ? 'https' : 'http';
  let url = `${scheme}://${getRouteHost(route, false)}`;
  if (route.spec.path) {
    url += route.spec.path;
  }
  return url;
};

export const getPipelineName = (
  pipeline?: PipelineKind,
  latestRun?: PipelineRunKind,
): string => {
  if (pipeline) {
    return pipeline.metadata.name;
  }

  if (latestRun) {
    return (
      latestRun.spec.pipelineRef?.name ??
      (latestRun.metadata.annotations?.[preferredNameAnnotation] ||
        latestRun.metadata.name)
    );
  }
  return null;
};

export const getPipelineRunGenerateName = (
  pipelineRun: PipelineRunKind,
): string => {
  if (pipelineRun.metadata.generateName) {
    return pipelineRun.metadata.generateName;
  }

  return `${pipelineRun.metadata.name?.replace(/-[a-z0-9]{5,6}$/, '')}-`;
};

export const getRandomChars = (len = 6): string => {
  return Math.random()
    .toString(36)
    .replace(/[^a-z0-9]+/g, '')
    .substr(1, len);
};

/**
 * Migrates a PipelineRun from one version to another to support auto-upgrades with old (and invalid) PipelineRuns.
 *
 * Note: Each check within this method should be driven by the apiVersion number if the API is properly up-versioned
 * for these breaking changes. (should be done moving from 0.10.x forward)
 */
export const migratePipelineRun = (
  pipelineRun: PipelineRunKind,
): PipelineRunKind => {
  let newPipelineRun = pipelineRun;

  const serviceAccountPath = 'spec.serviceAccount';
  if (_.has(newPipelineRun, serviceAccountPath)) {
    // .spec.serviceAccount was removed for .spec.serviceAccountName in 0.9.x
    // Note: apiVersion was not updated for this change and thus we cannot gate this change behind a version number
    const serviceAccountName = _.get(newPipelineRun, serviceAccountPath);
    newPipelineRun = _.omit(newPipelineRun, [
      serviceAccountPath,
    ]) as PipelineRunKind;
    newPipelineRun = _.merge(newPipelineRun, {
      spec: {
        serviceAccountName,
      },
    });
  }

  return newPipelineRun;
};

export const getPipelineRunData = (
  pipeline: PipelineKind = null,
  latestRun?: PipelineRunKind,
  options?: { generateName: boolean },
): PipelineRunKind => {
  if (!pipeline && !latestRun) {
    // eslint-disable-next-line no-console
    console.error('Missing parameters, unable to create new PipelineRun');
    return null;
  }

  const pipelineName = getPipelineName(pipeline, latestRun);

  const workspaces = latestRun?.spec.workspaces;

  const latestRunParams = latestRun?.spec.params;
  const pipelineParams = pipeline?.spec.params;
  const params = latestRunParams || getPipelineRunParams(pipelineParams);
  // TODO: We should craft a better method to allow us to provide configurable annotations and labels instead of
  // blinding merging existing content from potential real Pipeline and PipelineRun resources
  const annotations = _.merge(
    {},
    pipeline?.metadata?.annotations,
    latestRun?.metadata?.annotations,
    // {
    //   [StartedByAnnotation.user]: getActiveUserName(),
    // },
    !latestRun?.spec.pipelineRef &&
      !latestRun?.metadata.annotations?.[preferredNameAnnotation] && {
        [preferredNameAnnotation]: pipelineName,
      },
  );
  delete annotations['kubectl.kubernetes.io/last-applied-configuration'];
  delete annotations['tekton.dev/v1beta1TaskRuns'];
  delete annotations['results.tekton.dev/log'];
  delete annotations['results.tekton.dev/record'];
  delete annotations['results.tekton.dev/result'];
  delete annotations[DELETED_RESOURCE_IN_K8S_ANNOTATION];
  delete annotations[RESOURCE_LOADED_FROM_RESULTS_ANNOTATION];

  const newPipelineRun = {
    apiVersion: pipeline ? pipeline.apiVersion : latestRun.apiVersion,
    kind: PipelineRunModel.kind,
    metadata: {
      ...(options?.generateName
        ? {
            generateName: `${pipelineName}-`,
          }
        : {
            name:
              latestRun?.metadata?.name !== undefined
                ? `${getPipelineRunGenerateName(latestRun)}${getRandomChars()}`
                : `${pipelineName}-${getRandomChars()}`,
          }),
      annotations,
      namespace: pipeline
        ? pipeline.metadata.namespace
        : latestRun.metadata.namespace,
      labels: _.merge(
        {},
        pipeline?.metadata?.labels,
        latestRun?.metadata?.labels,
        (latestRun?.spec.pipelineRef || pipeline) && {
          'tekton.dev/pipeline': pipelineName,
        },
      ),
    },
    spec: {
      ...(latestRun?.spec || {}),
      ...((latestRun?.spec.pipelineRef || pipeline) && {
        pipelineRef: {
          name: pipelineName,
        },
      }),
      ...(params && { params }),
      workspaces,
      status: null,
    },
  };
  return migratePipelineRun(newPipelineRun);
};
