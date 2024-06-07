import { verifyAndInstallPipelinesOperator } from '../pages/functions/installOperatorOnCluster';
import { checkErrors } from './support/index';

before(() => {
  cy.login();
  cy.document().its('readyState').should('eq', 'complete');
  verifyAndInstallPipelinesOperator();
});

after(() => {
  const namespaces: string[] = Cypress.env('NAMESPACES') || [];
  cy.log(`Deleting "${namespaces.join(' ')}" namespace`);
  cy.exec(`oc delete namespace ${namespaces.join(' ')}`, {
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
