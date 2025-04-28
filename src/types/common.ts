import {
  K8sResourceCommon,
  ObjectMetadata,
} from '@openshift-console/dynamic-plugin-sdk';
import { FormikValues } from 'formik';
import { VolumeTypes } from '../consts';
import { TektonParam, TektonWorkspace } from './coreTekton';
import {
  VolumeTypeClaim,
  VolumeTypeConfigMaps,
  VolumeTypePVC,
  VolumeTypeSecret,
} from './pipelineRun';

export type SecretKind = {
  data?: { [key: string]: string };
  stringData?: { [key: string]: string };
  type?: string;
} & K8sResourceCommon;

type ContainerStateValue = {
  reason?: string;
  [key: string]: unknown;
};

export type ContainerState = {
  waiting?: ContainerStateValue;
  running?: ContainerStateValue;
  terminated?: ContainerStateValue;
};

export type ContainerStatus = {
  name: string;
  state?: ContainerState;
  lastState?: ContainerState;
  ready: boolean;
  restartCount: number;
  image: string;
  imageID: string;
  containerID?: string;
};

export type TolerationOperator = 'Exists' | 'Equal';

export type TaintEffect = '' | 'NoSchedule' | 'PreferNoSchedule' | 'NoExecute';

export type Toleration = {
  effect: TaintEffect;
  key?: string;
  operator: TolerationOperator;
  tolerationSeconds?: number;
  value?: string;
};

export type PipelineModalFormResource = {
  name: string;
  selection: string;
  data: {
    type: string;
    params: { [key: string]: string };
    secrets?: { [key: string]: string };
  };
};

export type PipelineModalFormWorkspaceStructure =
  | {
      type: VolumeTypes.NoWorkspace;
      data: object;
    }
  | {
      type: VolumeTypes.EmptyDirectory;
      data: {
        emptyDir: object;
      };
    }
  | {
      type: VolumeTypes.Secret;
      data: {
        secret: VolumeTypeSecret;
      };
    }
  | {
      type: VolumeTypes.ConfigMap;
      data: {
        configMap: VolumeTypeConfigMaps;
      };
    }
  | {
      type: VolumeTypes.PVC;
      data: {
        persistentVolumeClaim: VolumeTypePVC;
      };
    }
  | {
      type: VolumeTypes.VolumeClaimTemplate;
      data: {
        volumeClaimTemplate: VolumeTypeClaim;
      };
    };

export type PipelineModalFormWorkspace = TektonWorkspace &
  PipelineModalFormWorkspaceStructure;

export type ModalParameter = TektonParam & {
  value?: string | string[];
};

export enum ComputedStatus {
  Cancelling = 'Cancelling',
  Succeeded = 'Succeeded',
  Failed = 'Failed',
  Running = 'Running',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'In Progress' = 'In Progress',
  FailedToStart = 'FailedToStart',
  PipelineNotStarted = 'PipelineNotStarted',
  Skipped = 'Skipped',
  Cancelled = 'Cancelled',
  Pending = 'Pending',
  Idle = 'Idle',
  Other = '-',
}

export type RouteTarget = {
  kind: 'Service';
  name: string;
  weight: number;
};

export type RouteTLS = {
  caCertificate?: string;
  certificate?: string;
  destinationCACertificate?: string;
  insecureEdgeTerminationPolicy?: string;
  key?: string;
  termination: string;
};

export enum K8sResourceConditionStatus {
  True = 'True',
  False = 'False',
  Unknown = 'Unknown',
}

export type K8sResourceCondition = {
  type: string;
  status: keyof typeof K8sResourceConditionStatus;
  lastTransitionTime?: string;
  reason?: string;
  message?: string;
};

export type RouteIngress = {
  conditions: K8sResourceCondition[];
  host?: string;
  routerCanonicalHostname?: string;
  routerName?: string;
  wildcardPolicy?: string;
};

export type RouteKind = {
  spec: {
    alternateBackends?: RouteTarget[];
    host?: string;
    path?: string;
    port?: {
      targetPort: number | string;
    };
    subdomain?: string;
    tls?: RouteTLS;
    to: RouteTarget;
    wildcardPolicy?: string;
  };
  status?: {
    ingress: RouteIngress[];
    url?: string;
    conditions?: K8sResourceCondition[];
  };
} & K8sResourceCommon;

export type ResourceModelLink = {
  resourceKind: string;
  name: string;
  qualifier?: string;
};

export type ResourceList = {
  [resourceName: string]: string;
};

export type EnvVarSource = {
  fieldRef?: {
    apiVersion?: string;
    fieldPath: string;
  };
  resourceFieldRef?: {
    resource: string;
    containerName?: string;
    divisor?: string;
  };
  configMapKeyRef?: {
    key: string;
    name: string;
  };
  secretKeyRef?: {
    key: string;
    name: string;
  };
  configMapRef?: {
    key?: string;
    name: string;
  };
  secretRef?: {
    key?: string;
    name: string;
  };
  configMapSecretRef?: {
    key?: string;
    name: string;
  };
  serviceAccountRef?: {
    key?: string;
    name: string;
  };
};

export type EnvVar = {
  name: string;
  value?: string;
  valueFrom?: EnvVarSource;
};

export type Volume = {
  name: string;
  [key: string]: unknown;
};

export type ExecProbe = {
  command: string[];
};

type ProbePort = string | number;

export type HTTPGetProbe = {
  path?: string;
  port: ProbePort;
  host?: string;
  scheme: 'HTTP' | 'HTTPS';
  httpHeaders?: unknown[];
};

