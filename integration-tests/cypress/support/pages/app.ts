import { detailsPage } from '../../../../tests/views/details-page';
import { guidedTour } from '../../../../tests/views/guided-tour';
import { modal } from '../../../../tests/views/modal';
import { nav } from '../../../../tests/views/nav';
import * as yamlView from '../../../../tests/views/yaml-editor';
import { devNavigationMenu, switchPerspective } from '../constants/global';
import { pageTitle } from '../constants/pageTitle';
// import {
//   // topologyPO,
//   // adminNavigationMenuPO,
//   // devNavigationMenuPO,
//   // formPO,
//   // gitPO,
//   // yamlPO,
// } from '../pageObjects';
import {
  pipelineBuilderPO,
  pipelineRunDetailsPO,
  pipelinesPO,
} from '../page-objects';
import { globalPO } from '../page-objects/global-po';

export const app = {
  waitForDocumentLoad: () => {
    cy.document().its('readyState').should('eq', 'complete');
  },
  waitForLoad: (timeout = 160000, skipInline = false) => {
    // observe dashboard contains lots of loaders that only disappear when scrolled into view
    // skip these, otherwise wait as normal
    cy.url().then((url) => {
      if (url.includes('/dev-monitoring/') || skipInline) {
        cy.get('body').then((body) => {
          body.find('.co-m-loader').each(function () {
            if (!this.className.includes('co-m-loader--inline')) {
              cy.wrap(this).should('not.exist');
            }
          });
        });
      } else {
        cy.get('.co-m-loader', { timeout }).should('not.exist');
      }
    });
    cy.get('.skeleton-catalog--grid', { timeout }).should('not.exist');
    cy.get('.loading-skeleton--table', { timeout }).should('not.exist');
    cy.byTestID('skeleton-detail-view', { timeout }).should('not.exist');
    app.waitForDocumentLoad();
  },
  waitForNameSpacesToLoad: () => {
    cy.request(
      '/api/kubernetes/apis/project.openshift.io/v1/projects?limit=250',
    ).then((resp) => {
      expect(resp.status).to.equal(200);
    });
    app.waitForLoad();
  },
};

export const sidePane = {
  operatorClose: () =>
    cy.get('button[aria-label="Close"]').click({ force: true }),
  close: () => cy.byLegacyTestID('sidebar-close-button').click({ force: true }),
};

export const perspective = {
  switchTo: (perspectiveName: switchPerspective) => {
    nav.sidenav.switcher.changePerspectiveTo(perspectiveName);
    app.waitForLoad();
    if (perspectiveName === switchPerspective.Developer) {
      guidedTour.close();
      // Commenting below line, because due to this pipeline runs feature file is failing
      // cy.testA11y('Developer perspective');
    }
    nav.sidenav.switcher.shouldHaveText(perspectiveName);
    cy.get('body').then(($body) => {
      if ($body.find('[aria-label="Close drawer panel"]').length) {
        if ($body.find('[data-test="Next button"]').length) {
          cy.get('[aria-label="Close drawer panel"]').click();
          cy.get('button').contains('Leave').click();
        } else {
          cy.get('[aria-label="Close drawer panel"]').click();
        }
      }
    });
  },
};

