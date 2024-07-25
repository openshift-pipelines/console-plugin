import { nodeActions } from '../constants/global';
import { topologyPO } from '../page-objects/topology-po';
// import { globalPO } from '../page-objects/global-po';
import { app } from './app';
// import { topologyHelper } from './topology-helper-page';

export const topologyPage = {
  // verifyUserIsInGraphView: () => {
  //   cy.byLegacyTestID('topology-view-shortcuts').should('be.visible');
  //   // eslint-disable-next-line promise/catch-or-return
  //   cy.get('body').then(($body) => {
  //     if ($body.find('.odc-topology-list-view').length !== 0) {
  //       cy.get(topologyPO.switcher).should('be.enabled').click({ force: true });
  //       cy.get(topologyPO.graph.fitToScreen).should('be.visible');
  //     }
  //   });
  // },
  // verifyUserIsInListView: () => {
  //   cy.byLegacyTestID('topology-view-shortcuts').should('be.visible');
  //   // eslint-disable-next-line promise/catch-or-return
  //   cy.get('body').then(($body) => {
  //     if ($body.find('.odc-topology-graph-view').length !== 0) {
  //       cy.get(topologyPO.switcher).should('be.enabled').click({ force: true });
  //       cy.get(topologyPO.list.switchGraph).should('be.visible');
  //     }
  //   });
  // },
  waitForLoad: (timeout = 50000) => {
    app.waitForLoad();
    cy.get('.loading-box.loading-box__loaded', { timeout }).should('exist');
    cy.get('[data-surface="true"]').should('be.visible');
  },
  verifyTopologyPage: () => {
    app.waitForDocumentLoad();
    cy.url().should('include', 'topology');
  },
  // verifyTopologyGraphView: () => {
  //   // eslint-disable-next-line promise/catch-or-return
  //   cy.url().then(($text) => {
  //     $text.includes('graph')
  //       ? cy.log(`user is at topology graph view`)
  //       : cy.get(globalPO.topologySwitcher).click({ force: true });
  //   });
  // },
  // verifyContextMenu: () =>
  //   cy.get(topologyPO.graph.contextMenu).should('be.visible'),
  search: (name: string) => {
    /* eslint-disable-next-line cypress/unsafe-to-chain-command */
    cy.get(topologyPO.search).clear().type(name);
  },
  verifyWorkloadInTopologyPage: (
    appName: string,
    options?: { timeout: number },
  ) => {
    topologyPage.search(appName);
    cy.get('body').then(($body) => {
      if (
        $body.find(
          '[data-test-id="topology-switcher-view"][aria-label="Graph view"]',
        ).length !== 0
      ) {
        cy.get(topologyPO.list.switcher).click();
        cy.log('user is switching to graph view in topology page');
      } else {
        cy.log('You are on Topology page - Graph view');
      }
    });
    cy.get(topologyPO.graph.reset).click();
    cy.get(topologyPO.graph.fitToScreen).click();
    cy.get(topologyPO.highlightNode, options).should('be.visible');
    app.waitForDocumentLoad();
  },
  verifyPipelineRunStatus: (status: string) =>
    cy
      .get('li.list-group-item.pipeline-overview')
      .next('li')
      .find('span.co-icon-and-text span')
      .should('have.text', status),
  getAppNode: (appName: string) => {
    return cy
      .get(`[data-id="group:${appName}"] g.odc-resource-icon text`)
      .contains('A');
  },
  componentNode: (nodeName: string) => {
    return cy.get('g[class$=topology__node__label] > text').contains(nodeName);
  },
  selectContextMenuAction: (action: nodeActions | string) => {
    cy.byTestActionID(action).should('be.visible').click();
  },
  clickWorkloadUrl: (workloadName: string) => {
    cy.get('[data-type="workload"] text')
      .contains(workloadName)
      .parentsUntil(topologyPO.graph.node)
      .siblings('a')
      .first()
      .click({ force: true });
  },
  // addStorage: {
  //   pvc: {
  //     clickUseExistingClaim: () => {
  //       cy.get(topologyPO.addStorage.pvc.useExistingClaim).check();
  //     },
  //     createNewClaim: {
  //       clickCreateNewClaim: () => {
  //         cy.get(topologyPO.addStorage.pvc.createNewClaim.newClaim).check();
  //       },
  //       selectStorageClass: (storageClass: string = 'standard') => {
  //         cy.get(topologyPO.addStorage.pvc.createNewClaim.storageClass).click();
  //         cy.byLegacyTestID('dropdown-text-filter').type(storageClass);
  //         cy.get('ul[role="listbox"]')
  //           .find('li')
  //           .contains(storageClass)
  //           .click();
  //       },
  //       enterPVCName: (name: string) => {
  //         cy.get(topologyPO.addStorage.pvc.createNewClaim.pvcName).type(name);
  //       },
  //       enterSize: (size: string) => {
  //         cy.get(topologyPO.addStorage.pvc.createNewClaim.accessMode.size).type(
  //           size,
  //         );
  //       },
  //     },
  // },
  // enterMountPath: (mountPath: string) => {
  //   cy.get(topologyPO.addStorage.mountPath).type(mountPath);
  // },
  // clickSave: () => {
  //   cy.get(topologyPO.addStorage.save).click();
  // },
  // },

  deleteApplication: (appName: string) => {
    /* eslint-disable-next-line cypress/unsafe-to-chain-command */
    cy.get(topologyPO.graph.deleteApplication).clear().type(appName);
    cy.get(topologyPO.graph.deleteWorkload).click();
    /* eslint-disable-next-line cypress/no-unnecessary-waiting */
    cy.wait(15000);
  },
};

