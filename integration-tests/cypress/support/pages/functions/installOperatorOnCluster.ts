import { modal } from '../../../../../tests/views/modal';
import { operators, switchPerspective } from '../../constants/global';
import { pageTitle } from '../../constants/pageTitle';
import { pipelineBuilderPO } from '../../page-objects';
import { operatorsPO } from '../../page-objects/operators-po';
import { topologyPO } from '../../page-objects/topology-po';
import { app, perspective, projectNameSpace, sidePane } from '../app';
import { operatorsPage } from '../operators-page';
import { pipelinesPage } from '../pipelines/pipelines-page';
import {
  createKnativeEventing,
  createKnativeKafka,
  createKnativeServing,
} from './knativeSubscriptions';

export const installOperator = (operatorName: operators) => {
  operatorsPage.navigateToOperatorHubPage();
  operatorsPage.searchOperator(operatorName);
  operatorsPage.selectOperator(operatorName);
  cy.get('body').then(($body) => {
    if ($body.text().includes('Show community Operator')) {
      cy.log('Installing community operator');
      modal.submit();
      modal.shouldBeClosed();
    }
  });
  operatorsPage.verifySidePane();
  cy.get(operatorsPO.alertDialog).then(($sidePane) => {
    if ($sidePane.find(operatorsPO.sidePane.install).length) {
      cy.get(operatorsPO.sidePane.install).click({ force: true });
      cy.get(operatorsPO.installOperators.title).should(
        'contain.text',
        pageTitle.InstallOperator,
      );
      cy.get(operatorsPO.operatorHub.install).click();
      cy.get(operatorsPO.operatorHub.installingOperatorModal).should(
        'be.visible',
      );
      app.waitForLoad();

      // workaround for https://bugzilla.redhat.com/show_bug.cgi?id=2059865
      const waitForResult = (tries = 10) => {
        if (tries < 1) {
          return;
        }
        /* eslint-disable-next-line cypress/no-unnecessary-waiting */
        cy.wait(2000);
        cy.get('body').then((body) => {
          if (body.find(`[data-test="success-icon"]`).length > 0) {
            cy.byTestID('success-icon').should('be.visible');
          } else if (body.find('[class*="alert"]').length > 0) {
            cy.log(
              'Installation flow interrupted, check the Installed Operators page for status',
            );
            operatorsPage.navigateToInstallOperatorsPage();
            operatorsPage.searchOperatorInInstallPage(operatorName);
            cy.contains('Succeeded', { timeout: 300000 });
          } else {
            waitForResult(tries - 1);
          }
        });
      };
      waitForResult();
    } else {
      cy.log(`${operatorName} Operator is already installed`);
      sidePane.operatorClose();
    }
    operatorsPage.navigateToInstallOperatorsPage();
    operatorsPage.verifyInstalledOperator(operatorName);
  });
};

// Conditional wait (recursive).
// Installs operator if it's not installed.
// Needs to be done this way, beacuse the operators list is not updated quickly enough after filtering.
const installIfNotInstalled = (
  operator: operators,
  tries = 4,
  polling = 500,
) => {
  if (tries === 0) {
    cy.log(`Operator ${operator} is already installed.`);
    return;
  }
  cy.get('body', {
    timeout: 50000,
  }).then(($ele) => {
    if ($ele.find(operatorsPO.installOperators.noOperatorsFound).length) {
      cy.log(`Operator ${operator} was not yet installed.`);
      installOperator(operator);
    } else {
      // "No operators found" element was not found. Wait and try again.
      cy.wait(polling);
      installIfNotInstalled(operator, tries - 1, polling);
    }
  });
};

export const waitForCRDs = (operator: operators) => {
  cy.log(`Verify the CRD's for the "${operator}"`);
  operatorsPage.navigateToCustomResourceDefinitions();
  /* eslint-disable-next-line cypress/unsafe-to-chain-command */
  cy.byTestID('name-filter-input').clear().type('Pipeline');
  cy.get('tr[data-test-rows="resource-row"]', { timeout: 300000 }).should(
    'have.length.within',
    4,
    6,
  );
  cy.get('[data-test-id="TektonPipeline"]', { timeout: 80000 }).should(
    'be.visible',
  );
  cy.get('[data-test-id="PipelineRun"]', { timeout: 80000 }).should(
    'be.visible',
  );
  cy.get('[data-test-id="Pipeline"]', { timeout: 80000 }).should('be.visible');
};

