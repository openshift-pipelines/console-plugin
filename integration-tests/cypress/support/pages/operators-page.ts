import { detailsPage } from '../../../../tests/views/details-page';
import { operators } from '../constants/global';
import { pageTitle } from '../constants/pageTitle';
import { operatorsPO } from '../page-objects/operators-po';
import { app } from './app';

export const operatorsPage = {
  navigateToOperatorHubPage: () => {
    cy.get(operatorsPO.nav.operatorHub).then(($nav) => {
      if (!$nav.is(':visible')) {
        cy.get(operatorsPO.nav.operators).click();
      }
      cy.get(operatorsPO.nav.operatorHub).click({ force: true });
    });
    detailsPage.titleShouldContain(pageTitle.OperatorHub);
    cy.get('.skeleton-catalog--grid').should('not.exist');
  },

  navigateToInstallOperatorsPage: () => {
    cy.get(operatorsPO.nav.installedOperators).then(($nav) => {
      if (!$nav.is(':visible')) {
        cy.get(operatorsPO.nav.operators).click();
      }
      cy.get(operatorsPO.nav.installedOperators).click({ force: true });
    });
    app.waitForLoad();
    detailsPage.titleShouldContain(pageTitle.InstalledOperators);
  },

  // navigateToEventingPage: () => {
  //   cy.get(operatorsPO.nav.serverless).click();
  //   cy.get(operatorsPO.nav.eventing).click({ force: true });
  //   detailsPage.titleShouldContain(pageTitle.Eventing);
  // },
  // navigateToServingPage: () => {
  //   cy.get(operatorsPO.nav.serverless).click();
  //   cy.get(operatorsPO.nav.serving).click({ force: true });
  //   detailsPage.titleShouldContain(pageTitle.Serving);
  // },
  navigateToCustomResourceDefinitions: () => {
    cy.get(operatorsPO.nav.administration).click();
    cy.get(operatorsPO.nav.customResourceDefinitions).click({ force: true });
    detailsPage.titleShouldContain(pageTitle.CustomResourceDefinitions);
  },

  searchOperator: (operatorName: string | operators) => {
    /* eslint-disable-next-line cypress/unsafe-to-chain-command */
    cy.get(operatorsPO.search).should('be.visible').clear().type(operatorName);
  },

  searchOperatorInInstallPage: (operatorName: string | operators) => {
    cy.get('.co-installed-operators').should('be.visible');
    cy.get('body').then(($body) => {
      if (
        $body.find(operatorsPO.installOperators.noOperatorsFound).length === 0
      ) {
        cy.get(operatorsPO.installOperators.search).clear();
        /* eslint-disable-next-line cypress/unsafe-to-chain-command */
        cy.get(operatorsPO.installOperators.search)
          .should('be.enabled')
          .type(operatorName);
      } else {
        cy.log(
          `${operatorName} operator is not installed in this cluster, so lets install it from operator Hub`,
        );
      }
    });
  },

  verifySubscriptionPage: (operatorLogo: string) =>
    cy.get(operatorsPO.subscription.logo).should('have.text', operatorLogo),

  verifyInstalledOperator: (operatorName: string) => {
    /* eslint-disable-next-line cypress/unsafe-to-chain-command */
    cy.get(operatorsPO.installOperators.search)
      .should('be.visible')
      .clear()
      .type(operatorName);
    cy.get(operatorsPO.installOperators.operatorStatus, {
      timeout: 100000,
    }).should('contain.text', 'Succeeded');
  },

  verifyOperatorNotAvailable: (operatorName: string) => {
    /* eslint-disable-next-line cypress/unsafe-to-chain-command */
    cy.get(operatorsPO.installOperators.search).clear().type(operatorName);
    cy.get(operatorsPO.installOperators.noOperatorFoundMessage).should(
      'have.text',
      'No Operators Found',
    );
  },

  selectOperator: (opt: string) => {
    switch (opt) {
      case 'OpenShift Pipelines Operator':
      case 'Red Hat OpenShift Pipelines': {
        cy.get(operatorsPO.operatorHub.pipelinesOperatorCard).click();
        break;
      }
      case 'OpenShift Serverless Operator':
      case operators.ServerlessOperator: {
        cy.get(operatorsPO.operatorHub.serverlessOperatorCard).click();
        break;
      }
      default: {
        throw new Error('operator is not available');
      }
    }
  },

  verifySidePane: () => cy.get(operatorsPO.alertDialog).should('be.exist'),

  clickOnCreate: () => cy.byButtonText('Install').click(),
};
