// import { topologyHelper } from '@console/topology/integration-tests/support/pages/topology/topology-helper-page';
// import { detailsPage } from '../../../../../integration-tests-cypress/views/details-page';
import { catalogCards, catalogTypes } from '../constants/add';
import {
  //  cardTitle,
  catalogPO,
} from '../page-objects/add-flow-po';
import { app } from './app';
// import { addPage } from './add-page';

export const catalogPage = {
  isCardsDisplayed: () => {
    app.waitForLoad();
    cy.get(catalogPO.card).should('be.visible');
  },
  search: (keyword: string) => {
    cy.get('.skeleton-catalog--grid').should('not.exist');
    /* eslint-disable-next-line cypress/unsafe-to-chain-command */
    cy.get(catalogPO.search).clear().type(keyword);
  },
  verifyDialog: () => cy.get(catalogPO.sidePane.dialog).should('be.visible'),
  clickButtonOnCatalogPageSidePane: () => {
    catalogPage.verifyDialog();
    cy.get(catalogPO.sidePane.instantiateTemplate).click({ force: true });
  },
  //   clickOnCancelButton: () => cy.byButtonText('Cancel').click(),
  selectCatalogType: (type: catalogTypes) => {
    switch (type) {
      case catalogTypes.BuilderImage: {
        cy.get(catalogPO.catalogTypes.builderImage).click();
        break;
      }
      default: {
        throw new Error('Card is not available in Catalog');
      }
    }
  },
  selectCardInCatalog: (card: catalogCards | string) => {
    cy.get('.skeleton-catalog--grid').should('not.exist');
    cy.byLegacyTestID('perspective-switcher-toggle').click();
    switch (card) {
      case catalogCards.nodeJs || 'Node.js': {
        cy.get(catalogPO.cards.nodeJsBuilderImage).first().click();
        break;
      }
      default: {
        throw new Error(`${card} card is not available in Catalog`);
      }
    }
  },
  //   verifyCardName: (partialCardName: string) => {
  //     cy.get(cardTitle).contains(partialCardName, { matchCase: false });
  //   },
  //   verifyFilterByKeywordField: () => {
  //     cy.get('[data-test="search-catalog"] input').should('be.visible');
  //   },
  //   verifySortDropdown: () => {
  //     cy.get(catalogPO.aToz).should('be.visible');
  //     cy.get(catalogPO.zToA).should('be.visible');
  //   },
};