// export const addGitWorkload = (
//   gitUrl: string = 'https://github.com/sclorg/nodejs-ex.git',
//   componentName: string = 'nodejs-ex-git',
//   resourceType: string = 'Deployment',
// ) => {
//   gitPage.enterGitUrl(gitUrl);
//   gitPage.verifyValidatedMessage(gitUrl);
//   gitPage.enterComponentName(componentName);
//   gitPage.selectResource(resourceType);
//   createForm.clickCreate();
//   app.waitForLoad();
// };

export const topologyListPage = {
  clickOnApplicationGroupings: (appName: string) => {
    const id = `[data-test="group:${appName}"]`;
    cy.get(id).click({ force: true });
  },
};

export const topologySidePane = {
  verify: () => cy.get(topologyPO.sidePane.dialog).should('be.visible'),
  verifyTitle: (nodeName: string) =>
    cy.get(topologyPO.sidePane.title).should('contain', nodeName),
  verifySelectedTab: (tabName: string) =>
    cy
      .get(topologyPO.sidePane.tabName)
      .contains(tabName)
      .parent('li')
      .should('have.class', 'co-m-horizontal-nav-item--active'),
  verifyTab: (tabName: string) =>
    cy.get(topologyPO.sidePane.tabName).contains(tabName).should('be.visible'),
  verifySection: (sectionTitle: string) => {
    cy.get(topologyPO.sidePane.dialog).within(() => {
      cy.contains(topologyPO.sidePane.sectionTitle, sectionTitle).should(
        'be.visible',
      );
    });
  },
  // verifyActions: (...actions: string[]) => {
  //   cy.byLegacyTestID('action-items')
  //     .find('li')
  //     .each(($el) => {
  //       expect(actions).toContain($el.text());
  //     });
  // },
  // close: () => cy.get(topologyPO.sidePane.close).scrollIntoView().click(),
  clickStartLastRun: () => {
    cy.get(topologyPO.sidePane.resourcesTab.startLastRun)
      .should('be.enabled')
      .click();
  },
  verifyPipelineRuns: () => {
    cy.get(topologyPO.sidePane.resourcesTab.pipelineRuns).should('be.visible');
  },
};

export const editAnnotations = {
  add: () => cy.byTestID('add-button').click(),
  enterKey: (key: string) => {
    cy.byTestID('pairs-list-name').last().type(key);
  },
  enterValue: (value: string) =>
    cy.byTestID('pairs-list-value').last().type(value),
  removeAnnotation: (annotationKey: string) => {
    cy.byTestID('pairs-list-name').each(($el, index) => {
      if ($el.prop('value').includes(annotationKey)) {
        cy.get('button[data-test="delete-button"]').eq(index).click();
      }
    });
  },
};
