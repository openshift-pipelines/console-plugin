export const FLAG_HIDE_STATIC_PIPELINE_PLUGIN_PIPELINE_DETAIL_METRICS_TAB =
  'HIDE_STATIC_PIPELINE_PLUGIN_PIPELINE_DETAIL_METRICS_TAB';
export const FLAG_HIDE_STATIC_PIPELINE_PLUGIN_PIPELINERUN_DETAIL_TASKRUNS_TAB =
  'HIDE_STATIC_PIPELINE_PLUGIN_PIPELINERUN_DETAIL_TASKRUNS_TAB';
export const FLAG_PIPELINE_TEKTON_RESULT_INSTALLED =
  'PIPELINE_TEKTON_RESULT_INSTALLED';
export const ALL_NAMESPACES_KEY = '#ALL_NS#';
export const DEFAULT_NAMESPACE = 'default';
export const FLAG_HIDE_STATIC_PIPELINE_PLUGIN_PIPELINES_NAV_OPTION =
  'HIDE_STATIC_PIPELINE_PLUGIN_PIPELINE_NAV_OPTION';
export const FLAG_HIDE_STATIC_PIPELINE_PLUGIN_TASKS_NAV_OPTION =
  'HIDE_STATIC_PIPELINE_PLUGIN_TASKS_NAV_OPTION';
export const FLAG_HIDE_STATIC_PIPELINE_PLUGIN_TRIGGERS_NAV_OPTION =
  'HIDE_STATIC_PIPELINE_PLUGIN_TRIGGERS_NAV_OPTION';
export const FLAG_HIDE_STATIC_PIPELINE_PLUGIN_PIPELINES_LIST =
  'HIDE_STATIC_PIPELINE_PLUGIN_PIPELINES_LIST';
export const FLAG_HIDE_STATIC_PIPELINE_PLUGIN_PIPELINERUNS_LIST =
  'HIDE_STATIC_PIPELINE_PLUGIN_PIPELINERUNS_LIST';
export const FLAG_HIDE_STATIC_PIPELINE_PLUGIN_REPOSITORIES_LIST =
  'HIDE_STATIC_PIPELINE_PLUGIN_REPOSITORIES_LIST';
export const FLAG_HIDE_STATIC_PIPELINE_PLUGIN_APPROVALS_LIST =
  'HIDE_STATIC_PIPELINE_PLUGIN_APPROVALS_LIST';
export const FLAG_HIDE_STATIC_PIPELINE_PLUGIN_TASKS_LIST =
  'HIDE_STATIC_PIPELINE_PLUGIN_TASKS_LIST';
export const FLAG_HIDE_STATIC_PIPELINE_PLUGIN_TASKRUNS_LIST =
  'HIDE_STATIC_PIPELINE_PLUGIN_TASKRUNS_LIST';
export const FLAG_HIDE_STATIC_PIPELINE_PLUGIN_CLUSTERTASKS_LIST =
  'HIDE_STATIC_PIPELINE_PLUGIN_CLUSTERTASKS_LIST';
export const FLAG_HIDE_STATIC_PIPELINE_PLUGIN_EVENTLISTENERS_LIST =
  'HIDE_STATIC_PIPELINE_PLUGIN_EVENTLISTENERS_LIST';
export const FLAG_HIDE_STATIC_PIPELINE_PLUGIN_TRIGGERTEMPLATES_LIST =
  'HIDE_STATIC_PIPELINE_PLUGIN_TRIGGERTEMPLATES_LIST';
export const FLAG_HIDE_STATIC_PIPELINE_PLUGIN_TRIGGERBINDINGS_LIST =
  'HIDE_STATIC_PIPELINE_PLUGIN_TRIGGERBINDINGS_LIST';
export const FLAG_HIDE_STATIC_PIPELINE_PLUGIN_CLUSTERTRIGGERSBINDINGS_LIST =
  'HIDE_STATIC_PIPELINE_PLUGIN_CLUSTERTRIGGERSBINDINGS_LIST';