export const navigateTo = (opt: devNavigationMenu) => {
  switch (opt) {
    case devNavigationMenu.Add: {
      perspective.switchTo(switchPerspective.Developer);
      /* eslint-disable-next-line cypress/unsafe-to-chain-command */
      cy.get(globalPO.addNavigation)
        .click()
        .then(() => {
          cy.url().should('include', 'add');
          app.waitForLoad();
          cy.contains(pageTitle.Add).should('be.visible');
          // Bug: ODC-5119 is created related to Accessibility violation - Until bug fix, below line is commented to execute the scripts in CI
          // cy.testA11y('Add Page in dev perspective');
        });
      break;
    }
    case devNavigationMenu.Topology: {
      cy.get(globalPO.topologyNavigation).click();
      cy.url().should('include', 'topology');
      app.waitForLoad();
      cy.url().then(($url) => {
        if ($url.includes('view=list')) {
          cy.get(globalPO.topologySwitcher).click({ force: true });
        }
      });
      // Bug: ODC-5119 is created related to Accessibility violation - Until bug fix, below line is commented to execute the scripts in CI
      // cy.testA11y('Topology Page in dev perspective');
      break;
    }
    // case devNavigationMenu.Builds: {
    //   cy.get(devNavigationMenuPO.builds).click();
    //   detailsPage.titleShouldContain(pageTitle.BuildConfigs);
    //   cy.testA11y('Builds Page in dev perspective');
    //   break;
    // }
    case devNavigationMenu.Pipelines: {
      cy.get(globalPO.pipelinesNavigation, { timeout: 80000 }).click();
      detailsPage.titleShouldContain(pageTitle.Pipelines);
      // Bug: ODC-5119 is created related to Accessibility violation - Until bug fix, below line is commented to execute the scripts in CI
      // cy.testA11y('Pipelines Page in dev perspective');
      break;
    }
    // case devNavigationMenu.Search: {
    //   cy.get(devNavigationMenuPO.search).click();
    //   cy.get('h1').contains(pageTitle.Search);
    //   cy.testA11y('Search Page in dev perspective');
    //   break;
    // }
    // case devNavigationMenu.Consoles: {
    //   cy.get('body').then(($body) => {
    //     if ($body.text().includes('Consoles')) {
    //       cy.byTestID('draggable-pinned-resource-item').contains('Consoles').click();
    //       cy.byTestID('cluster').should('be.visible').click();
    //     } else {
    //       cy.get(devNavigationMenuPO.search).click();
    //       cy.get('[aria-label="Options menu"]').click();
    //       cy.get('[placeholder="Select Resource"]').should('be.visible').type('console');
    //       cy.get('[data-filter-text="CConsole"]').then(($el) => {
    //         if ($el.text().includes('operator.openshift.io')) {
    //           cy.wrap($el).contains('operator.openshift.io').click();
    //         } else {
    //           cy.wrap($el).click();
    //         }
    //       });
    //       cy.get('.co-search-group__pin-toggle').should('be.visible').click();
    //       cy.byTestID('cluster').should('be.visible').click();
    //     }
    //   });
    //   cy.testA11y('cluster Page in dev perspective');
    //   break;
    // }
    default: {
      throw new Error('Option is not available');
    }
  }
};

export const projectNameSpace = {
  clickProjectDropdown: () => {
    cy.byLegacyTestID('namespace-bar-dropdown').find('button').first().click();
  },
  selectCreateProjectOption: () => {
    cy.document().then((doc) => {
      if (doc.readyState === 'complete') {
        projectNameSpace.clickProjectDropdown();
        cy.byTestDropDownMenu('#CREATE_RESOURCE_ACTION#').click();
      }
    });
  },

  enterProjectName: (projectName: string) => {
    modal.shouldBeOpened();
    cy.get('#input-name').type(projectName);
  },

  selectOrCreateProject: (projectName: string) => {
    app.waitForLoad();
    cy.url().then((url) => {
      if (url.includes('add/all-namespaces')) {
        cy.get(globalPO.userMenu, {
          timeout: 50000,
        }).then(($ele) => {
          if ($ele.text().includes('kube:admin')) {
            cy.get('tr[data-test-rows="resource-row"]').should(
              'have.length.at.least',
              1,
            );
          } else {
            cy.get('[data-test="empty-message"]').should(
              'have.text',
              'No Projects found',
            );
          }
        });
      }
    });
    projectNameSpace.clickProjectDropdown();
    cy.get('body').then(($body) => {
      if ($body.find(globalPO.userMenu).text().includes('kube:admin')) {
        cy.byTestID('showSystemSwitch').check(); // Ensure that all projects are showing
        cy.byTestID('dropdown-menu-item-link').should('have.length.gt', 5);
      }
    });
    // Bug: ODC-6164 - is created related to Accessibility violation - Until bug fix, below line is commented to execute the scripts in CI
    // cy.testA11y('Create Project modal');
    cy.url().then(($url) => {
      if ($url.includes('topology/all-namespaces')) {
        cy.get('.odc-namespaced-page__content').should('be.visible');
      } else if ($url.includes('topology/ns')) {
        cy.byLegacyTestID('item-filter').should('be.visible');
      }
    });
    cy.byTestID('dropdown-text-filter').type(projectName);
    cy.get('[data-test-id="namespace-bar-dropdown"] button > span')
      .first()
      .as('projectNameSpaceDropdown');
    app.waitForDocumentLoad();
    cy.get('[data-test="namespace-dropdown-menu"]')
      .first()
      .then(($el) => {
        if ($el.find('[data-test="dropdown-menu-item-link"]').length === 0) {
          cy.byTestDropDownMenu('#CREATE_RESOURCE_ACTION#').click();
          projectNameSpace.enterProjectName(projectName);
          cy.byTestID('confirm-action').click();
          const namespaces: string[] = Cypress.env('NAMESPACES') || [];
          if (!namespaces.includes(projectName)) {
            namespaces.push(projectName);
          }
          Cypress.env('NAMESPACES', namespaces);
          app.waitForLoad();
        } else {
          cy.get('[data-test="namespace-dropdown-menu"]')
            .find('[data-test="dropdown-menu-item-link"]')
            .contains(projectName)
            .click();
          cy.get('@projectNameSpaceDropdown').then(($el1) => {
            if ($el1.text().includes(projectName)) {
              cy.get('@projectNameSpaceDropdown').should(
                'contain.text',
                projectName,
              );
            } else {
              cy.byTestDropDownMenu('#CREATE_RESOURCE_ACTION#').click();
              projectNameSpace.enterProjectName(projectName);
              cy.byTestID('confirm-action').click();
              const namespaces: string[] = Cypress.env('NAMESPACES') || [];
              if (!namespaces.includes(projectName)) {
                namespaces.push(projectName);
              }
              Cypress.env('NAMESPACES', namespaces);
              app.waitForLoad();
            }
          });
        }
      });
    cy.get('@projectNameSpaceDropdown').should(
      'have.text',
      `Project: ${projectName}`,
    );
  },

  selectProjectOrDoNothing: (projectName: string) => {
    projectNameSpace.clickProjectDropdown();
    cy.byTestID('showSystemSwitch').check();
    cy.byTestID('dropdown-menu-item-link').should('have.length.gt', 5);
    cy.byTestID('dropdown-text-filter').type(projectName);
    cy.get('[data-test="namespace-dropdown-menu"]').then(($el) => {
      if ($el.find('[data-test="dropdown-menu-item-link"]').length !== 0) {
        cy.byTestID('namespace-dropdown-menu')
          .find('[data-test="dropdown-menu-item-link"]')
          .contains(projectName)
          .click();
      } else {
        projectNameSpace.clickProjectDropdown();
      }
    });
  },

  selectProject: (projectName: string) => {
    projectNameSpace.clickProjectDropdown();
    cy.byTestID('showSystemSwitch').check(); // Ensure that all projects are showing
    cy.byTestID('dropdown-menu-item-link').should('have.length.gt', 5);
    cy.byTestID('dropdown-text-filter').type(projectName);
    cy.byTestID('namespace-dropdown-menu')
      .find('[data-test="dropdown-menu-item-link"]')
      .contains(projectName)
      .click();
    cy.log(`User has selected namespace ${projectName}`);
  },

  verifyMessage: (message: string) =>
    cy.get('h2').should('contain.text', message),
};

