/* eslint-disable global-require */
// import * as wp from '@cypress/webpack-preprocessor';
const fs = require('fs');
const path = require('path');
const webpack = require('@cypress/webpack-preprocessor');

module.exports = (on, config) => {
  const options = {
    webpackOptions: {
      module: {
        rules: [
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
                loader: '"@badeball/cypress-cucumber-preprocessor/webpack"',
                options: config,
              },
            ],
          },
          {
            test: /\.features$/,
            use: [
              {
                loader: '"@badeball/cypress-cucumber-preprocessor/webpack"',
                options: config,
              },
            ],
          },
        ],
      },
      output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'cypress-dist'),
      },
      resolve: {
        extensions: ['.ts', '.js', '.tsx'],
        fallback: {
          dgram: false,
          fs: false,
          path: false,
          net: false,
          tls: false,
          child_process: false,
          readline: false,
        },
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
  on('before:browser:launch', (browser: any = {}, launchOptions) => {
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
