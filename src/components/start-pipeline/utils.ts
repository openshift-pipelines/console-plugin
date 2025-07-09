import {
  getAPIVersionForModel,
  k8sCreate,
  k8sGet,
  K8sResourceKind,
} from '@openshift-console/dynamic-plugin-sdk';
import * as _ from 'lodash';
import {
  PIPELINE_SERVICE_ACCOUNT,
  preferredNameAnnotation,
  TektonResourceLabel,
  VolumeTypes,
} from '../../consts';
import {
  EventListenerModel,
  RouteModel,
  ServiceModel,
  TriggerTemplateModel,
} from '../../models';
import {
  CommonPipelineModalFormikValues,
  EventListenerKind,
  EventListenerKindBindingReference,
  PipelineKind,
  PipelineModalFormResource,
  PipelineModalFormWorkspace,
  PipelineModalFormWorkspaceStructure,
  PipelineRunEmbeddedResource,
  PipelineRunEmbeddedResourceParam,
  PipelineRunKind,
  PipelineRunParam,
  PipelineRunReferenceResource,
  PipelineRunResource,
  RouteKind,
  TektonWorkspace,
  TriggerBindingKind,
  TriggerTemplateKind,
  TriggerTemplateKindParam,
  VolumeClaimTemplateType,
} from '../../types';
import { errorModal } from '../modals/error-modal';
import { getPipelineRunData } from '../utils/utils';
import { getPipelineRunWorkspaces } from './../utils/pipeline-utils';
import { CREATE_PIPELINE_RESOURCE } from './validation-utils';

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

export const getPipelineName = (
  pipeline?: PipelineKind,
  latestRun?: PipelineRunKind,
) => {
  if (pipeline) {
    return pipeline?.metadata?.name;
  }

  if (latestRun) {
    return (
      latestRun.spec.pipelineRef?.name ??
      (latestRun?.metadata?.annotations?.[preferredNameAnnotation] ||
        latestRun?.metadata?.name)
    );
  }
  return null;
};

export const getPipelineRunGenerateName = (
  pipelineRun: PipelineRunKind,
): string => {
  if (pipelineRun?.metadata?.generateName) {
    return pipelineRun.metadata.generateName;
  }

  return `${pipelineRun?.metadata?.name?.replace(/-[a-z0-9]{5,6}$/, '')}-`;
};

export const getDefaultVolumeClaimTemplate = (
  pipelineName: string,
): VolumeClaimTemplateType => {
  return {
    volumeClaimTemplate: {
      metadata: {
        labels: { [TektonResourceLabel.pipeline]: pipelineName },
      },
      spec: {
        accessModes: ['ReadWriteOnce'],
        resources: {
          requests: {
            storage: '1Gi',
          },
        },
      },
    },
  };
};

export const getServerlessFunctionDefaultPersistentVolumeClaim = (
  pipelineName: string,
): VolumeClaimTemplateType => {
  return {
    volumeClaimTemplate: {
      metadata: {
        finalizers: ['kubernetes.io/pvc-protection'],
        labels: {
          [TektonResourceLabel.pipeline]: pipelineName,
          'boson.dev/function': 'true',
          'function.knative.dev': 'true',
          'function.knative.dev/name': pipelineName,
        },
      },
      spec: {
        accessModes: ['ReadWriteOnce'],
        resources: {
          requests: {
            storage: '1Gi',
          },
        },
        storageClassName: 'gp3-csi',
        volumeMode: 'Filesystem',
      },
    },
  };
};

const supportWorkspaceDefaults =
  (preselectPVC: string) =>
  (workspace: TektonWorkspace): PipelineModalFormWorkspace => {
    let workspaceSetting: PipelineModalFormWorkspaceStructure = {
      type: VolumeTypes.EmptyDirectory,
      data: { emptyDir: {} },
    };

    if (preselectPVC) {
      workspaceSetting = {
        type: VolumeTypes.PVC,
        data: {
          persistentVolumeClaim: {
            claimName: preselectPVC,
          },
        },
      };
    }
    if (workspace.optional) {
      workspaceSetting = {
        type: VolumeTypes.NoWorkspace,
        data: {},
      };
    }

    return {
      ...workspace,
      ...workspaceSetting,
    };
  };

export const convertPipelineToModalData = (
  pipeline: PipelineKind,
  preselectPVC = '',
): CommonPipelineModalFormikValues => {
  const {
    metadata: { namespace },
    spec: { params },
  } = pipeline;

  return {
    namespace,
    parameters: (params || []).map((param) => ({
      ...param,
      value: param.default, // setup the default if it exists
    })),
    workspaces: (pipeline.spec.workspaces || []).map(
      supportWorkspaceDefaults(preselectPVC),
    ),
  };
};

export const convertMapToNameValueArray = (map: {
  [key: string]: any;
}): PipelineRunEmbeddedResourceParam[] => {
  return Object.keys(map).map((name) => {
    const value = map[name];
    return { name, value };
  });
};

