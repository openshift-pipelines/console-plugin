import {
  getResponseMocks,
  gitImportRepos,
} from '../../testData/git-import/repos';
import { builderImages } from '../constants/add';
import { messages } from '../constants/static-text/global-text';
import { gitPO } from '../page-objects/add-flow-po';
import { app } from './app';

export const gitPage = {
  // verifyPipelinesSection: () => {
  //   cy.get('.odc-namespaced-page__content').scrollTo('bottom', { ensureScrollable: false });
  //   cy.get(gitPO.sectionTitle).contains('Pipelines').should('be.visible');
  // },
  verifyPipelineInfoMessage: (message: string) => {
    cy.get(gitPO.pipeline.infoMessage).should(
      'contain.text',
      `Info alert:${message}`,
    );
  },
  enterGitUrl: (gitUrl: string) => {
    const shortUrl = gitUrl.endsWith('.git')
      ? gitUrl.substring(0, gitUrl.length - 4)
      : gitUrl;
    const repository = gitImportRepos.find(
      (repo: any) => repo.url === shortUrl,
    );

    // mock the github requests for the frequently used repositories to avoid rate limits
    if (repository) {
      const urlSegments = repository.url.split('/');
      const organization = urlSegments[urlSegments.length - 2];
      const name = urlSegments[urlSegments.length - 1];
      const apiBaseUrl = `https://api.github.com/repos/${organization}/${name}`;
      const responses = getResponseMocks(repository);

      cy.intercept('GET', apiBaseUrl, {
        statusCode: 200,
        body: responses.repoResponse,
      }).as('getRepo');

      cy.intercept('GET', `${apiBaseUrl}/contents/`, {
        statusCode: 200,
        body: responses.contentsResponse,
      }).as('getContents');

      cy.intercept('GET', `${apiBaseUrl}/contents//package.json`, {
        statusCode: responses.packageResponse ? 200 : 404,
        body: responses.packageResponse,
      }).as('getPackage');

      cy.intercept('POST', '/api/devfile/', {
        statusCode: responses.devFileResources ? 200 : 404,
        body: responses.devFileResources,
      }).as('getDevfileResources');

      cy.intercept('GET', `${apiBaseUrl}/contents//func.yaml`, {
        statusCode: responses.funcJson ? 200 : 404,
        body: responses.funcJson,
      }).as('getFuncJson');
    }

    /* eslint-disable-next-line cypress/unsafe-to-chain-command */
    cy.get(gitPO.gitRepoUrl).clear().type(gitUrl);

    if (repository) {
      const responses = getResponseMocks(repository);
      cy.wait(
        responses.packageResponse
          ? ['@getRepo', '@getContents', '@getPackage']
          : ['@getRepo', '@getContents'],
      );
    }
    app.waitForDocumentLoad();
  },
  verifyPipelineOption: () => {
    /* eslint-disable-next-line cypress/unsafe-to-chain-command */
    cy.get(gitPO.pipeline.buildDropdown).scrollIntoView().click();
    cy.get(gitPO.pipeline.addPipeline).should('be.visible');
  },
  selectPipeline: (pipelineName: string) => {
    /* eslint-disable-next-line cypress/unsafe-to-chain-command */
    cy.get(gitPO.pipeline.pipelineDropdown).scrollIntoView().click();
    cy.get(`#${pipelineName}-link`).should('be.visible').click();
  },
  enterAppName: (appName: string) => {
    cy.get('body').then(($body) => {
      if ($body.find('#form-input-application-name-field').length !== 0) {
        /* eslint-disable-next-line cypress/unsafe-to-chain-command */
        cy.get('#form-input-application-name-field')
          .scrollIntoView()
          .clear()
          .should('not.have.value');
        /* eslint-disable-next-line cypress/unsafe-to-chain-command */
        cy.get('#form-input-application-name-field')
          .type(appName)
          .should('have.value', appName);
        cy.log(`Application Name "${appName}" is created`);
      } else if (
        $body.find('#form-dropdown-application-name-field').length !== 0
      ) {
        cy.get(gitPO.appName).click();
        cy.get('[data-test-id="dropdown-text-filter"]').type(appName);
        cy.get('[role="listbox"]').then(($el) => {
          if ($el.find('li[role="option"]').length === 0) {
            cy.get(
              '[data-test-dropdown-menu="#CREATE_APPLICATION_KEY#"]',
            ).click();
            /* eslint-disable-next-line cypress/unsafe-to-chain-command */
            cy.get('#form-input-application-name-field')
              .clear()
              .type(appName)
              .should('have.value', appName);
          } else {
            cy.get(`li #${appName}-link`).click();
            cy.log(`Application Name "${appName}" is selected`);
          }
        });
      }
    });
  },
  // verifyAppName: (appName: string) => {
  //   cy.get(gitPO.appName).then(($el) => {
  //     if ($el.prop('tagName').includes('button')) {
  //       cy.get(gitPO.appName).find('span').should('contain.text', appName);
  //     } else if ($el.prop('tagName').includes('input')) {
  //       cy.get(gitPO.appName).should('have.value', appName);
  //     } else {
  //       cy.log(`App name doesn't contain button or input tags`);
  //     }
  //   });
  //   // cy.get(gitPO.appName).should('have.value', nodeName)
  // },
  // editAppName: (newAppName: string) => {
  //   cy.get(gitPO.appName).click();
  //   cy.get(gitPO.createNewApp).first().click();
  //   cy.get(gitPO.newAppName).clear().type(newAppName);
  // },
  enterComponentName: (name: string) => {
    app.waitForLoad();
    /* eslint-disable-next-line cypress/unsafe-to-chain-command */
    cy.get(gitPO.nodeName)
      .scrollIntoView()
      .invoke('val')
      .should('not.be.empty');
    /* eslint-disable-next-line cypress/no-unnecessary-waiting */
    cy.wait(2000);
    cy.get(gitPO.nodeName).clear();
    /* eslint-disable-next-line cypress/unsafe-to-chain-command */
    cy.get(gitPO.nodeName).type(name).should('have.value', name);
  },
  enterWorkloadName: (name: string) => {
    cy.get(gitPO.nodeName).clear();
    /* eslint-disable-next-line cypress/unsafe-to-chain-command */
    cy.get(gitPO.nodeName).type(name).should('have.value', name);
  },
  // verifyNodeName: (componentName: string) =>
  //   cy.get(gitPO.nodeName).should('have.value', componentName),
  selectResource: (resource = 'deployment') => {
    /* eslint-disable-next-line cypress/unsafe-to-chain-command */
    cy.get(gitPO.resourcesDropdown).scrollIntoView().click();
    switch (resource) {
      case 'deployment':
      case 'Deployment':
        /* eslint-disable-next-line cypress/unsafe-to-chain-command */
        cy.get(gitPO.resources.deployment).scrollIntoView().click();
        break;
      case 'deployment config':
      case 'Deployment Config':
      case 'DeploymentConfig':
        /* eslint-disable-next-line cypress/unsafe-to-chain-command */
        cy.get(gitPO.resources.deploymentConfig).scrollIntoView().click();
        break;
      case 'Knative':
      case 'Knative Service':
      case 'Serverless Deployment':
        /* eslint-disable-next-line cypress/unsafe-to-chain-command */
        cy.get(gitPO.resources.knative).scrollIntoView().click();
        break;
      default:
        throw new Error('Resource option is not available');
        break;
    }
    cy.log(`Resource type "${resource}" is selected`);
  },
  enterSecret: (secret: string) => {
    /* eslint-disable-next-line cypress/unsafe-to-chain-command */
    cy.get('#form-input-pac-repository-webhook-token-field')
      .clear()
      .type(secret);
  },
  clickGenerateWebhookSecret: () => {
    cy.byButtonText('Generate').click();
  },
  selectAddPipeline: () => {
    /* eslint-disable-next-line cypress/unsafe-to-chain-command */
    cy.get(gitPO.pipeline.buildDropdown).scrollIntoView().click();
    cy.get(gitPO.pipeline.addPipeline).should('be.visible').click();
    cy.get(gitPO.pipeline.buildDropdown).should(
      'contain.text',
      'Build using pipelines',
    );
    cy.log('pipeline added in add section');
  },
  clickCreate: () =>
    /* eslint-disable-next-line cypress/unsafe-to-chain-command */
    cy.get(gitPO.create).scrollIntoView().should('be.enabled').click(),
  clickCancel: () => cy.get(gitPO.cancel).should('be.enabled').click(),
  selectBuilderImageForGitUrl: (gitUrl: string) => {
    switch (gitUrl) {
      case 'https://github.com/sclorg/dancer-ex.git':
        cy.get(`[data-test="card ${builderImages.Perl}"]`).click();
        cy.log(
          `Selecting builder image "${builderImages.Perl}" to avoid the git rate limit issue`,
        );
        break;
      case 'https://github.com/sclorg/cakephp-ex.git':
        cy.get(`[data-test="card ${builderImages.PHP}"]`).click();
        cy.log(
          `Selecting builder image "${builderImages.PHP}" to avoid the git rate limit issue`,
        );
        break;
      case 'https://github.com/sclorg/nginx-ex.git':
        cy.get(`[data-test="card ${builderImages.Nginx}"]`).click();
        cy.log(
          `Selecting builder image "${builderImages.Nginx}" to avoid the git rate limit issue`,
        );
        break;
      case 'https://github.com/sclorg/httpd-ex.git':
        cy.get(`[data-test="card ${builderImages.Httpd}"]`).click();
        cy.log(
          `Selecting builder image "${builderImages.Httpd}" to avoid the git rate limit issue`,
        );
        break;
      case 'https://github.com/redhat-developer/s2i-dotnetcore-ex.git':
        cy.get(`[data-test="card ${builderImages.NETCore}"]`).click();
        cy.log(
          `Selecting builder image "${builderImages.NETCore}" to avoid the git rate limit issue`,
        );
        break;
      case 'https://github.com/sclorg/golang-ex.git':
        cy.get(`[data-test="card ${builderImages.Go}"]`).click();
        cy.log(
          `Selecting builder image "${builderImages.Go}" to avoid the git rate limit issue`,
        );
        break;
      case 'https://github.com/sclorg/ruby-ex.git':
        cy.get(`[data-test="card ${builderImages.Ruby}"]`).click();
        cy.log(
          `Selecting builder image "${builderImages.Ruby}" to avoid the git rate limit issue`,
        );
        break;
      case 'https://github.com/sclorg/django-ex.git':
        cy.get(`[data-test="card ${builderImages.Python}"]`).click();
        cy.log(
          `Selecting builder image "${builderImages.Python}" to avoid the git rate limit issue`,
        );
        break;
      case 'https://github.com/jboss-openshift/openshift-quickstarts':
        cy.get(`[data-test="card ${builderImages.Java}"]`).click();
        cy.log(
          `Selecting builder image "${builderImages.Java}" to avoid the git rate limit issue`,
        );
        break;
      case 'https://github.com/sclorg/nodejs-ex.git':
        cy.get(`[data-test="card ${builderImages.NodeJs}"]`).click();
        cy.log(
          `Selecting builder image "${builderImages.NodeJs}" to avoid the git rate limit issue`,
        );
        break;
      default:
        cy.log(
          `Unable to find the builder image for git url: ${gitUrl}, so selecting node.js builder by default `,
        );
    }
  },
  verifyValidatedMessage: (gitUrl: string) => {
    cy.get(gitPO.gitSection.validatedMessage)
      .should('not.include.text', 'Validating...')
      .and('not.include.text', messages.addFlow.buildDeployMessage);
    cy.get('body').then(($body) => {
      if ($body.text().includes(messages.addFlow.rateLimitExceeded)) {
        // Remove .git suffix and remove all parts before the last path
        const componentName = gitUrl
          .replace(/\.git$/, '')
          .replace(/^.*[\\\\/]/, '');
        cy.log(
          `Git Rate limit exceeded for url ${gitUrl}, select builder image and fill component name "${componentName}" based on the URL to continue tests.`,
        );
        gitPage.selectBuilderImageForGitUrl(gitUrl);
        cy.get(gitPO.nodeName).clear();
        cy.get(gitPO.nodeName).type(componentName);
      } else if (
        $body.find('.warning').length ||
        $body.text().includes(messages.addFlow.nonGitRepoMessage)
      ) {
        cy.log(`Not a git url ${gitUrl}. Please check it`);
      } else if (
        $body.find('[aria-label="Warning Alert"]').length ||
        $body.text().includes(messages.addFlow.privateGitRepoMessage)
      ) {
        cy.log(
          `Issue with git url ${gitUrl}, maybe a private repo url. Please check it`,
        );
        gitPage.selectBuilderImageForGitUrl(gitUrl);
      }
    });
  },

  // verifyBuilderImageDetectedMessage: () =>
  //   cy.get(gitPO.builderSection.builderImageDetected).should('be.visible'),
  // verifyBuilderImageVersion: () =>
  //   cy.get(gitPO.builderSection.builderImageVersion).should('be.visible'),
};

