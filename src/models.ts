import { K8sKind } from '@openshift-console/dynamic-plugin-sdk';
import { chart_color_green_400 as tektonGroupColor } from '@patternfly/react-tokens/dist/js/chart_color_green_400';

const color = tektonGroupColor.value;

export const PipelineModel = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1',
  label: 'Pipeline',
  // t('Pipeline')
  labelKey: 'Pipeline',
  // t('Pipelines')
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
  // t('Pipeline')
  labelKey: 'Pipeline',
  // t('Pipelines')
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
  // t('Repository')
  labelKey: 'Repository',
  // t('Repositories')
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
  // t('TektonResult')
  labelKey: 'TektonResult',
  labelPlural: 'TektonResults',
  // t('TektonResults')
  labelPluralKey: 'TektonResults',
  id: 'tektonResult',
  abbr: 'TR',
  crd: true,
  color: '#38812f',
};

export const RouteModel: K8sKind = {
  label: 'Route',
  // t('Route')
  labelKey: 'Route',
  labelPlural: 'Routes',
  // t('Routes')
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
  // t('ClusterVersion')
  labelKey: 'ClusterVersion',
  labelPlural: 'ClusterVersions',
  // t('ClusterVersions')
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
  // t('TaskRun')
  labelKey: 'TaskRun',
  // t('TaskRuns')
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
  // t('PipelineRun')
  labelKey: 'PipelineRun',
  // t('PipelineRuns')
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
  // t('PipelineRun')
  labelKey: 'PipelineRun',
  // t('PipelineRuns')
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
  // t('ServiceAccount')
  labelKey: 'ServiceAccount',
  plural: 'serviceaccounts',
  abbr: 'SA',
  namespaced: true,
  kind: 'ServiceAccount',
  id: 'serviceaccount',
  labelPlural: 'ServiceAccounts',
  // t('ServiceAccounts')
  labelPluralKey: 'ServiceAccounts',
};

export const ServiceModel: K8sKind = {
  apiVersion: 'v1',
  label: 'Service',
  // t('Service')
  labelKey: 'Service',
  plural: 'services',
  abbr: 'S',
  namespaced: true,
  kind: 'Service',
  id: 'service',
  labelPlural: 'Services',
  // t('Services')
  labelPluralKey: 'Services',
};

export const TaskModel: K8sKind = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1',
  label: 'Task',
  // t('Task')
  labelKey: 'Task',
  // t('Tasks')
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
  // t('Task')
  labelKey: 'Task',
  // t('Tasks')
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
  // t('EventListener')
  labelKey: 'EventListener',
  // t('EventListeners')
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
  // t('ClusterTask')
  labelKey: 'ClusterTask',
  // t('ClusterTasks')
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
  // t('TriggerTemplate')
  labelKey: 'TriggerTemplate',
  // t('TriggerTemplates')
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
  // t('TriggerBinding')
  labelKey: 'TriggerBinding',
  // t('TriggerBindings')
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
  // t('ClusterTriggerBinding')
  labelKey: 'ClusterTriggerBinding',
  // t('ClusterTriggerBindings')
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
  // t('Pod')
  labelKey: 'Pod',
  plural: 'pods',
  abbr: 'P',
  namespaced: true,
  kind: 'Pod',
  id: 'pod',
  labelPlural: 'Pods',
  // t('Pods')
  labelPluralKey: 'Pods',
};

export const NodeModel: K8sKind = {
  apiVersion: 'v1',
  label: 'Node',
  // t('Node')
  labelKey: 'Node',
  plural: 'nodes',
  abbr: 'N',
  kind: 'Node',
  id: 'node',
  labelPlural: 'Nodes',
  // t('Nodes')
  labelPluralKey: 'Nodes',
};

export const EventModel: K8sKind = {
  apiVersion: 'v1',
  label: 'Event',
  // t('Event')
  labelKey: 'Event',
  plural: 'events',
  abbr: 'E',
  namespaced: true,
  kind: 'Event',
  id: 'event',
  labelPlural: 'Events',
  // t('Events')
  labelPluralKey: 'Events',
};

export const PersistentVolumeClaimModel: K8sKind = {
  label: 'PersistentVolumeClaim',
  // t('PersistentVolumeClaim')
  labelKey: 'PersistentVolumeClaim',
  apiVersion: 'v1',
  plural: 'persistentvolumeclaims',
  abbr: 'PVC',
  namespaced: true,
  kind: 'PersistentVolumeClaim',
  id: 'persistentvolumeclaim',
  labelPlural: 'PersistentVolumeClaims',
  // t('PersistentVolumeClaims')
  labelPluralKey: 'PersistentVolumeClaims',
};

export const ConfigMapModel: K8sKind = {
  apiVersion: 'v1',
  label: 'ConfigMap',
  // t('ConfigMap')
  labelKey: 'ConfigMap',
  plural: 'configmaps',
  abbr: 'CM',
  namespaced: true,
  kind: 'ConfigMap',
  id: 'configmap',
  labelPlural: 'ConfigMaps',
  // t('ConfigMaps')
  labelPluralKey: 'ConfigMaps',
};

export const SecretModel: K8sKind = {
  apiVersion: 'v1',
  label: 'Secret',
  // t('Secret')
  labelKey: 'Secret',
  plural: 'secrets',
  abbr: 'S',
  namespaced: true,
  kind: 'Secret',
  id: 'secret',
  labelPlural: 'Secrets',
  // t('Secrets')
  labelPluralKey: 'Secrets',
};

export const ApprovalTaskModel: K8sKind = {
  apiGroup: 'openshift-pipelines.org',
  apiVersion: 'v1alpha1',
  label: 'ApprovalTask',
  // t('ApprovalTask')
  labelKey: 'ApprovalTask',
  // t('ApprovalTasks')
  labelPluralKey: 'ApprovalTasks',
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
  // t('CustomRun')
  labelKey: 'CustomRun',
  // t('CustomRuns')
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
  // t('Project')
  labelKey: 'Project',
  plural: 'projects',
  abbr: 'PR',
  kind: 'Project',
  id: 'project',
  labelPlural: 'Projects',
  // t('Projects')
  labelPluralKey: 'Projects',
};