export const convertResources = (
  resource: PipelineModalFormResource,
): PipelineRunResource => {
  if (resource.selection === CREATE_PIPELINE_RESOURCE) {
    return {
      name: resource.name,
      resourceSpec: {
        params: convertMapToNameValueArray(resource.data.params),
        type: resource.data.type,
      },
    } as PipelineRunEmbeddedResource;
  }

  return {
    name: resource.name,
    resourceRef: {
      name: resource.selection,
    },
  } as PipelineRunReferenceResource;
};

export const getPipelineRunFromForm = (
  pipeline: PipelineKind,
  formValues: CommonPipelineModalFormikValues,
  currentUser: string,
  labels?: { [key: string]: string },
  annotations?: { [key: string]: string },
  options?: { generateName: boolean },
) => {
  const { parameters, workspaces, timeouts } = formValues;
  const pipelineRunData: PipelineRunKind = {
    metadata: {
      annotations,
      labels,
    },
    spec: {
      pipelineRef: {
        name: pipeline?.metadata?.name,
      },
      params: parameters.map(
        ({ name, value }): PipelineRunParam => ({ name, value }),
      ),
      workspaces: getPipelineRunWorkspaces(workspaces),
      ...(timeouts && {
        timeouts: {
          pipeline: `${timeouts.timeValue}${timeouts.timeUnit}`,
        },
      }),
    },
  };
  return getPipelineRunData(pipeline, currentUser, pipelineRunData, options);
};

export const createTriggerTemplate = (
  pipeline: PipelineKind,
  pipelineRun: PipelineRunKind,
  params: TriggerTemplateKindParam[],
): TriggerTemplateKind => {
  return {
    apiVersion: getAPIVersionForModel(TriggerTemplateModel),
    kind: TriggerTemplateModel.kind,
    metadata: {
      name: `trigger-template-${pipeline.metadata.name}-${getRandomChars()}`,
    },
    spec: {
      params,
      resourcetemplates: [pipelineRun],
    },
  };
};

export const createEventListener = (
  triggerBindings: TriggerBindingKind[],
  triggerTemplate: TriggerTemplateKind,
): EventListenerKind => {
  const mapTriggerBindings: (
    triggerBinding: TriggerBindingKind,
  ) => EventListenerKindBindingReference = (
    triggerBinding: TriggerBindingKind,
  ) => {
    return {
      kind: triggerBinding.kind,
      ref: triggerBinding.metadata.name,
    };
  };
  const getTriggerTemplate = (name: string) => {
    return { ref: name };
  };

  return {
    apiVersion: getAPIVersionForModel(EventListenerModel),
    kind: EventListenerModel.kind,
    metadata: {
      name: `event-listener-${getRandomChars()}`,
    },
    spec: {
      serviceAccountName: PIPELINE_SERVICE_ACCOUNT,
      triggers: [
        {
          bindings: triggerBindings.map(mapTriggerBindings),
          template: getTriggerTemplate(triggerTemplate.metadata.name),
        },
      ],
    },
  };
};

export const createEventListenerRoute = (
  eventListener: EventListenerKind,
  generatedName?: string,
  targetPort = 8080,
): RouteKind => {
  const eventListenerName = eventListener.metadata.name;
  // Not ideal, but if all else fails, we can do our best guess
  const referenceName = generatedName || `el-${eventListenerName}`;

  return {
    apiVersion: getAPIVersionForModel(RouteModel),
    kind: RouteModel.kind,
    metadata: {
      name: referenceName,
      labels: {
        'app.kubernetes.io/managed-by': EventListenerModel.kind,
        'app.kubernetes.io/part-of': 'Triggers',
        eventlistener: eventListenerName,
      },
    },
    spec: {
      port: {
        targetPort,
      },
      to: {
        kind: 'Service',
        name: referenceName,
        weight: 100,
      },
    },
  };
};

export const exposeRoute = async (
  elName: string,
  ns: string,
  iteration = 0,
) => {
  const elResource: EventListenerKind = await k8sGet({
    model: EventListenerModel,
    name: elName,
    ns,
  });
  const serviceGeneratedName = elResource?.status?.configuration.generatedName;

  try {
    if (!serviceGeneratedName) {
      if (iteration < 3) {
        setTimeout(() => exposeRoute(elName, ns, iteration + 1), 500);
      } else {
        // Unable to deterministically create the route; create a default one
        await k8sCreate({
          model: RouteModel,
          data: createEventListenerRoute(elResource),
          ns,
        });
      }
      return;
    }

    // Get the service, find out what port we are exposed on
    const serviceResource: K8sResourceKind = await k8sGet({
      model: ServiceModel,
      name: serviceGeneratedName,
      ns,
    });
    const servicePort = serviceResource.spec?.ports?.[0]?.name;

    // Build the exposed route on the correct port
    const route: RouteKind = createEventListenerRoute(
      elResource,
      serviceGeneratedName,
      servicePort,
    );
    await k8sCreate({ model: RouteModel, data: route, ns });
  } catch (e) {
    errorModal({
      title: 'Error Exposing Route',
      error: e.message || 'Unknown error exposing the Webhook route',
    });
  }
};
