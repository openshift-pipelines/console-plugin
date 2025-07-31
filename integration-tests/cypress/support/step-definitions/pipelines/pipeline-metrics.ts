import { Then, When } from '@badeball/cypress-cucumber-preprocessor';
import { navigateTo } from '../../../support/pages/app';
import { devFilePage, gitPage } from '../../../support/pages/git-page';
import { topologyPage } from '../../../support/pages/topology-page';
import { addOptions, devNavigationMenu } from '../../constants';
import { pipelineDetailsText } from '../../constants/static-text/pipeline-details-text';
import { pipelineDetailsPO } from '../../page-objects/pipelines-po';
import { addPage } from '../../pages/add-page';
import { pipelineDetailsPage } from '../../pages/pipelines/pipelineDetails-page';

Then('user can see {string} in PipelineRun status', (message: string) => {
  cy.get(pipelineDetailsPO.metrics.pipelineRunStatus).should(
    'contain.text',
    message,
  );
});

When('user clicks on Metrics tab', () => {
  pipelineDetailsPage.selectTab('Metrics');
});

Then(
  'user can see Time Range with a default value of {string}',
  (defaultTimeRange: string) => {
    cy.get('.form-group button')
      .first()
      .should('contain.text', defaultTimeRange);
  },
);

Then(
  'user can see and Refresh Interval with a default value of {string}',
  (defaultRefreshInterval: string) => {
    cy.get('.form-group button')
      .eq(1)
      .should('contain.text', defaultRefreshInterval);
  },
);

Then('user can see PipelineRun status, Number of Pipeline Runs', () => {
  cy.get(pipelineDetailsPO.metrics.graphTitle)
    .eq(0)
    .should(
      'contain.text',
      pipelineDetailsText.metrics.graphs.PipelineRunStatus,
    );
  cy.get(pipelineDetailsPO.metrics.graphTitle)
    .eq(4)
    .should(
      'contain.text',
      pipelineDetailsText.metrics.graphs.numberOfPipelineRuns,
    );
});

When('user can see message "No datapoints found" inside graphs', () => {
  cy.byTestID('datapoints-msg').should('include.text', 'No datapoints found.');
});

When('user adds GIT_REVISION as {string}', (text: string) => {
  cy.get('input[id="form-input-parameters-2-value-field"]').type(text);
});

When('user starts the pipeline from start pipeline modal', () => {
  // eslint-disable-next-line cypress/unsafe-to-chain-command
  cy.byTestID('confirm-action').scrollIntoView().click();
});

When(
  'user creates pipeline using git named {string}',
  (pipelineName: string) => {
    navigateTo(devNavigationMenu.Add);
    addPage.selectCardFromOptions(addOptions.ImportFromGit);
    gitPage.enterGitUrl('https://github.com/sclorg/golang-ex');
    devFilePage.verifyValidatedMessage('https://github.com/sclorg/golang-ex');
    gitPage.enterWorkloadName(pipelineName);
    gitPage.selectAddPipeline();
    gitPage.clickCreate();
    topologyPage.verifyTopologyPage();
  },
);