export const FLAG_HIDE_STATIC_PIPELINE_PLUGIN_PIPELINE_DETAILS =
  'HIDE_STATIC_PIPELINE_PLUGIN_PIPELINE_DETAILS';
export const FLAG_HIDE_STATIC_PIPELINE_PLUGIN_PIPELINERUN_DETAILS =
  'HIDE_STATIC_PIPELINE_PLUGIN_PIPELINERUN_DETAILS';
export const FLAG_HIDE_STATIC_PIPELINE_PLUGIN_REPOSITORY_DETAILS =
  'HIDE_STATIC_PIPELINE_PLUGIN_REPOSITORY_DETAILS';
export const FLAG_HIDE_STATIC_PIPELINE_PLUGIN_TASK_DETAILS =
  'HIDE_STATIC_PIPELINE_PLUGIN_TASK_DETAILS';
export const FLAG_HIDE_STATIC_PIPELINE_PLUGIN_TASKRUN_DETAILS =
  'HIDE_STATIC_PIPELINE_PLUGIN_TASKRUN_DETAILS';
export const FLAG_HIDE_STATIC_PIPELINE_PLUGIN_CLUSTERTASK_DETAILS =
  'HIDE_STATIC_PIPELINE_PLUGIN_CLUSTERTASK_DETAILS';
export const FLAG_HIDE_STATIC_PIPELINE_PLUGIN_EVENTLISTENER_DETAILS =
  'HIDE_STATIC_PIPELINE_PLUGIN_EVENTLISTENERS_DETAILS';
export const FLAG_HIDE_STATIC_PIPELINE_PLUGIN_TRIGGERTEMPLATE_DETAILS =
  'HIDE_STATIC_PIPELINE_PLUGIN_TRIGGERTEMPLATE_DETAILS';
export const FLAG_HIDE_STATIC_PIPELINE_PLUGIN_TRIGGERBINDING_DETAILS =
  'HIDE_STATIC_PIPELINE_PLUGIN_TRIGGERBINDING_DETAILS';
export const FLAG_HIDE_STATIC_PIPELINE_PLUGIN_CLUSTERTRIGGERSBINDING_DETAILS =
  'HIDE_STATIC_PIPELINE_PLUGIN_CLUSTERTRIGGERSBINDING_DETAILS';
export const FLAG_HIDE_STATIC_PIPELINE_PLUGIN_PIPELINERUN_DETAIL_OUTPUT_TAB =
  'HIDE_STATIC_PIPELINE_PLUGIN_PIPELINERUN_DETAIL_OUTPUT_TAB';
export const FLAG_HIDE_STATIC_PIPELINE_PLUGIN_PIPELINERUN_DETAIL_APPROVALS_TAB =
  'HIDE_STATIC_PIPELINE_PLUGIN_PIPELINERUN_DETAIL_APPROVALS_TAB';
export const FLAG_HIDE_STATIC_PIPELINE_PLUGIN_PIPELINE_BUILDER =
  'HIDE_STATIC_PIPELINE_PLUGIN_PIPELINE_BUILDER';

export const RESOURCE_LOADED_FROM_RESULTS_ANNOTATION =
  'resource.loaded.from.tektonResults';

export const LOG_SOURCE_RESTARTING = 'restarting';
export const LOG_SOURCE_RUNNING = 'running';
export const LOG_SOURCE_TERMINATED = 'terminated';
export const LOG_SOURCE_WAITING = 'waiting';

export const PIPELINE_SERVICE_ACCOUNT = 'pipeline';

export enum SecretAnnotationId {
  Git = 'git',
  Image = 'docker',
}

export enum StartedByAnnotation {
  user = 'pipeline.openshift.io/started-by',
}

export enum TektonResourceLabel {
  pipeline = 'tekton.dev/pipeline',
  pipelinerun = 'tekton.dev/pipelineRun',
  taskrun = 'tekton.dev/taskRun',
  pipelineTask = 'tekton.dev/pipelineTask',
}

