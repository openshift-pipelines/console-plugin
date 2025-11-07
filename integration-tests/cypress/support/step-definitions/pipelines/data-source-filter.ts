import { Given, Then, When } from '@badeball/cypress-cucumber-preprocessor';
import * as yamlEditor from '../../../../../tests/views/yaml-editor';
import { devNavigationMenu, pipelineTabs } from '../../constants';
import { app, navigateTo } from '../../pages/app';
import { pipelinesPage } from '../../pages/pipelines/pipelines-page';

Given(
  'user creates PipelineRun and TaskRun resources using YAML editor from {string}',
  (yamlLocation: string) => {
    cy.get('[data-test="import-yaml"]').click();
    cy.get('.yaml-editor').should('be.visible');
    cy.readFile(yamlLocation).then((yaml) => {
      yamlEditor.setEditorContent(yaml);
    });
    yamlEditor.clickSaveCreateButton();
    app.waitForLoad();
  },
);

When('user navigates to PipelineRun list page', () => {
  navigateTo(devNavigationMenu.Pipelines);
  pipelinesPage.selectTab(pipelineTabs.PipelineRuns);
});

When('user selects pipeline {string}', (pipeline: string) => {
  cy.get(`a[data-test-id=${pipeline}][data-test=${pipeline}]`)
    .contains(pipeline)
    .click();
});

When('user selects PipelineRun {string}', (pipelineRun: string) => {
  cy.get(`a[data-test-id=${pipelineRun}][data-test=${pipelineRun}]`)
    .contains(pipelineRun)
    .click();
});

When('user selects PipelineRuns tab', () => {
  cy.get('a[data-test-id="horizontal-link-PipelineRuns"]').click();
});

When('user selects TaskRuns tab', () => {
  cy.get('a[data-test-id="horizontal-link-TaskRuns"]').click();
});

When('user navigates to Pipelines list page', () => {
  navigateTo(devNavigationMenu.Pipelines);
  pipelinesPage.selectTab(pipelineTabs.Pipelines);
});

When('user clicks the filter dropdown', () => {
  cy.byLegacyTestID('filter-dropdown-toggle').within(() => {
    cy.get('button').click();
  });
});

Then('user is able to see Data Source filter group', () => {
  cy.get('#Data-source').should('be.visible');
});

When('user selects Archived data in Data Source filter group', () => {
  cy.get('#Data-source').should('be.visible');
  cy.get('label[data-test-row-filter="archived-data"]').click();
  cy.get('label[data-test-row-filter="cluster-data"]').click();
});

When('user deletes a PipelineRun', () => {
  cy.get('a[data-test-id="hello-goodbye-run"]').click();
  cy.get('button.pf-v5-c-menu-toggle').contains('Actions').click();
  cy.get('li[data-test="delete-pipelineRun"] button').click();
  cy.get('button[data-test="confirm-action"]').click();
  cy.get('button[data-test="confirm-action"]').should('not.exist');
  cy.reload();
  navigateTo(devNavigationMenu.Pipelines);
  pipelinesPage.selectTab(pipelineTabs.PipelineRuns);
});

Then('user is able to see count in Cluster data', () => {
  cy.get('label[data-test-row-filter="cluster-data"]')
    .find('span.pf-v5-c-badge.pf-m-read')
    .invoke('text')
    .then((text) => {
      const countValue = parseInt(text.trim(), 10);
      expect(countValue).to.be.greaterThan(0);
    });
});

Given('user navigates to TaskRun list page', () => {
  cy.get('body').then(($body) => {
    if ($body.text().includes('TaskRuns')) {
      cy.byTestID('draggable-pinned-resource-item')
        .contains('TaskRuns')
        .click();
    } else {
      cy.get('[data-test-id="search-header"]').click();
      cy.get('[aria-label="Options menu"]').click();
      cy.get('[placeholder="Select Resource"]')
        .should('be.visible')
        .type('TaskRun');
      cy.get('[data-filter-text="TRTaskRun"]').click();
      cy.get('.co-search-group__pin-toggle').should('be.visible').click();
      /* eslint-disable-next-line cypress/no-unnecessary-waiting */
      cy.wait(3000);
      cy.byTestID('draggable-pinned-resource-item')
        .contains('TaskRuns')
        .should('be.visible')
        .click();
    }
  });
});

Then('user is able to see count in Archived data', () => {
  cy.get('label[data-test-row-filter="archived-data"]')
    .find('span.pf-v5-c-badge.pf-m-read')
    .invoke('text')
    .then((text) => {
      const countValue = parseInt(text.trim(), 10);
      expect(countValue).to.be.greaterThan(0);
    });
});

Then('user is able to see no count in Cluster data', () => {
  cy.byLegacyTestID('filter-dropdown-toggle').within(() => {
    cy.get('button').click();
  });
  cy.get('label[data-test-row-filter="cluster-data"]')
    .find('span.pf-v5-c-badge.pf-m-read')
    .invoke('text')
    .then((text) => {
      const countValue = parseInt(text.trim(), 10);
      expect(countValue).to.be.equal(0);
    });
});

Then('user is able to see the list of Archived data', () => {
  cy.get('div.opp-pipeline-run-list__results-indicator')
    .should('have.length.greaterThan', 0)
    .each(($el) => {
      cy.wrap($el).should('be.visible');
    });
});

Given(
  'user created PAC repository and pipelinerun using {string}',
  (yamlLocation: string) => {
    cy.get('[data-test="import-yaml"]').click();
    cy.get('.yaml-editor').should('be.visible');
    cy.readFile(yamlLocation).then((yaml) => {
      yamlEditor.setEditorContent(yaml);
    });
    yamlEditor.clickSaveCreateButton();
    cy.exec(
      `oc apply -f ${'cypress/testData/repository-crd-testdata/pipelineRun.yaml'} -n ${'aut-pipelines'}`,
      {
        failOnNonZeroExit: false,
      },
    ).then(function (result) {
      cy.log(result.stdout);
    });
  },
);

Given('user is at repositories page', () => {
  navigateTo(devNavigationMenu.Pipelines);
  pipelinesPage.selectTab(pipelineTabs.Repositories);
});

When('user clicks on the repository {string}', (repoName: string) => {
  cy.byLegacyTestID(repoName).click();
});
