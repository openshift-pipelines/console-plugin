import { Given, Then, When } from '@badeball/cypress-cucumber-preprocessor';
import { switchPerspective } from '../../constants/global';
import { perspective } from '../../pages/app';

Given('user is at Administrator perspective', () => {
  perspective.switchTo(switchPerspective.Administrator);
});

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

When(
  'user creates pipeline using YAML and CLI {string} in namespace {string}',
  (yamlFile: string, namespace: string) => {
    const fullPath = yamlFile.startsWith('cypress/')
      ? yamlFile
      : `cypress/${yamlFile}`;
    cy.exec(`oc apply -f ${fullPath} -n ${namespace}`, {
      failOnNonZeroExit: false,
    }).then((result) => {
      if (result.stderr) {
        throw new Error(result.stderr);
        /* cy.log('CLI failed, falling back to UI');
        cy.get('[data-test="item-create"]').click();
        cy.get('[data-test="list-page-create-dropdown-item-pipeline"]').click();
        cy.get('[data-test="yaml-view-input"]').click();
        cy.get('button').contains('Create').click();
        cy.log('Pipeline created via UI'); */
      }
    });
  },
);

Then(
  'pipeline {string} should be created successfully in namespace {string}',
  (pipelineName: string, namespace: string) => {
    cy.exec(`oc get pipeline ${pipelineName} -n ${namespace}`, {
      failOnNonZeroExit: false,
    }).then((result) => {
      if (result.code !== 0) {
        throw new Error(
          `Pipeline ${pipelineName} was not created successfully: ${result.stderr}`,
        );
      }
      cy.log(`Pipeline ${pipelineName} created successfully`);
    });
  },
);

When(
  'user creates pipeline run using YAML and CLI {string} in namespace {string}',
  (yamlFile: string, namespace: string) => {
    const fullPath = yamlFile.startsWith('cypress/')
      ? yamlFile
      : `cypress/${yamlFile}`;
    cy.exec(`oc apply -f ${fullPath} -n ${namespace}`, {
      failOnNonZeroExit: false,
    }).then((result) => {
      if (result.stderr) {
        throw new Error(result.stderr);
      }
    });
  },
);

Then(
  'pipeline run {string} should be created successfully in namespace {string}',
  (pipelineRunName: string, namespace: string) => {
    cy.exec(`oc get pipelinerun ${pipelineRunName} -n ${namespace}`);
    cy.exec(
      `oc wait --for=condition=Succeeded pipelinerun/${pipelineRunName} -n ${namespace} --timeout=300s`,
    );
  },
);

Given(
  'user is at pipeline run details page for {string} in namespace {string}',
  (pipelineRunName: string, namespace: string) => {
    cy.visit(
      `/k8s/ns/${namespace}/tekton.dev~v1~PipelineRun/${pipelineRunName}`,
    );
  },
);

When(
  'user navigates to Logs Tab for {string} in namespace {string}',
  (pipelineRunName: string, namespace: string) => {
    cy.visit(
      `/k8s/ns/${namespace}/tekton.dev~v1~PipelineRun/${pipelineRunName}/logs`,
    );
  },
);

Then('user should see {string} task in task list', (taskName: string) => {
  cy.get('[data-test-id="logs-tasklist"]')
    .contains(taskName)
    .should('be.visible');
});

Given(
  'user tries to navigate to task {string} and step {string} in Logs tab using URL for {string} in namespace {string}',
  (
    taskName: string,
    stepName: string,
    pipelineRunName: string,
    namespace: string,
  ) => {
    cy.visit(
      `/k8s/ns/${namespace}/tekton.dev~v1~PipelineRun/${pipelineRunName}/logs?taskName=${taskName}&step=${stepName}`,
    );
  },
);

Then(
  'user should see {string} step is visible in logs tab',
  (stepName: string) => {
    cy.contains(stepName).should('be.visible');
    cy.log(`${stepName} is visible in logs tab`);
    cy.visit('/');
  },
);

Then(
  'user should expect default behavior of log viewer and scroll to end of log',
  () => {
    cy.get('.pf-v5-c-log-viewer__scroll-container').then(($el) => {
      const el = $el[0];
      //eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(2000);
      // Verifying if the scroll is at the bottom
      expect(el.scrollHeight - el.scrollTop).to.be.closeTo(el.clientHeight, 1);
      cy.visit('/');
    });
  },
);
