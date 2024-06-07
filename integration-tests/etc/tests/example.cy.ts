import { checkErrors } from '../support';

export const isLocalDevEnvironment =
  Cypress.config('baseUrl').includes('localhost');

describe('example', () => {
  before(() => {
    if (!isLocalDevEnvironment) {
      cy.login();
    }
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    if (!isLocalDevEnvironment) {
      cy.logout();
    }
  });

  it('Verify the example page title', () => {
    cy.visit(`/`);
    // For now, just check that the perspective switcher is visible
    cy.get('[data-test-id="perspective-switcher-toggle"]').click();
  });
});
