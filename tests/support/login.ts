export {}; // needed in files which don't have an import to trigger ES6 module usage

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace,no-redeclare
  namespace Cypress {
    interface Chainable {
      login(
        provider?: string,
        username?: string,
        password?: string,
      ): Chainable<Element>;
      logout(): Chainable<Element>;
    }
  }
}

const KUBEADMIN_USERNAME = 'kubeadmin';
const KUBEADMIN_IDP = 'kube:admin';
const loginUsername = Cypress.env('BRIDGE_KUBEADMIN_PASSWORD')
  ? 'user-dropdown'
  : 'username';

// This will add 'cy.login(...)'
// ex: cy.login('my-user', 'my-password')
Cypress.Commands.add(
  'login',
  (
    provider: string = KUBEADMIN_IDP,
    username: string = KUBEADMIN_USERNAME,
    password: string = Cypress.env('BRIDGE_KUBEADMIN_PASSWORD'),
  ) => {
    // Check if auth is disabled (for a local development environment).
    cy.log(provider, username, password);
    cy.visit('/'); // visits baseUrl which is set in plugins/index.js
    cy.url().then((url) => {
      cy.log(`URL after: ${url}`);
    });
    cy.window().then((win: any) => {
      if (win.SERVER_FLAGS?.authDisabled) {
        return;
      }

      // Make sure we clear the cookie in case a previous test failed to logout.
      cy.clearCookie('openshift-session-token');

      const idp = provider || KUBEADMIN_IDP;
      cy.log(idp);
      cy.task('log', `  Logging in as ${username || KUBEADMIN_USERNAME}`);
      cy.byLegacyTestID('login').should('be.visible');
      cy.get('body').then(($body) => {
        if ($body.text().includes(idp)) {
          cy.contains(idp).should('be.visible').click();
        }
      });
      cy.get('#inputUsername').type(username || KUBEADMIN_USERNAME);
      cy.get('#inputPassword').type(
        password || Cypress.env('BRIDGE_KUBEADMIN_PASSWORD'),
      );
      cy.get('button[type=submit]').click();

      cy.get(`[data-test="${loginUsername}"]`).should('be.visible');
    });
  },
);

Cypress.Commands.add('logout', () => {
  // Check if auth is disabled (for a local development environment).
  cy.window().then((win: any) => {
    if (win.SERVER_FLAGS?.authDisabled) {
      return;
    }
    cy.get('[data-test="user-dropdown"]').click();
    cy.get('[data-test="log-out"]').should('be.visible');
    cy.get('[data-test="log-out"]').click({ force: true });
  });
});
