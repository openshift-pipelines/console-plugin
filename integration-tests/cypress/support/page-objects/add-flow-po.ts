// export const cardTitle = '[data-test="title"]';

export const gitPO = {
  // noWorkLoadsText: 'h2.co-hint-block__title',
  // sectionTitle: '.odc-form-section__heading',
  gitRepoUrl: '[data-test-id="git-form-input-url"]',
  // builderImageCard: '.odc-selector-card',
  nodeName: '[data-test-id="application-form-app-name"]',
  appName: '[id$=application-name-field]',
  // createNewApp: '[data-test-id="dropdown-menu"]',
  // newAppName: '[data-test-id="application-form-app-input"]',
  create: '[data-test-id="submit-button"]',
  cancel: '[data-test-id="reset-button"]',
  gitSection: {
    validatedMessage: '[id$="git-url-field-helper"]',
  },
  pipeline: {
    infoMessage: '[aria-label="Info Alert"]',
    buildDropdown: '[id="form-select-input-build-option-field"]',
    addPipeline: '[id="select-option-build.option-PIPELINES"]',
    pipelineDropdown: '#form-dropdown-pipeline-templateSelected-field',
  },
  resourcesDropdown: '#form-select-input-resources-field',
  resources: {
    deployment: '#select-option-resources-kubernetes',
    deploymentConfig: '#select-option-resources-openshift',
    knative: '#select-option-resources-knative',
  },
};

export const catalogPO = {
  search: 'input[placeholder="Filter by keyword..."]',
  card: '[class$="catalog-tile"]',
  catalogTypes: {
    builderImage: '[data-test="tab BuilderImage"]',
  },
  cards: {
    nodeJsBuilderImage: '[data-test="BuilderImage-Node.js"]',
  },
  sidePane: {
    dialog: '[role="dialog"]',
    instantiateTemplate: '[role="dialog"] [role="button"]',
  },
};