export const dockerfilePage = {
  enterAppName: (appName: string) => {
    /* eslint-disable-next-line cypress/unsafe-to-chain-command */
    cy.byLegacyTestID('application-form-app-input').clear().type(appName);
  },
  enterName: (name: string) => {
    /* eslint-disable-next-line cypress/unsafe-to-chain-command */
    cy.byLegacyTestID('application-form-app-name').clear().type(name);
  },
};

export const devFilePage = {
  verifyValidatedMessage: (gitUrl: string) => {
    cy.get(gitPO.gitSection.validatedMessage).should(
      'not.have.text',
      messages.addFlow.gitUrlDevfileMessage,
    );
    cy.get(gitPO.gitSection.validatedMessage).should(
      'not.have.text',
      'Validating...',
    );
    if (/(github.com|gitlab.com|bitbucket.com)+/g.test(gitUrl)) {
      cy.get('body').then(($body) => {
        if (
          $body
            .find(gitPO.gitSection.validatedMessage)
            .text()
            .includes(messages.addFlow.rateLimitExceeded)
        ) {
          // Remove .git suffix and remove all parts before the last path
          const componentName = gitUrl
            .replace(/\.git$/, '')
            .replace(/^.*[\\\\/]/, '');
          cy.log(
            `Git Rate limit exceeded for url ${gitUrl}, fill component name "${componentName}" based on the URL to continue tests.`,
          );
          cy.get(gitPO.nodeName).clear();
          cy.get(gitPO.nodeName).type(componentName);
        } else if (
          $body
            .find(gitPO.gitSection.validatedMessage)
            .text()
            .includes(messages.addFlow.privateGitRepoMessage) ||
          $body.find('.warning').length
        ) {
          cy.log(
            `Issue with git url ${gitUrl}, maybe a private repo url. Please check it`,
          );
        }
      });
      cy.get(gitPO.gitSection.validatedMessage).should(
        'have.text',
        'Validated',
      );
    } else {
      cy.get('body').then(($body) => {
        if (
          $body.find('.warning').length ||
          $body.text().includes(messages.addFlow.nonGitRepoMessage)
        ) {
          cy.log(`Not a git url ${gitUrl}. Please check it`);
        }
      });
    }
  },
};
