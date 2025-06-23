/* eslint-disable global-require */
import { addCucumberPreprocessorPlugin } from '@badeball/cypress-cucumber-preprocessor';
import * as webpack from '@cypress/webpack-preprocessor';
import { defineConfig } from 'cypress';
import * as fs from 'fs';

async function setupNodeEvents(
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions,
): Promise<Cypress.PluginConfigOptions> {
  // This is required for the preprocessor to be able to generate JSON reports after each run, and more,
  await addCucumberPreprocessorPlugin(on, config);

  on(
    'file:preprocessor',
    webpack({
      webpackOptions: {
        resolve: {
          extensions: ['.ts', '.js', '.tsx'],
        },
        module: {
          rules: [
            {
              test: /\.tsx?$/,
              type: 'javascript/auto',
              use: [
                {
                  loader: 'ts-loader',
                },
              ],
            },
            {
              test: /\.feature$/,
              use: [
                {
                  loader: '@badeball/cypress-cucumber-preprocessor/webpack',
                  options: config,
                },
              ],
            },
            {
              test: /node_modules\/yaml\/browser\/dist\/.*/,
              type: 'javascript/auto',
              use: {
                loader: 'babel-loader',
                options: {
                  presets: ['@babel/preset-env'],
                },
              },
            },
          ],
        },
      },
    }),
  );

  on('task', {
    log(message) {
      console.log(message);
      return null;
    },
    logError(message) {
      console.error(message);
      return null;
    },
    logTable(data) {
      console.table(data);
      return null;
    },
    readFileIfExists(filename) {
      if (fs.existsSync(filename)) {
        return fs.readFileSync(filename, 'utf8');
      }
      return null;
    },
  });
  config.baseUrl = `${
    process.env.BRIDGE_BASE_ADDRESS || 'http://localhost:9000/'
  }`;
  config.env.BRIDGE_KUBEADMIN_PASSWORD = process.env.BRIDGE_KUBEADMIN_PASSWORD;
  return config;
}

export default defineConfig({
  viewportWidth: 1920,
  viewportHeight: 1080,
  watchForFileChanges: true,
  defaultCommandTimeout: 40000,
  animationDistanceThreshold: 20,
  execTimeout: 90000,
  pageLoadTimeout: 90000,
  requestTimeout: 15000,
  responseTimeout: 15000,
  screenshotsFolder: './gui_test_screenshots/cypress/screenshots',
  videosFolder: './gui_test_screenshots/cypress/videos',
  video: true,
  reporter: '../node_modules/cypress-multi-reporters',
  reporterOptions: {
    configFile: 'reporter-config.json',
  },
  fixturesFolder: 'cypress/testData',
  chromeWebSecurity: false,
  env: {
    TAGS: '(@pre-condition or @smoke or @regression) and not (@manual or @to-do or @un-verified or @broken-test)',
    NAMESPACE: 'aut-pipelines',
  },
  retries: {
    runMode: 1,
    openMode: 0,
  },
  e2e: {
    setupNodeEvents,
    specPattern: 'cypress/features/**/*{feature,features}',
    supportFile: 'cypress/support/commands/index.ts',
    baseUrl: 'http://localhost:9000',
    experimentalMemoryManagement: true,
    testIsolation: false,
    numTestsKeptInMemory: 5,
  },
});
