import { Then, When } from '@badeball/cypress-cucumber-preprocessor';
import * as yamlEditor from '../../../../../tests/views/yaml-editor';
import { devNavigationMenu } from '../../constants/global';
import { pipelineBuilderPO } from '../../page-objects/pipelines-po';
import { navigateTo } from '../../pages/app';
import { pipelinesPage } from '../../pages/pipelines/pipelines-page';

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
