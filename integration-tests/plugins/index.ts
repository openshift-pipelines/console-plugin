/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
// import * as wp from '@cypress/webpack-preprocessor';
const fs = require('fs');
// const cucumber = require('cypress-cucumber-preprocessor').default;
const webpack = require('@cypress/webpack-preprocessor');

module.exports = (on, config) => {
  const options = {
    webpackOptions: {
      resolve: {
        extensions: ['.ts', '.tsx', '.js'],
      },
      node: {
        fs: 'empty',
        child_process: 'empty',
        readline: 'empty',
      },
      module: {
        rules: [
          // {
          //   test: /\.tsx?$/,
          //   loader: 'ts-loader',
          //   options: { happyPackMode: true, transpileOnly: true },
          // },
          {
            test: /\.tsx?$/,
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
            },
          },
          {
            test: /\.feature$/,
            use: [
              {
                loader: 'cypress-cucumber-preprocessor/loader',
              },
            ],
          },
          {
            test: /\.features$/,
            use: [
              {
                loader: 'cypress-cucumber-preprocessor/lib/featuresLoader',
              },
            ],
          },
        ],
      },
    },
  };
  // `on` is used to hook into various events Cypress emits
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
  on('file:preprocessor', webpack(options));
  // on('file:preprocessor', cucumber());
  // `config` is the resolved Cypress config
  on('before:browser:launch', (browser = {}, launchOptions) => {
    if (browser.family === 'chromium' && browser.name !== 'electron') {
      launchOptions.args.push('--disable-dev-shm-usage');
    }
    return launchOptions;
  });
  config.baseUrl = `${
    process.env.BRIDGE_BASE_ADDRESS || 'http://localhost:9000/'
  }`;
  config.env.BRIDGE_KUBEADMIN_PASSWORD = process.env.BRIDGE_KUBEADMIN_PASSWORD;
  return config;
};
