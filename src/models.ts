import { chart_color_green_400 as tektonGroupColor } from '@patternfly/react-tokens/dist/js/chart_color_green_400';

const color = tektonGroupColor.value;

  export const PipelineModel = {
    apiGroup: 'tekton.dev',
    apiVersion: 'v1',
    label: 'Pipeline',
    // t('pipelines-plugin~Pipeline')
    labelKey: 'pipelines-plugin~Pipeline',
    // t('pipelines-plugin~Pipelines')
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
    // t('plugin__pipeline-console-plugin~Repository')
    labelKey: 'plugin__pipeline-console-plugin~Repository',
    // t('plugin__pipeline-console-plugin~Repositories')
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