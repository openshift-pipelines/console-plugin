import { checkErrors } from '../../../../tests/support/index';
import { verifyAndInstallPipelinesOperator } from '../pages/functions/installOperatorOnCluster';

before(() => {
  cy.login();
  cy.document().its('readyState').should('eq', 'complete');
  verifyAndInstallPipelinesOperator();
});

after(() => {
  const namespaces: string[] = Cypress.env('NAMESPACE') || [];
  cy.log(`Deleting "${namespaces}" namespace`);
  cy.exec(`oc delete namespace ${namespaces}`, {
    failOnNonZeroExit: false,
    timeout: 180000,
  });
});

beforeEach(() => {
  cy.initDeveloper();
});

afterEach(() => {
  checkErrors();
});
