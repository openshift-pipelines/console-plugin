import { chart_color_green_400 as tektonGroupColor } from '@patternfly/react-tokens/dist/js/chart_color_green_400';
import { K8sKind } from '@openshift-console/dynamic-plugin-sdk';

const color = tektonGroupColor.value;

export const PipelineModel = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1',
  label: 'Pipeline',
  // t('Pipeline')
  labelKey: 'pipelines-plugin~Pipeline',
  // t('Pipelines')
  labelPluralKey: 'pipelines-plugin~Pipelines',
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
  labelKey: 'plugin__pipeline-console-plugin~Repository',
  // t('Repositories')
  labelPluralKey: 'plugin__pipeline-console-plugin~Repositories',
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
  // t('public~Route')
  labelKey: 'public~Route',
  labelPlural: 'Routes',
  // t('public~Routes')
  labelPluralKey: 'public~Routes',
  apiGroup: 'route.openshift.io',
  apiVersion: 'v1',
  plural: 'routes',
  abbr: 'RT',
  namespaced: true,
  kind: 'Route',
  id: 'route',
};
