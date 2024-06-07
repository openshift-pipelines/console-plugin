import { detailsPage } from '../../../../tests/views/details-page';
import { addOptions } from '../constants/add';
import { pageTitle } from '../constants/pageTitle';
// import { cardTitle } from '../../pageObjects/add-flow-po';
import { app } from './app';

export const addPage = {
  selectCardFromOptions: (card: addOptions | string) => {
    app.waitForDocumentLoad();
    switch (card) {
      case 'Import From Git':
      case addOptions.ImportFromGit:
        cy.byTestID('item import-from-git').click();
        app.waitForLoad();
        cy.testA11y('Import from Git Page');
        detailsPage.titleShouldContain(pageTitle.Git);
        break;
      case 'Developer Catalog':
      case 'From Catalog':
      case addOptions.DeveloperCatalog:
        cy.byTestID('item dev-catalog').click();
        app.waitForLoad();
        detailsPage.titleShouldContain(pageTitle.DeveloperCatalog);
        break;
      case 'Pipeline':
      case addOptions.Pipeline:
        /* eslint-disable-next-line cypress/no-unnecessary-waiting */
        cy.wait(3000);
        cy.byTestID('item pipeline').click();
        cy.get('.odc-pipeline-builder-header__title').should(
          'have.text',
          pageTitle.PipelineBuilder,
        );
        app.waitForLoad();
        cy.testA11y(pageTitle.PipelineBuilder);
        break;
      default:
        throw new Error(`Unable to find the "${card}" card on Add page`);
    }
  },
  //   verifyCard: (cardName: string) => cy.get(cardTitle).should('contain.text', cardName),
  //   setBuildEnvField: (envKey: string, value: string) =>
  //     cy
  //       .get(`#form-input-image-imageEnv-${envKey}-field`)
  //       .scrollIntoView()
  //       .should('be.visible')
  //       .clear()
  //       .type(value),
  // };
};