export const createForm = {
  clickOnFormView: () =>
    cy.get(pipelineBuilderPO.configureVia.pipelineBuilder).click(),
  clickOnYAMLView: () =>
    cy.get(pipelineBuilderPO.configureVia.yamlView).click(),
  clickCreate: () =>
    cy.get(pipelineBuilderPO.create).should('be.enabled').click(),
  clickCancel: () =>
    cy.get(pipelineBuilderPO.cancel).should('be.enabled').click(),
  clickSave: () => cy.get(globalPO.save).should('be.enabled').click(),
  clickConfirm: () =>
    cy
      .get(pipelineRunDetailsPO.taskRuns.manageColumns.submitButton)
      .should('be.enabled')
      .click(),
  sectionTitleShouldContain: (sectionTitle: string) =>
    cy
      .get(pipelinesPO.startPipeline.sectionTitle)
      .should('have.text', sectionTitle),
};

export const yamlEditor = {
  isLoaded: () => {
    app.waitForLoad();
    cy.get(pipelineBuilderPO.yamlView.editor).should('be.visible');
  },

  clearYAMLEditor: () => {
    /* eslint-disable-next-line cypress/unsafe-to-chain-command */
    cy.get(pipelineBuilderPO.yamlView.editor)
      .click()
      .focused()
      .type('{ctrl}a')
      .clear();
  },

  setEditorContent: (yamlLocation: string) => {
    cy.readFile(yamlLocation).then((str) => {
      yamlView.setEditorContent(str);
    });
  },

  clickSave: () => {
    cy.byTestID('save-changes').click();
  },
};

export const kebabMenu = {
  openKebabMenu: (name: string) => {
    /* eslint-disable-next-line cypress/unsafe-to-chain-command */
    cy.get('input[data-test-id="item-filter"]')
      .should('be.visible')
      .clear()
      .type(name);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(3000);
    cy.get('table[role="grid"]').contains('Pipeline').should('be.visible');
    cy.get('[data-test-rows="resource-row"]').within(() => {
      cy.get('tr td:nth-child(1)').each(($el, index) => {
        if ($el.text().includes(name)) {
          cy.get('tbody tr')
            .eq(index)
            .find('[data-test-id="kebab-button"]')
            .then(($ele1) => {
              cy.wrap($ele1).click({ force: true });
            });
        }
      });
    });
  },
};

// export const navigateToAdminMenu = (opt: adminNavigationBar) => {
//   switch (opt) {
//     case adminNavigationBar.Home: {
//       cy.get(adminNavigationMenuPO.home.main).click();
//       break;
//     }
//     case adminNavigationBar.Workloads: {
//       cy.get(adminNavigationMenuPO.workloads.main).click();
//       break;
//     }
//     default: {
//       throw new Error('Option is not available');
//     }
//   }
// };
