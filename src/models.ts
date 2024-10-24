import { K8sKind } from '@openshift-console/dynamic-plugin-sdk';
import { chart_color_green_400 as tektonGroupColor } from '@patternfly/react-tokens/dist/js/chart_color_green_400';

const color = tektonGroupColor.value;

export const NamespaceModel: K8sKind = {
  apiVersion: 'v1',
  label: 'Namespace',
  // t('plugin__pipelines-console-plugin~Namespace')
  labelKey: 'Namespace',
  plural: 'namespaces',
  abbr: 'NS',
  kind: 'Namespace',
  id: 'namespace',
  labelPlural: 'Namespaces',
  // t('plugin__pipelines-console-plugin~Namespaces')
  labelPluralKey: 'Namespaces',
};

export const PipelineModel = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1',
  label: 'Pipeline',
  // t('plugin__pipelines-console-plugin~Pipeline')
  labelKey: 'Pipeline',
  // t('plugin__pipelines-console-plugin~Pipelines')
  labelPluralKey: 'Pipelines',
  plural: 'pipelines',
  abbr: 'PL',
  namespaced: true,
  kind: 'Pipeline',
  id: 'pipeline',
  labelPlural: 'Pipelines',
  crd: true,
  color,
};

export const PipelineModelV1Beta1 = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1beta1',
  label: 'Pipeline',
  // t('plugin__pipelines-console-plugin~Pipeline')
  labelKey: 'Pipeline',
  // t('plugin__pipelines-console-plugin~Pipelines')
  labelPluralKey: 'Pipelines',
  plural: 'pipelines',
  abbr: 'PL',
  namespaced: true,
  kind: 'Pipeline',
  id: 'pipeline',
  labelPlural: 'Pipelines',
  crd: true,
  color,
};

export const RepositoryModel = {
  apiGroup: 'pipelinesascode.tekton.dev',
  apiVersion: 'v1alpha1',
  label: 'Repository',
  // t('plugin__pipelines-console-plugin~Repository')
  labelKey: 'Repository',
  // t('plugin__pipelines-console-plugin~Repositories')
  labelPluralKey: 'Repositories',
  plural: 'repositories',
  abbr: 'R',
  namespaced: true,
  kind: 'Repository',
  id: 'repository',
  labelPlural: 'Repositories',
  crd: true,
  color,
};

export const TektonResultModel: K8sKind = {
  apiGroup: 'operator.tekton.dev',
  apiVersion: 'v1alpha1',
  kind: 'TektonResult',
  plural: 'tektonresults',
  label: 'tektonresult',
  // t('plugin__pipelines-console-plugin~TektonResult')
  labelKey: 'TektonResult',
  labelPlural: 'TektonResults',
  // t('plugin__pipelines-console-plugin~TektonResults')
  labelPluralKey: 'TektonResults',
  id: 'tektonResult',
  abbr: 'TR',
  crd: true,
  color: '#38812f',
};

export const RouteModel: K8sKind = {
  label: 'Route',
  // t('plugin__pipelines-console-plugin~Route')
  labelKey: 'Route',
  labelPlural: 'Routes',
  // t('plugin__pipelines-console-plugin~Routes')
  labelPluralKey: 'Routes',
  apiGroup: 'route.openshift.io',
  apiVersion: 'v1',
  plural: 'routes',
  abbr: 'RT',
  namespaced: true,
  kind: 'Route',
  id: 'route',
};

export const ClusterVersionModel: K8sKind = {
  label: 'ClusterVersion',
  // t('plugin__pipelines-console-plugin~ClusterVersion')
  labelKey: 'ClusterVersion',
  labelPlural: 'ClusterVersions',
  // t('plugin__pipelines-console-plugin~ClusterVersions')
  labelPluralKey: 'ClusterVersions',
  apiVersion: 'v1',
  apiGroup: 'config.openshift.io',
  plural: 'clusterversions',
  abbr: 'CV',
  namespaced: false,
  kind: 'ClusterVersion',
  id: 'clusterversion',
  crd: true,
};

export const TaskRunModel: K8sKind = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1',
  label: 'TaskRun',
  // t('plugin__pipelines-console-plugin~TaskRun')
  labelKey: 'TaskRun',
  // t('plugin__pipelines-console-plugin~TaskRuns')
  labelPluralKey: 'TaskRuns',
  plural: 'taskruns',
  abbr: 'TR',
  namespaced: true,
  kind: 'TaskRun',
  id: 'taskrun',
  labelPlural: 'TaskRuns',
  crd: true,
  color,
};

