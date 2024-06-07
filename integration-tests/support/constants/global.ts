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
  // DeleteDeployment = 'Delete Deployment',
  // DeleteDeploymentConfig = 'Delete DeploymentConfig',
  // EditAnnotations = 'Edit annotations',
  // MoveSink = 'Move sink',
  // EditSinkBinding = 'Edit SinkBinding',
  // DeleteSinkBinding = 'Delete SinkBinding',
  // DeleteService = 'Delete Service',
  // EditService = 'Edit Service',
  // EditHealthChecks = 'Edit Health Checks',
  // HelmReleases = 'Helm Releases',
  // SetTrafficDistribution = 'Set traffic distribution',
  // AddSubscription = 'Add Subscription',
  // EditInMemoryChannel = 'Edit InMemoryChannel',
  // DeleteInMemoryChannel = 'Delete InMemoryChannel',
  // EditRevision = 'Edit Revision',
  // DeleteRevision = 'Delete Revision',
  // MakeServerless = 'Make Serverless',
  // AddTrigger = 'Add Trigger',
  // CreateServiceBinding = 'Create Service Binding',
}
