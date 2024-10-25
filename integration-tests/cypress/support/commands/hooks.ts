import { checkErrors } from '../../../../tests/support/index';
import { checkDeveloperPerspective } from '../../../../tests/views/checkDeveloperPerspective';
// import { verifyAndInstallPipelinesOperator } from '../pages/functions/installOperatorOnCluster';
import { installPipelinesOperatorUsingCLI } from '../pages/functions/installOperatorOnClusterUsingCLI';

before(() => {
  cy.login();
  cy.document().its('readyState').should('eq', 'complete');
  // verifyAndInstallPipelinesOperator();
  installPipelinesOperatorUsingCLI();
  checkDeveloperPerspective();
});

after(() => {
  const namespaces: string[] = Cypress.env('NAMESPACE') || [];
  cy.log(`Deleting "${namespaces}" namespace`);
  cy.exec(`oc delete namespace ${namespaces}`, {
    failOnNonZeroExit: false,
    timeout: 200000,
  });
});

beforeEach(() => {
  cy.initDeveloper();
});

afterEach(() => {
  checkErrors();
});