const waitForPipelineTasks = (retries = 30) => {
  if (retries === 0) {
    return;
  }
  cy.contains('h1', 'Pipeline builder').should('be.visible');
  cy.byTestID('loading-indicator').should('not.exist');
  /* eslint-disable-next-line cypress/no-unnecessary-waiting */
  cy.wait(500);
  cy.get(pipelineBuilderPO.formView.switchToFormView).click();
  cy.get('body').then(($body) => {
    if ($body.find(`[data-id="pipeline-builder"]`).length === 0) {
      /* eslint-disable-next-line cypress/no-unnecessary-waiting */
      cy.wait(10000);
      cy.reload();
      waitForPipelineTasks(retries - 1);
    }
  });
  cy.get('[data-test="nav-pipelines"]')
    .parent()
    .within(() => {
      cy.get(operatorsPO.nav.link).contains('Overview');
    });
};

export const waitForDynamicPlugin = () => {
  operatorsPage.navigateToInstallOperatorsPage();
  operatorsPage.verifyInstalledOperator(operators.PipelinesOperator);
  cy.get('[data-test-operator-row="Red Hat OpenShift Pipelines"]')
    .should('be.visible')
    .click();
  cy.get('[data-test="edit-console-plugin"]', { timeout: 15000 }).then(
    (body) => {
      if (body.text().includes('Enabled')) {
        cy.log('console plugin enabled');
      } else {
        /* eslint-disable-next-line cypress/unsafe-to-chain-command */
        cy.byTestID('edit-console-plugin').contains('Disabled').click();
        /* eslint-disable-next-line cypress/unsafe-to-chain-command */
        cy.byLegacyTestID('modal-title')
          .contains('Console plugin enablement')
          .should('be.visible');
        cy.byTestID('Enable-radio-input').click();
        /* eslint-disable-next-line cypress/unsafe-to-chain-command */
        cy.get(topologyPO.graph.confirmModal).should('be.enabled').click();
        cy.byTestID('edit-console-plugin', { timeout: 15000 }).should(
          'contain',
          'Enabled',
        );
      }
    },
  );
  cy.reload();
  app.waitForDocumentLoad();
  cy.exec(`../scripts/install-results.sh`, {
    failOnNonZeroExit: false,
    timeout: 250000,
  }).then(function (result) {
    cy.log(result.stdout);
  });
  /* eslint-disable-next-line cypress/no-unnecessary-waiting */
  cy.wait(6000);
  cy.reload();
  app.waitForDocumentLoad();
};

const performPostInstallationSteps = (operator: operators): void => {
  switch (operator) {
    case operators.ServerlessOperator:
      cy.log(`Performing Serverless post installation steps`);
      createKnativeServing();
      createKnativeEventing();
      createKnativeKafka();
      operatorsPage.navigateToOperatorHubPage();
      break;
    case operators.PipelinesOperator:
      cy.log(`Performing Pipelines post-installation steps`);
      cy.request(
        'api/kubernetes/apis/operators.coreos.com/v1alpha1/namespaces/openshift-operators/subscriptions/openshift-pipelines-operator-rh',
      ).then((resp) => {
        expect(resp.status).to.equal(200);
      });
      waitForCRDs(operators.PipelinesOperator);
      waitForDynamicPlugin();
      cy.visit('/pipelines/ns/default');
      pipelinesPage.clickOnCreatePipeline();
      waitForPipelineTasks();
      break;
    default:
      cy.log(`Nothing to do in post-installation steps`);
  }
};

export const verifyAndInstallOperator = (
  operator: operators,
  namespace?: string,
) => {
  cy.log(`Installing operator: "${operator}"`);
  perspective.switchTo(switchPerspective.Administrator);
  operatorsPage.navigateToInstallOperatorsPage();
  if (namespace !== undefined) {
    projectNameSpace.selectProjectOrDoNothing(namespace);
  }
  operatorsPage.searchOperatorInInstallPage(operator);

  installIfNotInstalled(operator);
  performPostInstallationSteps(operator);
};

export const verifyAndInstallPipelinesOperator = () => {
  perspective.switchTo(switchPerspective.Administrator);
  verifyAndInstallOperator(operators.PipelinesOperator);
};

export const verifyAndInstallKnativeOperator = () => {
  perspective.switchTo(switchPerspective.Administrator);
  verifyAndInstallOperator(operators.ServerlessOperator);
};
