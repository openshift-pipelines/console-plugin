/* eslint-disable cypress/no-unnecessary-waiting */
import { Given, Then, When } from '@badeball/cypress-cucumber-preprocessor';
import { switchPerspective } from '../../constants/global';
import {
  pipelineBuilderPO,
  pipelineDetailsPO,
} from '../../page-objects/pipelines-po';
import { pipelineDetailsPage, pipelineRunDetailsPage } from '../../pages';
import { perspective } from '../../pages/app';
import { actionsDropdownMenu } from '../../pages/functions/common';
import { tasksPage } from '../../pages/pipelines/task-page';

Given('user is at Administrator perspective', () => {
  perspective.switchTo(switchPerspective.Administrator);
});

Given('user selects {string} in Project dropdown', (projectName: string) => {
  cy.get('[class="project-dropdown-label"]')
    .parent()
    .within(($el) => {
      cy.get('[class$="menu-toggle"]').click();
      cy.get('[class*="pipeline-overview__variable-dropdown"]').should(
        'be.visible',
      );
      cy.get('[role="menuitem"]').contains(projectName).click();
      cy.get('[class$="menu-toggle"]').should('contain.text', projectName);
    });
});

When('user selects {string} in Time Range', (range: string) => {
  cy.get('[class="form-group"]')
    .contains('Time Range')
    .parent()
    .within(($el) => {
      cy.get('[class$="menu-toggle"]').click();
      cy.get('[class*="pipeline-overview__variable-dropdown"]').should(
        'be.visible',
      );
      cy.get('[role="menuitem"]').contains(range).click();
      cy.get('[class$="menu-toggle"]').should('contain.text', range);
    });
});

When('user selects {string} in Refresh Interval', (interval: string) => {
  cy.get('[class="form-group"]')
    .contains('Refresh Interval')
    .parent()
    .within(($el) => {
      cy.get('[class*="pipeline-overview__dropdown-button"]').click();
      cy.get('[class*="pipeline-overview__variable-dropdown"]').should(
        'be.visible',
      );
      cy.get('[role="menuitem"]').contains(interval).click();
      cy.get('[class*="pipeline-overview__dropdown-button"]').should(
        'contain.text',
        interval,
      );
    });
});

When(
  'user can see PipelineRun status, Duration, Total runs, Number of PipelineRuns charts',
  () => {
    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.get('[class*="pipeline-overview__pipelinerun-status-card__title"]')
      .contains('PipelineRun status')
      .scrollIntoView()
      .should('be.visible');
    cy.get('[class*="pipelines-overview__cards"]')
      .contains('Duration')
      .should('be.visible');
    cy.get('[class*="pipelines-overview__cards"]')
      .contains('Total runs')
      .should('be.visible');
    cy.get('[class*="pipelines-overview__cards"]')
      .contains('Number of PipelineRuns')
      .should('be.visible');
  },
);

When(
  'user clicks on Pipeline {string} in pipeline overview table',
  (name: string) => {
    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.get('input[aria-label="Search input"]').focus().clear().type(name);
    cy.wait(5000);
    cy.get(`[data-test="${name}"]`).click();
  },
);

When(
  'user clicks on Total Pipelineruns number of {string} in pipeline overview table',
  (value: string) => {
    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.get('input[aria-label="Search input"]').focus().clear().type(value);
    cy.wait(5000);
    // pipelinesPage.search(value);
    cy.get('tr[data-test-rows="resource-row"] td>a').click({ force: true });
  },
);

Then(
  'user will be redirected to Pipeline Details page with header name {string}',
  (pipelineName: string) => {
    pipelineDetailsPage.verifyTitle(pipelineName);
  },
);

Then('page will be redirected to pipeline Run details page', () => {
  pipelineRunDetailsPage.verifyTitle();
});

Then(
  'user will be redirected to Pipeline Details page with pipeline run tab',
  () => {
    cy.get(pipelineDetailsPO.pipelineRunsTab).should('be.visible');
    cy.url().should('include', 'Runs');
  },
);

When(
  'pipeline named {string} is available with pipeline run',
  (pipelineName: string) => {
    tasksPage.togglePipelineSidebar();
    tasksPage.openPipelinePage();
    tasksPage.togglePipelineSidebar();
    tasksPage.clickOnCreatePipeline();
    cy.get(pipelineBuilderPO.formView.switchToFormView).click();
    /* eslint-disable-next-line cypress/unsafe-to-chain-command */
    cy.get(pipelineBuilderPO.formView.name).clear().type(pipelineName);
    cy.byTestID('task-list').click();
    cy.get(pipelineBuilderPO.formView.quickSearch).type('kn');
    cy.byTestID('task-cta').click();
    cy.get(pipelineBuilderPO.create).click();
    actionsDropdownMenu.selectAction('Start');
    cy.get('[data-test="breadcrumb-link"]').click();
  },
);

When('user clicks on Pipelines Tab', () => {
  cy.get('[data-test="nav-pipelines"]').then(($el) => {
    if ($el.attr('aria-expanded') === 'false') {
      cy.wrap($el).click();
    }
  });
  cy.get('[data-test="nav"][data-quickstart-id="qs-nav-pipelines"]')
    .contains('Pipelines')
    .click();
});

Given('user is at pipelines overview page', () => {
  cy.get('[data-test="nav-pipelines"]').then(($el) => {
    if ($el.attr('aria-expanded') === 'false') {
      cy.wrap($el).click();
    }
  });
  cy.get('[data-test="nav"][href*="pipelines-overview"]')
    .contains('Overview')
    .click({ force: true });
});
