import { detailsPage } from '../../../../../tests/views/details-page';
import { guidedTour } from '../../../../../tests/views/guided-tour';
import { modal } from '../../../../../tests/views/modal';
import * as yamlEditor from '../../../../../tests/views/yaml-editor';
import { pageTitle } from '../../constants/pageTitle';
import { pipelineActions, pipelineTabs } from '../../constants/pipelines';
import {
  pipelineBuilderPO,
  pipelinesPO,
} from '../../page-objects/pipelines-po';
import { app } from '../app';

export const pipelinesPage = {
  clickOnCreatePipeline: (retry = 3) => {
    detailsPage.titleShouldContain(pageTitle.Pipelines);
    app.waitForLoad();
    cy.get('button');
    cy.get('body').then(($body) => {
      if ($body.find(pipelinesPO.createPipeline).length > 0) {
        cy.get(pipelinesPO.createPipeline).click();
      } else if ($body.find(`[data-test="item-create"]`).length === 0) {
        cy.reload();
        app.waitForDocumentLoad();
        guidedTour.close();
        pipelinesPage.clickOnCreatePipeline(retry - 1);
      } else {
        cy.contains(`[data-test="item-create"]`, 'Create').click();
        cy.get(pipelineBuilderPO.pipeline).click();
      }
    });
  },

  clickCreateRepository: () => {
    detailsPage.titleShouldContain(pageTitle.Pipelines);
    app.waitForLoad();
    cy.get('body').then(($body) => {
      if ($body.find('[data-test="item-create"]').length !== 0) {
        cy.contains('[data-test="item-create"]', 'Create').click();
        cy.get(pipelineBuilderPO.repository).click();
      } else {
        cy.get(pipelinesPO.createPipeline).click();
      }
    });
  },

  selectTab: (tabName: pipelineTabs) => {
    switch (tabName) {
      case pipelineTabs.Pipelines:
        cy.byLegacyTestID('horizontal-link-Pipelines').click();
        break;
      case pipelineTabs.PipelineRuns:
        cy.byLegacyTestID('horizontal-link-PipelineRuns').click();
        break;
      case pipelineTabs.Repositories:
        cy.byLegacyTestID('horizontal-link-Repositories').click();
        break;
      default:
        throw new Error('Given tab is not available');
    }
  },

  verifySelectedTab: (tabName: pipelineTabs) => {
    cy.get(
      '.co-m-horizontal-nav__menu-item.co-m-horizontal-nav-item--active > a',
    ).should('have.text', tabName);
  },

  selectKebabMenu: (pipelineName: string) => {
    cy.get(pipelinesPO.pipelinesTable.table).within(() => {
      cy.get(pipelinesPO.pipelinesTable.pipelineName).each(($el, index) => {
        if ($el.text().includes(pipelineName)) {
          cy.get('tbody tr')
            .eq(index)
            .find(pipelinesPO.pipelinesTable.kebabMenu)
            .click({ force: true });
        }
      });
    });
    cy.get('[role="menu"]').should('be.visible');
  },

  selectActionForPipeline: (
    pipelineName: string,
    action: string | pipelineActions,
  ) => {
    app.waitForDocumentLoad();
    cy.get('[data-label="Name"] [type="button"] svg').click({ force: true });
    cy.get(pipelinesPO.pipelinesTable.table).within(() => {
      cy.get(pipelinesPO.pipelinesTable.pipelineName).each(($el, index) => {
        /* eslint-disable-next-line cypress/no-unnecessary-waiting */
        cy.wait(1000);
        if ($el.text().includes(pipelineName)) {
          cy.get('tbody tr')
            .eq(index)
            .within(() => {
              cy.get(`button${pipelinesPO.pipelinesTable.kebabMenu}`)
                .should('be.visible')
                .click({ force: true });
            });
        }
      });
    });
    // cy.byLegacyTestID('action-items').should('be.visible');
    cy.get('ul[role="menu"]').should('be.visible');
    switch (action) {
      case 'Start': {
        cy.get('[data-test-action="start-pipeline"] button[role="menuitem"]')
          .should('be.visible')
          .click({ force: true });
        break;
      }
      case 'Start last run': {
        cy.get('[data-test-action="start-last-run"] button[role="menuitem"]')
          .should('be.visible')
          .click({ force: true });
        break;
      }
      case 'Add Trigger': {
        cy.get('[data-test-action="add-trigger"] button[role="menuitem"]')
          .should('be.visible')
          .click({ force: true });
        break;
      }
      case 'Remove Trigger': {
        cy.get('[data-test-action="remove-trigger"] button[role="menuitem"]')
          .should('be.visible')
          .click({ force: true });
        break;
      }
      case 'Edit labels': {
        cy.get('[data-test-action="edit-labels"] button[role="menuitem"]')
          .should('be.visible')
          .click({ force: true });
        break;
      }
      case 'Edit annotations': {
        cy.get('[data-test-action="edit-annotations"] button[role="menuitem"]')
          .should('be.visible')
          .click({ force: true });
        break;
      }
      case 'Edit Pipeline': {
        cy.get('[data-test-action="edit"] button[role="menuitem"]')
          .should('be.visible')
          .click({ force: true });
        break;
      }
      case 'Delete Pipeline': {
        cy.get('[data-test-action="delete"] button[role="menuitem"]')
          .should('be.visible')
          .click({ force: true });
        break;
      }
      default: {
        throw new Error('action is not available');
      }
    }
  },

  verifyDefaultPipelineColumnValues: (defaultValue = '-') => {
    cy.get(pipelinesPO.pipelinesTable.columnValues).as('colValues');
    cy.get('@colValues').eq(1).should('have.text', defaultValue);
    cy.get('@colValues').eq(2).should('have.text', defaultValue);
    cy.get('@colValues').eq(3).should('have.text', defaultValue);
    cy.get('@colValues').eq(4).should('have.text', defaultValue);
  },

  selectAction: (action: pipelineActions) => {
    switch (action) {
      case pipelineActions.Start: {
        cy.byTestActionID(pipelineActions.Start).click();
        cy.get('[data-test-section-heading="Pipeline Run Details"]').should(
          'be.visible',
        );
        break;
      }
      case pipelineActions.AddTrigger: {
        cy.byTestActionID(pipelineActions.AddTrigger).click();
        cy.get('form').should('be.visible');
        modal.modalTitleShouldContain('Add Trigger');
        break;
      }
      case pipelineActions.EditLabels: {
        cy.byTestActionID(pipelineActions.EditLabels).click();
        cy.get('form').should('be.visible');
        modal.modalTitleShouldContain('Labels');
        break;
      }
      case pipelineActions.EditAnnotations: {
        cy.byTestActionID(pipelineActions.EditAnnotations).click();
        cy.get('form').should('be.visible');
        modal.modalTitleShouldContain('Edit Annotations');
        break;
      }
      case pipelineActions.EditPipeline: {
        cy.byTestActionID(pipelineActions.EditPipeline).click();
        cy.get('h1.odc-pipeline-builder-header__title').should(
          'contain.text',
          'Pipeline Builder',
        );
        break;
      }
      case pipelineActions.DeletePipeline: {
        cy.byTestActionID(pipelineActions.DeletePipeline).click();
        cy.get('form').should('be.visible');
        modal.modalTitleShouldContain('Delete Pipeline?');
        break;
      }
      case pipelineActions.EditRepository: {
        cy.byTestActionID(pipelineActions.EditRepository).click();
        cy.contains('Repository details').should('be.visible');
        break;
      }
      case pipelineActions.DeleteRepository: {
        cy.byTestActionID(pipelineActions.DeleteRepository).click();
        modal.modalTitleShouldContain('Delete Repository?');
        cy.contains('Repository details').should('be.visible');
        break;
      }
      default: {
        throw new Error('operator is not available');
      }
    }
  },

  search: (name: string) => {
    /* eslint-disable-next-line cypress/unsafe-to-chain-command */
    cy.get(pipelinesPO.search).should('be.visible').clear().type(name);
    cy.get(pipelinesPO.pipelinesTable.pipelineName).each(($el, index) => {
      if ($el.text().includes(name)) {
        cy.get('tbody tr')
          .eq(index)
          .within(() => {
            cy.get(`button${pipelinesPO.pipelinesTable.kebabMenu}`)
              .should('be.visible')
              .click({ force: true });
          });
      }
      cy.byLegacyTestID(name);
    });
    // .eq(0)
    // .within(() => {
    // cy.byLegacyTestID(name);
    // });
    cy.get(pipelinesPO.pipelinesTable.table).should('be.visible');
  },

  clearYAMLEditor: () => {
    /* eslint-disable-next-line cypress/unsafe-to-chain-command */
    cy.get(pipelineBuilderPO.yamlView.yamlEditor)
      .click()
      .focused()
      .type('{ctrl}a')
      .clear();
  },

  setEditorContent: (yamlLocation: string) => {
    cy.readFile(yamlLocation).then((str) => {
      yamlEditor.setEditorContent(str);
    });
  },

  selectPipeline: (pipelineName: string) =>
    cy.byLegacyTestID(pipelineName).click(),

  selectPipelineRun: (pipelineName: string) => {
    cy.get(pipelinesPO.pipelinesTable.table).should('exist');
    cy.get(pipelinesPO.pipelinesTable.pipelineName).each(($el, index) => {
      if ($el.text().includes(pipelineName)) {
        cy.get('tbody tr')
          .eq(index)
          .find('td')
          .eq(1)
          .find('a')
          .click({ force: true });
      }
    });
  },

  verifyPipelinesTableDisplay: () =>
    cy.get(pipelinesPO.pipelinesTable.table).should('be.visible'),

  verifyPipelineTableColumns: () => {
    cy.get(pipelinesPO.pipelinesTable.columnNames).each(($el) => {
      expect([
        'Name',
        'Last run',
        'Task status',
        'Last run status',
        'Last run time',
        '',
      ]).toContain($el.text());
    });
  },

  verifyCreateButtonIsEnabled: () =>
    cy.contains('button', 'Create').should('be.enabled'),

  verifyKebabMenu: () =>
    cy.get(pipelinesPO.pipelinesTable.kebabMenu).should('be.visible'),

  verifyNameInPipelinesTable: (pipelineName: string) => {
    /* eslint-disable-next-line cypress/unsafe-to-chain-command */
    cy.get(pipelinesPO.search).should('be.visible').clear().type(pipelineName);
    cy.get('[title="Pipeline"]')
      .next('a')
      .then(($el) => {
        expect($el.text()).toMatch(pipelineName);
      });
    // wait for the table to render after search
    // cy.get('tbody tr')
    // .eq(0)
    // .within(() => {
    cy.byLegacyTestID(pipelineName);
    // });
  },

  verifyNameSpaceInPipelinesTable: (namespace: string) => {
    cy.get('[title="Namespace"]')
      .next('a')
      .then(($el) => {
        expect($el.text()).toMatch(namespace);
      });
  },

  verifyLastRunStatusInPipelinesTable: (lastRunStatus: string) => {
    cy.get(pipelinesPO.pipelinesTable.lastRunStatus).should(
      'have.text',
      lastRunStatus,
    );
  },

  verifyOptionInKebabMenu: (option: string) => {
    cy.byTestActionID(option).should('be.visible');
  },

  addTrigger: (gitProviderType = 'github-pullreq') => {
    modal.modalTitleShouldContain('Add Trigger');
    cy.get(pipelinesPO.addTrigger.gitProviderType).click();
    cy.get(`[id$="${gitProviderType}-link"]`).click({ force: true });
    cy.get(pipelinesPO.addTrigger.add).click();
    modal.shouldBeClosed();
  },
};

