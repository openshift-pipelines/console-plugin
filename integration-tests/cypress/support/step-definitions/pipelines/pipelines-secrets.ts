import { Given, Then, When } from '@badeball/cypress-cucumber-preprocessor';
import { modal } from '../../../../../tests/views/modal';
import { pipelineActions } from '../../constants';
import { devNavigationMenu } from '../../constants/global';
import { pipelinesPO } from '../../page-objects/pipelines-po';
import {
  pipelineBuilderPage,
  pipelinesPage,
  startPipelineInPipelinesPage,
} from '../../pages';
import { app, navigateTo } from '../../pages/app';

Given(
  'user has created pipeline {string} with git resources',
  (pipelineName: string) => {
    pipelinesPage.clickOnCreatePipeline();
    pipelineBuilderPage.createPipelineWithGitResources(pipelineName);
    navigateTo(devNavigationMenu.Pipelines);
  },
);

When(
  'user clicks on Show Credentials link present in Start Pipeline modal',
  () => {
    modal.modalTitleShouldContain('Start Pipeline');
    startPipelineInPipelinesPage.clickShowCredentialOptions();
  },
);

When('user clicks on {string} link', (buttonName: string) => {
  cy.byButtonText(buttonName).click();
});

Then('user is able to see Create Source Secret section', () => {
  startPipelineInPipelinesPage.verifyCreateSourceSecretSection();
});

Then(
  'user is able to see Secret Name, Access to, Server UrL fields and authentication type fields',
  () => {
    startPipelineInPipelinesPage.verifyFields();
    modal.cancel();
  },
);

Given(
  'user is at Start Pipeline modal for pipeline {string}',
  (pipelineName: string) => {
    navigateTo(devNavigationMenu.Pipelines);
    cy.get(pipelinesPO.pipelinesTab).click();
    pipelinesPage.search(pipelineName);
    pipelinesPage.selectActionForPipeline(pipelineName, pipelineActions.Start);
    modal.modalTitleShouldContain('Start Pipeline');
    app.waitForLoad();
  },
);

When(
  'user enters URL, Revision as {string} and {string}',
  (gitUrl: string, revision: string) => {
    startPipelineInPipelinesPage.addGitResource(gitUrl, revision);
  },
);

When('user enters Secret Name as {string}', (secretName: string) => {
  cy.get(pipelinesPO.startPipeline.advancedOptions.secretName).type(secretName);
});

When('user clicks on Add Secret link', () => {
  cy.contains('Add Secret').click({ force: true });
});

When(
  'user selects the {string} option from accessTo drop down',
  (option: string) => {
    cy.selectByDropDownText(
      pipelinesPO.startPipeline.advancedOptions.accessTo,
      option,
    );
  },
);

When('user enters the server url as {string}', (serverUrl: string) => {
  cy.get(pipelinesPO.startPipeline.advancedOptions.serverUrl).type(serverUrl);
});

When(
  'user selects the Authentication type as {string}',
  (authenticationType: string) => {
    cy.selectByDropDownText(
      pipelinesPO.startPipeline.advancedOptions.authenticationType,
      authenticationType,
    );
  },
);

When(
  'user enters the Username, Password as {string}, {string}',
  (userName: string, password: string) => {
    cy.get(pipelinesPO.startPipeline.advancedOptions.userName).type(userName);
    cy.get(pipelinesPO.startPipeline.advancedOptions.password).type(password);
  },
);

When('user clicks on tick mark', () => {
  cy.get(pipelinesPO.startPipeline.advancedOptions.tickIcon).click();
});

Then('{string} is added under secrets section', (secretName: string) => {
  cy.get(pipelinesPO.startPipeline.advancedOptions.tickIcon).should(
    'not.exist',
  );
  cy.get('.odc-secrets-list').within(() => {
    cy.byLegacyTestID(secretName).should('be.visible');
  });
  startPipelineInPipelinesPage.clickCancel();
});

When('user enters the SSH KEY as {string}', (sshKey: string) => {
  cy.get(pipelinesPO.startPipeline.advancedOptions.sshPrivateKey).type(sshKey);
});

When(
  'user enters the Username, Password, email as {string}, {string}, {string}',
  (userName: string, password: string, email: string) => {
    cy.get(pipelinesPO.startPipeline.advancedOptions.userName).type(userName);
    cy.get(pipelinesPO.startPipeline.advancedOptions.password).type(password);
    cy.get(pipelinesPO.startPipeline.advancedOptions.email).type(email);
  },
);
