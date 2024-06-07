import { Given, Then, When } from 'cypress-cucumber-preprocessor/steps';
import * as yamlEditor from '../../commands/views/yaml-editor';
import { devNavigationMenu } from '../../constants/global';
import { pipelineBuilderPO } from '../../page-objects/pipelines-po';
import { navigateTo } from '../../pages/app';
import {
  pipelinesPage,
  startPipelineInPipelinesPage,
} from '../../pages/pipelines/pipelines-page';

Given('user is at {string} on Pipeline Builder page', (view: string) => {
  navigateTo(devNavigationMenu.Pipelines);
  pipelinesPage.clickOnCreatePipeline();
  startPipelineInPipelinesPage.selectView(view);
});

When(
  'user creates pipeline resource using YAML editor from {string}',
  (yamlLocation: string) => {
    yamlEditor.isLoaded();
    pipelinesPage.clearYAMLEditor();
    pipelinesPage.setEditorContent(yamlLocation);
    cy.get(pipelineBuilderPO.create).click();
  },
);

When(
  'user creates pipeline using YAML and CLI {string} in namespace {string}',
  (yamlFile: string, namespace: string) => {
    cy.exec(`oc apply -f ${yamlFile} -n ${namespace}`, {
      failOnNonZeroExit: false,
    }).then(function (result) {
      cy.log(result.stdout);
    });
  },
);

Then(
  'user will see pipeline {string} in pipelines page',
  (pipelineName: string) => {
    navigateTo(devNavigationMenu.Add);
    navigateTo(devNavigationMenu.Pipelines);
    pipelinesPage.search(pipelineName);
  },
);
