export const operatorsPO = {
  search:
    '[data-test="search-operatorhub"] input[aria-label="Filter by keyword..."]',
  nav: {
    operators: '[data-quickstart-id="qs-nav-operators"]',
    operatorHub: 'a[data-test="nav"][href="/operatorhub"]',
    installedOperators:
      'a[data-test="nav"][href$="/operators.coreos.com~v1alpha1~ClusterServiceVersion"]',
    link: '[data-test="nav"]',
    menuItems: '#page-sidebar ul li',
    serverless: '[data-quickstart-id="qs-nav-serverless"]',
    eventing: `a[href^="/eventing/"]`,
    serving: `a[href^="/serving/"]`,
    administration: '[data-quickstart-id="qs-nav-administration"]',
    customResourceDefinitions:
      'a[data-test="nav"][href$="apiextensions.k8s.io~v1~CustomResourceDefinition"]',
  },
  operatorHub: {
    install: '[data-test="install-operator"]',
    pipelinesOperatorCard:
      '[data-test="openshift-pipelines-operator-rh-redhat-operators-openshift-marketplace"]',
    serverlessOperatorCard:
      '[data-test="serverless-operator-redhat-operators-openshift-marketplace"]',
    installingOperatorModal: '#operator-install-page',
  },
  subscription: {
    logo: 'h1.co-clusterserviceversion-logo__name__clusterserviceversion',
  },
  installOperators: {
    title: 'h1.co-m-pane__heading',
    noOperatorsFound: '[data-test="msg-box-title"]',
    noOperatorsDetails: '[data-test="msg-box-detail"]',
    search: 'input[data-test-id="item-filter"]',
    noOperatorFoundMessage: 'div.cos-status-box__title',
    knativeServingLink: '[title="knativeservings.operator.knative.dev"]',
    knativeEventingLink: '[title="knativeeventings.operator.knative.dev"]',
    knativeKafkaLink:
      '[title="knativekafkas.operator.serverless.openshift.io"]',
    operatorStatus: '[data-test="status-text"]',
  },
  sidePane: {
    install: '[data-test-id="operator-install-btn"]',
    uninstall: '[data-test-id="operator-uninstall-btn"]',
  },
  alertDialog: '[role="dialog"]',
};
