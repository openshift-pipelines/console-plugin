export const topologyPO = {
  switcher: 'button[data-test-id="topology-switcher-view"]',
  title: 'h1.ocs-page-layout__title',
  search: '[data-test-id="item-filter"]',
  highlightNode: '.is-filtered',
  emptyStateIcon: '[class*= empty-state__icon]',
  graph: {
    reset: '#reset-view',
    fitToScreen: '#fit-to-screen',
    contextMenu: '#popper-container ul',
    workloads: 'g[data-surface="true"]',
    node: '[data-test-id="base-node-handler"]',
    confirmModal: '[data-test="confirm-action"]',
    deleteWorkload: '[data-test="confirm-action"]',
    deleteApplication: '[id="form-input-resourceName-field"]',
  },
  list: {
    switcher:
      '[data-test-id="topology-switcher-view"][aria-label="Graph view"]',
  },
  sidePane: {
    dialog: '[data-test="topology-sidepane"]',
    title: '[role="dialog"] h1',
    sectionTitle: 'h2',
    tabName: '[role="dialog"] li button',
    pipelineRunsDetails: '.sidebar__section-heading',
    pipelineRunsLogSnippet: '.ocs-log-snippet__log-snippet',
    pipelineRunsStatus: '.ocs-log-snippet__status-message',
    pipelineRunsLinks: 'a.sidebar__section-view-all',
    resourcesTab: {
      startLastRun:
        '[role="dialog"] li.list-group-item.pipeline-overview div button',
      pipelineRuns: 'li.odc-pipeline-run-item',
    },
  },
};