export const PipelineRunModel: K8sKind = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1',
  label: 'PipelineRun',
  // t('plugin__pipelines-console-plugin~PipelineRun')
  labelKey: 'PipelineRun',
  // t('plugin__pipelines-console-plugin~PipelineRuns')
  labelPluralKey: 'PipelineRuns',
  plural: 'pipelineruns',
  abbr: 'PLR',
  namespaced: true,
  kind: 'PipelineRun',
  id: 'pipelinerun',
  labelPlural: 'PipelineRuns',
  crd: true,
  color,
};

export const PipelineRunModelV1Beta1: K8sKind = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1beta1',
  label: 'PipelineRun',
  // t('plugin__pipelines-console-plugin~PipelineRun')
  labelKey: 'PipelineRun',
  // t('plugin__pipelines-console-plugin~PipelineRuns')
  labelPluralKey: 'PipelineRuns',
  plural: 'pipelineruns',
  abbr: 'PLR',
  namespaced: true,
  kind: 'PipelineRun',
  id: 'pipelinerun',
  labelPlural: 'PipelineRuns',
  crd: true,
  color,
};

export const ServiceAccountModel: K8sKind = {
  apiVersion: 'v1',
  label: 'ServiceAccount',
  // t('plugin__pipelines-console-plugin~ServiceAccount')
  labelKey: 'ServiceAccount',
  plural: 'serviceaccounts',
  abbr: 'SA',
  namespaced: true,
  kind: 'ServiceAccount',
  id: 'serviceaccount',
  labelPlural: 'ServiceAccounts',
  // t('plugin__pipelines-console-plugin~ServiceAccounts')
  labelPluralKey: 'ServiceAccounts',
};

export const ServiceModel: K8sKind = {
  apiVersion: 'v1',
  label: 'Service',
  // t('plugin__pipelines-console-plugin~Service')
  labelKey: 'Service',
  plural: 'services',
  abbr: 'S',
  namespaced: true,
  kind: 'Service',
  id: 'service',
  labelPlural: 'Services',
  // t('plugin__pipelines-console-plugin~Services')
  labelPluralKey: 'Services',
};

export const TaskModel: K8sKind = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1',
  label: 'Task',
  // t('plugin__pipelines-console-plugin~Task')
  labelKey: 'Task',
  // t('plugin__pipelines-console-plugin~Tasks')
  labelPluralKey: 'Tasks',
  plural: 'tasks',
  abbr: 'T',
  namespaced: true,
  kind: 'Task',
  id: 'task',
  labelPlural: 'Tasks',
  crd: true,
  color,
};

export const TaskModelV1Beta1: K8sKind = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1beta1',
  label: 'Task',
  // t('plugin__pipelines-console-plugin~Task')
  labelKey: 'Task',
  // t('plugin__pipelines-console-plugin~Tasks')
  labelPluralKey: 'Tasks',
  plural: 'tasks',
  abbr: 'T',
  namespaced: true,
  kind: 'Task',
  id: 'task',
  labelPlural: 'Tasks',
  crd: true,
  color,
};

export const EventListenerModel: K8sKind = {
  apiGroup: 'triggers.tekton.dev',
  apiVersion: 'v1beta1',
  label: 'EventListener',
  // t('plugin__pipelines-console-plugin~EventListener')
  labelKey: 'EventListener',
  // t('plugin__pipelines-console-plugin~EventListeners')
  labelPluralKey: 'EventListeners',
  plural: 'eventlisteners',
  abbr: 'EL',
  namespaced: true,
  kind: 'EventListener',
  id: 'eventlistener',
  labelPlural: 'EventListeners',
  crd: true,
  color,
};

export const ClusterTaskModel: K8sKind = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1beta1',
  label: 'ClusterTask',
  // t('plugin__pipelines-console-plugin~ClusterTask')
  labelKey: 'ClusterTask',
  // t('plugin__pipelines-console-plugin~ClusterTasks')
  labelPluralKey: 'ClusterTasks',
  plural: 'clustertasks',
  abbr: 'CT',
  namespaced: false,
  kind: 'ClusterTask',
  id: 'clustertask',
  labelPlural: 'ClusterTasks',
  crd: true,
  color,
};

