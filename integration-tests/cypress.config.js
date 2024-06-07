const { defineConfig } = require('cypress');

module.exports = defineConfig({
  viewportWidth: 1920,
  viewportHeight: 1080,
  defaultCommandTimeout: 40000,
  animationDistanceThreshold: 20,
  execTimeout: 90000,
  pageLoadTimeout: 90000,
  requestTimeout: 15000,
  responseTimeout: 15000,
  screenshotsFolder: './screenshots',
  videosFolder: './videos',
  video: true,
  reporter: '../../node_modules/cypress-multi-reporters',
  reporterOptions: {
    configFile: 'reporter-config.json',
  },
  fixturesFolder: 'fixtures',
  chromeWebSecurity: false,
  env: {
    TAGS: '@pipelines and (@pre-condition or @smoke or @regression) and not (@manual or @to-do or @un-verified or @broken-test)',
    NAMESPACE: 'aut-pipelines',
  },
  retries: {
    runMode: 1,
    openMode: 0,
  },
  e2e: {
    setupNodeEvents(on, config) {
      return require('./plugins/index.ts')(on, config);
    },
    specPattern: 'features/**/*{feature,features}',
    supportFile: 'support/commands/index.ts',
    baseUrl: 'http://localhost:9000',
    // testIsolation: false,
    experimentalMemoryManagement: true,
    numTestsKeptInMemory: 5,
  },
});
