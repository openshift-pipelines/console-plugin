import { Given, Then, When } from '@badeball/cypress-cucumber-preprocessor';
import { detailsPage } from '../../../../../tests/views/details-page';
import { modal } from '../../../../../tests/views/modal';
import { addOptions, pipelineActions } from '../../constants';
import { devNavigationMenu } from '../../constants/global';
import { pageTitle } from '../../constants/pageTitle';
import { pipelinesPO } from '../../page-objects';
import {
  pipelineBuilderPage,
  pipelineDetailsPage,
  pipelineRunDetailsPage,
  pipelinesPage,
  startPipelineInPipelinesPage,
} from '../../pages';
import { addPage } from '../../pages/add-page';
import { app, navigateTo } from '../../pages/app';
import { actionsDropdownMenu } from '../../pages/functions/common';
import { gitPage } from '../../pages/git-page';
import { topologyPage, topologySidePane } from '../../pages/topology-page';

When(
  'user selects {string} option from kebab menu for pipeline {string}',
  (option: string, pipelineName: string) => {
    // pipelinesPage.search(pipelineName);
    pipelinesPage.selectActionForPipeline(pipelineName, option);
  },
);

Given(
  'user created workload {string} from add page with pipeline',
  (pipelineName: string) => {
    navigateTo(devNavigationMenu.Add);
    addPage.selectCardFromOptions(addOptions.ImportFromGit);
    gitPage.enterGitUrl('https://github.com/sclorg/nodejs-ex.git');
    gitPage.verifyValidatedMessage('https://github.com/sclorg/nodejs-ex.git');
    gitPage.enterComponentName(pipelineName);
    gitPage.selectResource('deployment');
    gitPage.selectAddPipeline();
    gitPage.clickCreate();
    topologyPage.verifyTopologyPage();
  },
);

Given(
  'pipeline run is displayed for {string} with resource',
  (pipelineName: string) => {
    pipelinesPage.clickOnCreatePipeline();
    cy.get('#form-radiobutton-editorType-form-field').click();
    pipelineBuilderPage.createPipelineWithGitResources(pipelineName);
    cy.byTestID('breadcrumb-link').click();
    pipelinesPage.search(pipelineName);
    pipelinesPage.selectActionForPipeline(pipelineName, pipelineActions.Start);
    modal.modalTitleShouldContain('Start Pipeline');
    startPipelineInPipelinesPage.addGitResource(
      'https://github.com/sclorg/nodejs-ex.git',
    );
    startPipelineInPipelinesPage.clickStart();
    pipelineRunDetailsPage.verifyTitle();
    navigateTo(devNavigationMenu.Pipelines);
    cy.get(pipelinesPO.pipelinesTab).click();
    pipelinesPage.search(pipelineName);
    cy.get(pipelinesPO.pipelinesTable.pipelineRunIcon).should('be.visible');
  },
);

Given(
  'pipeline run is displayed for {string} with workspace {string} of type {string}',
  (pipelineName: string, workspaceName: string, workspaceType: string) => {
    pipelinesPage.clickOnCreatePipeline();
    pipelineBuilderPage.createPipelineWithWorkspaces(
      pipelineName,
      workspaceName,
    );
    cy.byTestID('breadcrumb-link').click();
    pipelinesPage.search(pipelineName);
    pipelinesPage.selectActionForPipeline(pipelineName, pipelineActions.Start);
    modal.modalTitleShouldContain('Start Pipeline');
    startPipelineInPipelinesPage.selectWorkSpace(workspaceType);
    startPipelineInPipelinesPage.clickStart();
    pipelineRunDetailsPage.verifyTitle();
    navigateTo(devNavigationMenu.Pipelines);
    pipelinesPage.search(pipelineName);
    cy.get(pipelinesPO.pipelinesTable.pipelineRunIcon).should('be.visible');
  },
);

Given(
  'pipeline {string} is created with {string} workspace',
  (pipelineName: string, workspaceName: string) => {
    pipelinesPage.clickOnCreatePipeline();
    pipelineBuilderPage.createPipelineWithWorkspaces(
      pipelineName,
      'git-clone',
      workspaceName,
    );
    cy.byTestID('breadcrumb-link').click();
    pipelinesPage.search(pipelineName);
  },
);

Given(
  'pipeline {string} with at least one workspace {string} and no previous Pipeline Runs',
  (pipelineName: string, workspaceName: string) => {
    pipelinesPage.clickOnCreatePipeline();
    pipelineBuilderPage.createPipelineWithWorkspaces(
      pipelineName,
      'git-clone',
      workspaceName,
    );
    cy.byTestID('breadcrumb-link').click();
    pipelinesPage.search(pipelineName);
  },
);

When('user adds another task {string} in parallel', (taskName: string) => {
  pipelineBuilderPage.selectParallelTask(taskName);
});

Given('user is at pipelines page', () => {
  navigateTo(devNavigationMenu.Pipelines);
  cy.get(pipelinesPO.pipelinesTab).click();
});

Given('user has installed OpenShift Pipelines operator using cli', () => {
  cy.exec(`oc apply -f testData/installPipelinesOperator.yaml`);
  cy.exec(
    `oc patch OperatorHub cluster --type json -p '[{"op": "add", "path": "/spec/disableAllDefaultSources", "value": true}]'`,
  );
});

Then('user redirects to Pipelines page', () => {
  detailsPage.titleShouldContain(pageTitle.Pipelines);
});

Then('user redirects to Pipeline Builder page', () => {
  pipelineBuilderPage.verifyTitle();
  app.waitForLoad();
});

Then('side bar is displayed with the pipelines section', () => {
  topologySidePane.verifyTab('Resources');
  topologySidePane.verifySection(pageTitle.PipelineRuns);
});

Then(
  'Last Run status of the workload displays as {string} in topology page',
  (status: string) => {
    topologySidePane.verify();
    topologyPage.verifyPipelineRunStatus(status);
  },
);

Given('user is at {string} on Pipeline Builder page', (view: string) => {
  navigateTo(devNavigationMenu.Pipelines);
  pipelinesPage.clickOnCreatePipeline();
  startPipelineInPipelinesPage.selectView(view);
});

Given(
  'pipeline {string} is present on Pipeline Details page',
  (pipelineName: string) => {
    pipelinesPage.clickOnCreatePipeline();
    pipelineBuilderPage.createPipelineFromBuilderPage(pipelineName);
    navigateTo(devNavigationMenu.Pipelines);
    pipelinesPage.selectPipeline(pipelineName);
    pipelineDetailsPage.verifyTitle(pipelineName);
  },
);

When('user clicks on pipeline {string}', (pipelineName: string) => {
  pipelinesPage.selectPipeline(pipelineName);
});

When('user navigates to Pipelines page', () => {
  navigateTo(devNavigationMenu.Pipelines);
});

When(
  'user selects option {string} from Actions menu drop down',
  (action: string) => {
    actionsDropdownMenu.selectAction(action);
  },
);