export const startPipelineInPipelinesPage = {
  clickCancel: () => cy.byLegacyTestID('modal-cancel-action').click(),
  verifySections: () => {
    cy.get(pipelinesPO.startPipeline.sectionTitle).as('sectionTitle');
    cy.get('@sectionTitle').eq(0).should('have.text', 'Workspaces');
    cy.get('@sectionTitle').eq(1).should('have.text', 'Advanced options');
  },
  enterGitUrl: (gitUrl: string) => {
    cy.get(pipelinesPO.startPipeline.gitUrl).should('be.enabled').type(gitUrl);
  },
  verifyGitRepoUrlAndEnterGitUrl: (gitUrl: string) => {
    cy.get('.modal-content').then(($btn) => {
      if (
        $btn.find(pipelinesPO.startPipeline.gitResourceDropdown).length !== 0
      ) {
        startPipelineInPipelinesPage.enterGitUrl(gitUrl);
        // } else {
        // cy.get(pipelinesPO.startPipeline.gitResourceDropdown).select('Create Pipeline resource');
        // startPipelineInPipelinesPage.enterGitUrl(gitUrl);
      }
    });
  },
  selectConfigMap: (configMapValue: string) => {
    cy.selectByAutoCompleteDropDownText(
      pipelinesPO.startPipeline.workspaces.configMap,
      configMapValue,
    );
  },

  selectSecret: (secret: string) => {
    cy.selectByAutoCompleteDropDownText(
      pipelinesPO.startPipeline.workspaces.secret,
      secret,
    );
  },

  selectPVC: (pvc: string) => {
    cy.selectByAutoCompleteDropDownText(
      pipelinesPO.startPipeline.workspaces.pvc,
      pvc,
    );
  },

  enterRevision: (revision: string) => {
    cy.get(pipelinesPO.startPipeline.revision)
      .should('be.visible')
      .type(revision);
  },
  addGitResource: (gitUrl: string, revision = 'master') => {
    modal.shouldBeOpened();
    cy.get('form').within(() => {
      app.waitForLoad();
      // cy.get(pipelinesPO.startPipeline.gitResourceDropdown).then(($btn) => {
      //   if ($btn.attr('disabled')) {
      //     cy.log('Pipeline resource is not available, so adding a new git resource');
      //   } else {
      //     cy.get(pipelinesPO.startPipeline.gitResourceDropdown).select('Create Pipeline resource');
      //   }
      //   startPipelineInPipelinesPage.enterGitUrl(gitUrl);
      //   startPipelineInPipelinesPage.enterRevision(revision);
      // });
      cy.get('.modal-content').then(($btn) => {
        if (
          $btn.find(pipelinesPO.startPipeline.gitResourceDropdown).length !== 0
        ) {
          startPipelineInPipelinesPage.enterGitUrl(gitUrl);
          startPipelineInPipelinesPage.enterRevision(revision);
          // } else {
          // cy.get(pipelinesPO.startPipeline.gitResourceDropdown).select('Create Pipeline resource');
          // startPipelineInPipelinesPage.enterGitUrl(gitUrl);
        }
      });
    });
  },
  enterTimeoutValue: (value: string, time = 'min') => {
    modal.shouldBeOpened();
    cy.get('form').within(() => {
      app.waitForLoad();
      /* eslint-disable-next-line cypress/unsafe-to-chain-command */
      cy.get('input[id="timeout-input"]').clear().type(value);
      cy.get('button[aria-label="Number of Min"]').click();
      switch (time) {
        case 'hr':
        case 'Hr':
        case 'h':
          cy.byTestDropDownMenu('h').click();
          break;
        case 'min':
        case 'Min':
        case 'm':
          cy.byTestDropDownMenu('m').click();
          break;
        case 'sec':
        case 'Sec':
        case 's':
          cy.byTestDropDownMenu('s').click();
          break;
        default:
          break;
      }
    });
  },
  clickStart: () => cy.get(pipelinesPO.startPipeline.start).click(),
  clickShowCredentialOptions: () =>
    cy.byButtonText('Show credential options').click(),
  clickHideCredentialOptions: () =>
    cy.byButtonText('Hide credential options').click(),
  addSecret: (
    secretName: string,
    serverUrl: string,
    userName: string,
    password: string,
    provider = 'Git Server',
    authenticationType = 'Basic Authentication',
  ) => {
    cy.get(pipelinesPO.startPipeline.advancedOptions.secretName).type(
      secretName,
    );
    cy.selectByDropDownText(
      pipelinesPO.startPipeline.advancedOptions.accessTo,
      provider,
    );
    cy.get(pipelinesPO.startPipeline.advancedOptions.serverUrl).type(serverUrl);
    cy.selectByDropDownText(
      pipelinesPO.startPipeline.advancedOptions.authenticationType,
      authenticationType,
    );
    cy.get(pipelinesPO.startPipeline.advancedOptions.userName).type(userName);
    cy.get(pipelinesPO.startPipeline.advancedOptions.password).type(password);
    cy.get(pipelinesPO.startPipeline.advancedOptions.tickIcon).click();
    startPipelineInPipelinesPage.clickStart();
  },
  verifyCreateSourceSecretSection: () => {
    cy.get(pipelinesPO.startPipeline.advancedOptions.secretFormTitle).should(
      'be.visible',
    );
    // cy.testA11y('Secret source creation in Start Pipeline Modal');
  },
  verifyFields: () => {
    cy.get(pipelinesPO.startPipeline.secretForm).within(() => {
      /* eslint-disable-next-line cypress/unsafe-to-chain-command */
      cy.get(pipelinesPO.startPipeline.advancedOptions.secretName)
        .scrollIntoView()
        .should('be.visible');
      /* eslint-disable-next-line cypress/unsafe-to-chain-command */
      cy.get(pipelinesPO.startPipeline.advancedOptions.accessTo)
        .scrollIntoView()
        .should('be.visible');
      /* eslint-disable-next-line cypress/unsafe-to-chain-command */
      cy.get(pipelinesPO.startPipeline.advancedOptions.authenticationType)
        .scrollIntoView()
        .should('be.visible');
      /* eslint-disable-next-line cypress/unsafe-to-chain-command */
      cy.get(pipelinesPO.startPipeline.advancedOptions.serverUrl)
        .scrollIntoView()
        .should('be.visible');
    });
  },
  selectWorkSpace: (option: string) => {
    cy.get(pipelinesPO.startPipeline.sharedWorkspace).click();
    switch (option) {
      case 'Empty Directory':
        cy.byTestDropDownMenu('emptyDirectory').click();
        break;
      case 'Config Map':
        cy.byTestDropDownMenu('configMap').click();
        break;
      case 'Secret':
        cy.byTestDropDownMenu('secret').click();
        break;
      case 'PersistentVolumeClaim' || 'PVC':
        cy.byTestDropDownMenu('pvc').click();
        break;
      case 'VolumeClaimTemplate':
        cy.byTestDropDownMenu('volumeClaimTemplate').click();
        break;
      default:
        break;
    }
    cy.log(`user selected ${option} as workspace`);
  },

  selectView: (option: string) => {
    switch (option) {
      case 'Form View':
        cy.get(pipelineBuilderPO.formView.switchToFormView).click();
        break;
      case 'YAML View':
        cy.get(pipelineBuilderPO.yamlView.switchToYAMLView).click();
        break;
      default:
        break;
    }
  },
};