export type TCPSocketProbe = {
  port: ProbePort;
  host?: string;
};

export type Handler = {
  exec?: ExecProbe;
  httpGet?: HTTPGetProbe;
  tcpSocket?: TCPSocketProbe;
};

export type ContainerProbe = {
  initialDelaySeconds?: number;
  timeoutSeconds?: number;
  periodSeconds?: number;
  successThreshold?: number;
  failureThreshold?: number;
} & Handler;

export type VolumeMount = {
  mountPath: string;
  mountPropagation?: 'None' | 'HostToContainer' | 'Bidirectional';
  name: string;
  readOnly?: boolean;
  subPath?: string;
  subPathExpr?: string;
};

export type VolumeDevice = {
  devicePath: string;
  name: string;
};

export type ContainerLifecycle = {
  postStart?: Handler;
  preStop?: Handler;
};

export type ContainerPort = {
  name?: string;
  containerPort: number;
  protocol: string;
};

export enum ImagePullPolicy {
  Always = 'Always',
  Never = 'Never',
  IfNotPresent = 'IfNotPresent',
}

export type ContainerSpec = {
  name: string;
  volumeMounts?: VolumeMount[];
  volumeDevices?: VolumeDevice[];
  env?: EnvVar[];
  livenessProbe?: ContainerProbe;
  readinessProbe?: ContainerProbe;
  lifecycle?: ContainerLifecycle;
  resources?: {
    limits?: ResourceList;
    requested?: ResourceList;
  };
  ports?: ContainerPort[];
  imagePullPolicy?: ImagePullPolicy;
  [key: string]: unknown;
};

// https://github.com/kubernetes/api/blob/release-1.16/core/v1/types.go#L2411-L2432
type PodPhase = 'Pending' | 'Running' | 'Succeeded' | 'Failed' | 'Unknown';

export type PodCondition = {
  lastProbeTime?: string;
} & K8sResourceCondition;

export type PodStatus = {
  phase: PodPhase;
  conditions?: PodCondition[];
  message?: string;
  reason?: string;
  startTime?: string;
  initContainerStatuses?: ContainerStatus[];
  containerStatuses?: ContainerStatus[];
  [key: string]: unknown;
};

export type PodSpec = {
  volumes?: Volume[];
  initContainers?: ContainerSpec[];
  containers: ContainerSpec[];
  restartPolicy?: 'Always' | 'OnFailure' | 'Never';
  terminationGracePeriodSeconds?: number;
  activeDeadlineSeconds?: number;
  nodeSelector?: unknown;
  serviceAccountName?: string;
  priorityClassName?: string;
  tolerations?: Toleration[];
  nodeName?: string;
  hostname?: string;
  [key: string]: unknown;
};

export type PodTemplate = {
  metadata: ObjectMetadata;
  spec: PodSpec;
};

export type PodKind = {
  status?: PodStatus;
} & K8sResourceCommon &
  PodTemplate;

export enum FLAGS {
  AUTH_ENABLED = 'AUTH_ENABLED',
  PROMETHEUS = 'PROMETHEUS',
  OPENSHIFT = 'OPENSHIFT',
  MONITORING = 'MONITORING',
  CAN_GET_NS = 'CAN_GET_NS',
  CAN_LIST_NS = 'CAN_LIST_NS',
  CAN_LIST_NODE = 'CAN_LIST_NODE',
  CAN_LIST_PV = 'CAN_LIST_PV',
  CAN_LIST_CRD = 'CAN_LIST_CRD',
  CAN_LIST_USERS = 'CAN_LIST_USERS',
  CAN_LIST_GROUPS = 'CAN_LIST_GROUPS',
  CAN_LIST_OPERATOR_GROUP = 'CAN_LIST_OPERATOR_GROUP',
  CAN_LIST_PACKAGE_MANIFEST = 'CAN_LIST_PACKAGE_MANIFEST',
  CAN_CREATE_PROJECT = 'CAN_CREATE_PROJECT',
  CAN_LIST_VSC = 'CAN_LIST_VSC',
  CLUSTER_AUTOSCALER = 'CLUSTER_AUTOSCALER',
  SHOW_OPENSHIFT_START_GUIDE = 'SHOW_OPENSHIFT_START_GUIDE',
  CLUSTER_API = 'CLUSTER_API',
  CLUSTER_VERSION = 'CLUSTER_VERSION',
  MACHINE_CONFIG = 'MACHINE_CONFIG',
  MACHINE_AUTOSCALER = 'MACHINE_AUTOSCALER',
  MACHINE_HEALTH_CHECK = 'MACHINE_HEALTH_CHECK',
  CONSOLE_LINK = 'CONSOLE_LINK',
  CONSOLE_CLI_DOWNLOAD = 'CONSOLE_CLI_DOWNLOAD',
  CONSOLE_NOTIFICATION = 'CONSOLE_NOTIFICATION',
  CONSOLE_EXTERNAL_LOG_LINK = 'CONSOLE_EXTERNAL_LOG_LINK',
  CONSOLE_YAML_SAMPLE = 'CONSOLE_YAML_SAMPLE',
  DEVCONSOLE_PROXY = 'DEVCONSOLE_PROXY',
}

export type CommonPipelineModalFormikValues = FormikValues & {
  namespace: string;
  parameters: ModalParameter[];
  workspaces: PipelineModalFormWorkspace[];
};

export enum ImportStrategy {
  S2I,
  DOCKERFILE,
  DEVFILE,
  SERVERLESS_FUNCTION,
}