export enum RepositoryFields {
  REPOSITORY = 'Repository',
  URL_ORG = 'RepoOrg',
  URL_REPO = 'RepoUrl',
  SHA = 'sha',
  EVENT_TYPE = 'EventType',
}

export enum RepoAnnotationFields {
  SHA_MESSAGE = 'sha_message',
  SHA_URL = 'sha_url',
  REPO_URL = 'repo_url',
  BRANCH = 'Branch',
}

export const RepositoryLabels: Record<RepositoryFields, string> = {
  [RepositoryFields.REPOSITORY]: 'pipelinesascode.tekton.dev/repository',
  [RepositoryFields.URL_REPO]: 'pipelinesascode.tekton.dev/url-repository',
  [RepositoryFields.URL_ORG]: 'pipelinesascode.tekton.dev/url-org',
  [RepositoryFields.SHA]: 'pipelinesascode.tekton.dev/sha',
  [RepositoryFields.EVENT_TYPE]: 'pipelinesascode.tekton.dev/event-type',
};

export const RepositoryAnnotations: Record<RepoAnnotationFields, string> = {
  [RepoAnnotationFields.SHA_MESSAGE]: 'pipelinesascode.tekton.dev/sha-title',
  [RepoAnnotationFields.SHA_URL]: 'pipelinesascode.tekton.dev/sha-url',
  [RepoAnnotationFields.REPO_URL]: 'pipelinesascode.tekton.dev/repo-url',
  [RepoAnnotationFields.BRANCH]: 'pipelinesascode.tekton.dev/branch',
};

export enum ApprovalFields {
  PIPELINE = 'Pipeline',
  PIPELINE_RUN = 'PipelineRun',
  APPROVAL_TASK = 'ApprovalTask',
  CUSTOM_RUN = 'CustomRun',
}

export const ApprovalLabels: Record<string, string> = {
  [ApprovalFields.PIPELINE]: 'tekton.dev/pipeline',
  [ApprovalFields.PIPELINE_RUN]: 'tekton.dev/pipelineRun',
  [ApprovalFields.APPROVAL_TASK]: 'tekton.dev/pipelineTask',
  [ApprovalFields.CUSTOM_RUN]: 'tekton.dev/customRun',
};

export enum VolumeTypes {
  NoWorkspace = 'noWorkspace',
  EmptyDirectory = 'emptyDirectory',
  ConfigMap = 'configMap',
  Secret = 'secret',
  PVC = 'pvc',
  VolumeClaimTemplate = 'volumeClaimTemplate',
}
export const KEBAB_ACTION_DELETE_ID = 'delete';
export const KEBAB_ACTION_EDIT_ANNOTATIONS_ID = 'edit-annotations';
export const KEBAB_ACTION_EDIT_ID = 'edit';
export const KEBAB_ACTION_EDIT_LABELS_ID = 'edit-labels';
export const KEBAB_BUTTON_ID = 'kebab-button';

export const DELETED_RESOURCE_IN_K8S_ANNOTATION = 'resource.deleted.in.k8s';

export const chainsSignedAnnotation = 'chains.tekton.dev/signed';
export const preferredNameAnnotation = 'pipeline.openshift.io/preferredName';
export const FLAG_OPENSHIFT_PIPELINE_AS_CODE = 'OPENSHIFT_PIPELINE_AS_CODE';
export const FLAG_OPENSHIFT_PIPELINE_APPROVAL_TASK =
  'OPENSHIFT_PIPELINE_APPROVAL_TASK';
export const PAC_INFO = 'pipelines-as-code-info';
export const PIPELINE_NAMESPACE = 'openshift-pipelines';

export enum StartedByLabel {
  triggers = 'triggers.tekton.dev/eventlistener',
}

export const TRIGGER_BINDING_EMPTY = '#empty-trigger-binding#';