export const TriggerTemplateModel: K8sKind = {
  apiGroup: 'triggers.tekton.dev',
  apiVersion: 'v1beta1',
  label: 'TriggerTemplate',
  // t('plugin__pipelines-console-plugin~TriggerTemplate')
  labelKey: 'TriggerTemplate',
  // t('plugin__pipelines-console-plugin~TriggerTemplates')
  labelPluralKey: 'TriggerTemplates',
  plural: 'triggertemplates',
  abbr: 'TT',
  namespaced: true,
  kind: 'TriggerTemplate',
  id: 'triggertemplate',
  labelPlural: 'TriggerTemplates',
  crd: true,
  color,
};

export const TriggerBindingModel: K8sKind = {
  apiGroup: 'triggers.tekton.dev',
  apiVersion: 'v1beta1',
  label: 'TriggerBinding',
  // t('plugin__pipelines-console-plugin~TriggerBinding')
  labelKey: 'TriggerBinding',
  // t('plugin__pipelines-console-plugin~TriggerBindings')
  labelPluralKey: 'TriggerBindings',
  plural: 'triggerbindings',
  abbr: 'TB',
  namespaced: true,
  kind: 'TriggerBinding',
  id: 'triggerbinding',
  labelPlural: 'TriggerBindings',
  crd: true,
  color,
};

export const ClusterTriggerBindingModel: K8sKind = {
  apiGroup: 'triggers.tekton.dev',
  apiVersion: 'v1beta1',
  label: 'ClusterTriggerBinding',
  // t('plugin__pipelines-console-plugin~ClusterTriggerBinding')
  labelKey: 'ClusterTriggerBinding',
  // t('plugin__pipelines-console-plugin~ClusterTriggerBindings')
  labelPluralKey: 'ClusterTriggerBindings',
  plural: 'clustertriggerbindings',
  abbr: 'CTB',
  namespaced: false,
  kind: 'ClusterTriggerBinding',
  id: 'clustertriggerbinding',
  labelPlural: 'ClusterTriggerBindings',
  crd: true,
  color,
};

export const PodModel = {
  apiVersion: 'v1',
  label: 'Pod',
  // t('plugin__pipelines-console-plugin~Pod')
  labelKey: 'Pod',
  plural: 'pods',
  abbr: 'P',
  namespaced: true,
  kind: 'Pod',
  id: 'pod',
  labelPlural: 'Pods',
  // t('plugin__pipelines-console-plugin~Pods')
  labelPluralKey: 'Pods',
};

export const NodeModel: K8sKind = {
  apiVersion: 'v1',
  label: 'Node',
  // t('plugin__pipelines-console-plugin~Node')
  labelKey: 'Node',
  plural: 'nodes',
  abbr: 'N',
  kind: 'Node',
  id: 'node',
  labelPlural: 'Nodes',
  // t('plugin__pipelines-console-plugin~Nodes')
  labelPluralKey: 'Nodes',
};

export const EventModel: K8sKind = {
  apiVersion: 'v1',
  label: 'Event',
  // t('plugin__pipelines-console-plugin~Event')
  labelKey: 'Event',
  plural: 'events',
  abbr: 'E',
  namespaced: true,
  kind: 'Event',
  id: 'event',
  labelPlural: 'Events',
  // t('plugin__pipelines-console-plugin~Events')
  labelPluralKey: 'Events',
};

export const PersistentVolumeClaimModel: K8sKind = {
  label: 'PersistentVolumeClaim',
  // t('plugin__pipelines-console-plugin~PersistentVolumeClaim')
  labelKey: 'PersistentVolumeClaim',
  apiVersion: 'v1',
  plural: 'persistentvolumeclaims',
  abbr: 'PVC',
  namespaced: true,
  kind: 'PersistentVolumeClaim',
  id: 'persistentvolumeclaim',
  labelPlural: 'PersistentVolumeClaims',
  // t('plugin__pipelines-console-plugin~PersistentVolumeClaims')
  labelPluralKey: 'PersistentVolumeClaims',
};

export const ConfigMapModel: K8sKind = {
  apiVersion: 'v1',
  label: 'ConfigMap',
  // t('plugin__pipelines-console-plugin~ConfigMap')
  labelKey: 'ConfigMap',
  plural: 'configmaps',
  abbr: 'CM',
  namespaced: true,
  kind: 'ConfigMap',
  id: 'configmap',
  labelPlural: 'ConfigMaps',
  // t('plugin__pipelines-console-plugin~ConfigMaps')
  labelPluralKey: 'ConfigMaps',
};

