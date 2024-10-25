/* eslint-disable @typescript-eslint/naming-convention */

export enum devNavigationMenu {
  Add = '+Add',
  Topology = 'Topology',
  Observe = 'Observe',
  Builds = 'Builds',
  Search = 'Search',
  Helm = 'Helm',
  Project = 'Project',
  ProjectAccess = 'Project Access',
  Pipelines = 'Pipelines',
  ConfigMaps = 'Config Maps',
  Secrets = 'Secrets',
  GitOps = 'GitOps',
  Environments = 'Environments',
  Routes = 'Routes',
  Deployments = 'Deployments',
  Consoles = 'Consoles',
  Functions = 'Functions',
}

export enum adminNavigationBar {
  Home = 'Home',
  Workloads = 'Workloads',
}

export enum switchPerspective {
  Developer = 'Developer',
  Administrator = 'Administrator',
}

export enum operators {
  PipelinesOperator = 'Red Hat OpenShift Pipelines',
  ServerlessOperator = 'Red Hat OpenShift Serverless',
}

export enum authenticationType {
  BasicAuthentication = 'Basic Authentication',
  SSHKey = 'SSHKey',
}

export enum resources {
  Deployments = 'Deployments',
  BuildConfigs = 'Build Configs',
  Builds = 'Builds',
  Services = 'Services',
  ImageStreams = 'Image Streams',
  Routes = 'Routes',
}

export enum nodeActions {
  EditApplicationGrouping = 'Edit application grouping',
  EditPodCount = 'Edit Pod count',
  PauseRollOuts = 'Pause rollouts',
  AddHealthChecks = 'Add Health Checks',
  AddHorizontalPodAutoScaler = 'Add HorizontalPodAutoscaler',
  AddStorage = 'Add storage',
  EditUpdateStrategy = 'Edit update strategy',
  EditLabels = 'Edit labels',
  EditDeployment = 'Edit Deployment',
  EditDeploymentConfig = 'Edit DeploymentConfig',
  EditResourceLimits = 'Edit resource limits',
}

export enum operatorNamespaces {
  PipelinesOperator = 'openshift-operators',
  ServerlessOperator = 'openshift-serverless',
  ShipwrightOperator = 'openshift-operators',
  BuildsForOpenshiftOperator = 'openshift-operators',
  WebTerminalOperator = 'openshift-operators',
  RedHatIntegrationCamelK = 'openshift-operators',
  DevWorkspaceOperator = 'openshift-operators',
}

export enum operatorSubscriptions {
  PipelinesOperator = 'openshift-pipelines-operator',
  ServerlessOperator = 'serverless-operator',
  ShipwrightOperator = 'shipwright-operator',
  BuildsForOpenshiftOperator = 'openshift-builds-operator',
  WebTerminalOperator = 'web-terminal',
  RedHatIntegrationCamelK = 'red-hat-camel-k',
  DevWorkspaceOperator = 'devworkspace-operator',
}

export enum operatorPackage {
  PipelinesOperator = 'openshift-pipelines-operator-rh',
  ServerlessOperator = 'serverless-operator',
  ShipwrightOperator = 'shipwright-operator',
  BuildsForOpenshiftOperator = 'openshift-builds-operator',
  WebTerminalOperator = 'web-terminal',
  RedHatIntegrationCamelK = 'red-hat-camel-k',
  DevWorkspaceOperator = 'devworkspace-operator',
}
