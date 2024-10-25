import { guidedTour } from '../../../../../tests/views/guided-tour';
import { app } from '../app';

export const actionsDropdownMenu = {
  verifyActionsMenu: () =>
    cy.get('button[class*=-menu-toggle]').should('be.visible'),
  clickActionMenu: () =>
    cy.get('button[class*=-menu-toggle]').contains('Actions').click(),
  selectAction: (action: string) => {
    actionsDropdownMenu.clickActionMenu();
    cy.get('ul[role="menu"]').should('be.visible');
    switch (action) {
      case 'Start': {
        cy.get('[data-test="start-pipeline"] button[role="menuitem"]')
          .should('be.visible')
          .click({ force: true });
        break;
      }
      case 'Start last run': {
        cy.get('[data-test="start-last-run"] button[role="menuitem"]')
          .should('be.visible')
          .click({ force: true });
        break;
      }
      case 'Add Trigger': {
        cy.get('[data-test="add-trigger"] button[role="menuitem"]')
          .should('be.visible')
          .click({ force: true });
        break;
      }
      case 'Remove Trigger': {
        cy.get('[data-test="remove-trigger"] button[role="menuitem"]')
          .should('be.visible')
          .click({ force: true });
        break;
      }
      case 'Edit labels': {
        cy.get('[data-test="edit-labels"] button[role="menuitem"]')
          .should('be.visible')
          .click({ force: true });
        break;
      }
      case 'Edit annotations': {
        cy.get('[data-test="edit-annotations"] button[role="menuitem"]')
          .should('be.visible')
          .click({ force: true });
        break;
      }
      case 'Edit Pipeline': {
        cy.get('[data-test="edit"] button[role="menuitem"]')
          .should('be.visible')
          .click({ force: true });
        break;
      }
      case 'Delete Pipeline': {
        cy.get('[data-test="delete"] button[role="menuitem"]')
          .should('be.visible')
          .click({ force: true });
        break;
      }
      default: {
        throw new Error('action is not available');
      }
    }
  },
};

export const tableFunctions = {
  verifyColumnValue: (columnName: string, columnValue: string) => {
    cy.get('tr th').each(($el, index) => {
      if ($el.text().includes(columnName)) {
        cy.get('tbody tr')
          .find('td')
          .eq(index)
          .should('have.text', columnValue);
      }
    });
  },

  selectKebabMenu: (name: string) => {
    cy.get('[data-test-rows="resource-row"]').within(() => {
      cy.get('tr td:nth-child(1)').each(($el, index) => {
        if ($el.text().includes(name)) {
          cy.get('tbody tr')
            .eq(index)
            .find('[data-test-id="kebab-button"]')
            .click({ force: true });
        }
      });
    });
  },
};

export const userLoginPage = {
  nonAdminUserlogin: () => {
    Cypress.session.clearAllSavedSessions();
    app.waitForDocumentLoad();
    cy.get('body').then(($body) => {
      if ($body.find('[data-test-id="login"]').length === 0) {
        /* eslint-disable cypress/no-unnecessary-waiting */
        cy.wait(4000);
        Cypress.session.clearAllSavedSessions();
      }
    });
    const idp = Cypress.env('BRIDGE_HTPASSWD_IDP') || 'test';
    const username = Cypress.env('BRIDGE_HTPASSWD_USERNAME') || 'test';
    const password = Cypress.env('BRIDGE_HTPASSWD_PASSWORD') || 'test';
    cy.login(idp, username, password);
    app.waitForLoad();
    guidedTour.close();
  },
};
