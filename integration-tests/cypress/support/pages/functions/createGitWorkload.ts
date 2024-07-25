import { addOptions } from '../../constants/add';
import { devNavigationMenu } from '../../constants/global';
import { globalPO } from '../../page-objects/global-po';
import { topologyPO } from '../../page-objects/topology-po';
import { addPage } from '../add-page';
import { createForm, navigateTo } from '../app';
import { gitPage } from '../git-page';
import { topologyPage } from '../topology-page';

export const createGitWorkload = (
  gitUrl = 'https://github.com/sclorg/nodejs-ex.git',
  componentName = 'nodejs-ex-git',
  resourceType = 'Deployment',
  appName = 'nodejs-ex-git-app',
  isPipelineSelected = false,
  isServerlessFunction = false,
) => {
  addPage.selectCardFromOptions(addOptions.ImportFromGit);
  gitPage.enterGitUrl(gitUrl);
  gitPage.verifyValidatedMessage(gitUrl);
  gitPage.enterComponentName(componentName);
  if (!isServerlessFunction) {
    gitPage.selectResource(resourceType);
  }
  gitPage.enterAppName(appName);
  if (isPipelineSelected === true) {
    gitPage.selectAddPipeline();
  }
  createForm.clickCreate().then(() => {
    cy.get('.co-m-loader').should('not.exist');
    cy.get('body').then(($body) => {
      if ($body.find(globalPO.errorAlert).length !== 0) {
        cy.get(globalPO.errorAlert)
          .find('.co-pre-line')
          .then(($ele) => {
            cy.log($ele.text());
          });
      } else {
        cy.log(`Workload : "${componentName}" is created`);
      }
    });
  });
};

export const createGitWorkloadIfNotExistsOnTopologyPage = (
  gitUrl: string = 'https://github.com/sclorg/nodejs-ex.git',
  componentName: string = 'nodejs-ex-git',
  resourceType: string = 'Deployment',
  appName?: string,
  isPipelineSelected: boolean = false,
  isServerlessFunction: boolean = false,
) => {
  navigateTo(devNavigationMenu.Topology);
  topologyPage.waitForLoad();
  cy.get('body').then(($body) => {
    if ($body.find(topologyPO.emptyStateIcon).length) {
      cy.log(
        `Topology doesn't have workload "${componentName}", lets create it`,
      );
      navigateTo(devNavigationMenu.Add);
      createGitWorkload(
        gitUrl,
        componentName,
        resourceType,
        appName,
        isPipelineSelected,
        isServerlessFunction,
      );
      topologyPage.verifyWorkloadInTopologyPage(componentName);
    } else {
      topologyPage.search(componentName);
      cy.get('body').then(($node) => {
        if ($node.find(topologyPO.highlightNode).length) {
          cy.log(`knative service: ${componentName} is already created`);
        } else {
          navigateTo(devNavigationMenu.Add);
          createGitWorkload(
            gitUrl,
            componentName,
            resourceType,
            appName,
            isPipelineSelected,
            isServerlessFunction,
          );
          topologyPage.verifyWorkloadInTopologyPage(componentName);
        }
      });
    }
  });
};