export const SecretModel: K8sKind = {
  apiVersion: 'v1',
  label: 'Secret',
  // t('plugin__pipelines-console-plugin~Secret')
  labelKey: 'Secret',
  plural: 'secrets',
  abbr: 'S',
  namespaced: true,
  kind: 'Secret',
  id: 'secret',
  labelPlural: 'Secrets',
  // t('plugin__pipelines-console-plugin~Secrets')
  labelPluralKey: 'Secrets',
};

export const ApprovalTaskModel: K8sKind = {
  apiGroup: 'openshift-pipelines.org',
  apiVersion: 'v1alpha1',
  label: 'ApprovalTask',
  // t('plugin__pipelines-console-plugin~ApprovalTask')
  labelKey: 'ApprovalTask',
  // t('plugin__pipelines-console-plugin~ApprovalTasks')
  labelPluralKey: 'Approvals',
  plural: 'approvaltasks',
  abbr: 'AT',
  namespaced: true,
  kind: 'ApprovalTask',
  id: 'approvaltask',
  labelPlural: 'ApprovalTasks',
  crd: true,
  color,
};

export const CustomRunModelV1Beta1: K8sKind = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1beta1',
  label: 'CustomRun',
  // t('plugin__pipelines-console-plugin~CustomRun')
  labelKey: 'CustomRun',
  // t('plugin__pipelines-console-plugin~CustomRuns')
  labelPluralKey: 'CustomRuns',
  plural: 'customruns',
  abbr: 'CR',
  namespaced: true,
  kind: 'CustomRun',
  id: 'customrun',
  labelPlural: 'CustomRuns',
  crd: true,
  color,
};

export const ProjectModel: K8sKind = {
  apiVersion: 'v1',
  apiGroup: 'project.openshift.io',
  label: 'Project',
  // t('plugin__pipelines-console-plugin~Project')
  labelKey: 'Project',
  plural: 'projects',
  abbr: 'PR',
  kind: 'Project',
  id: 'project',
  labelPlural: 'Projects',
  // t('plugin__pipelines-console-plugin~Projects')
  labelPluralKey: 'Projects',
};

export const ConsoleYAMLSampleModel: K8sKind = {
  label: 'ConsoleYAMLSample',
  // t('plugin__pipelines-console-plugin~ConsoleYAMLSample')
  labelKey: 'plugin__pipelines-console-plugin~ConsoleYAMLSample',
  labelPlural: 'ConsoleYAMLSamples',
  // t('plugin__pipelines-console-plugin~ConsoleYAMLSamples')
  labelPluralKey: 'plugin__pipelines-console-plugin~ConsoleYAMLSamples',
  apiVersion: 'v1',
  apiGroup: 'console.openshift.io',
  plural: 'consoleyamlsamples',
  abbr: 'CYS',
  namespaced: false,
  kind: 'ConsoleYAMLSample',
  id: 'consoleyamlsample',
  crd: true,
};

export const TektonHubModel: K8sKind = {
  apiGroup: 'operator.tekton.dev',
  apiVersion: 'v1alpha1',
  label: 'TektonHub',
  // t('plugin__pipelines-console-plugin~TektonHub')
  labelKey: 'plugin__pipelines-console-plugin~TektonHub',
  // t('plugin__pipelines-console-plugin~TektonHubs')
  labelPluralKey: 'plugin__pipelines-console-plugin~TektonHubs',
  plural: 'tektonhubs',
  abbr: 'TH',
  namespaced: false,
  kind: 'TektonHub',
  id: 'tektonhub',
  labelPlural: 'TektonHubs',
  crd: true,
};

export const TektonConfigModel: K8sKind = {
  apiGroup: 'operator.tekton.dev',
  apiVersion: 'v1alpha1',
  label: 'TektonConfig',
  // t('plugin__pipelines-console-plugin~TektonConfig')
  labelKey: 'plugin__pipelines-console-plugin~TektonConfig',
  // t('plugin__pipelines-console-plugin~TektonConfigs')
  labelPluralKey: 'plugin__pipelines-console-plugin~TektonConfigs',
  plural: 'tektonconfigs',
  abbr: 'TC',
  namespaced: false,
  kind: 'TektonConfig',
  id: 'tektonconfig',
  labelPlural: 'TektonConfigs',
  crd: true,
};
