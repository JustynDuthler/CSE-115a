/*
 * Starts the dev server before all tests start
 */
import 'regenerator-runtime/runtime'
const {setup: setupDevServer} = require('jest-dev-server');

module.exports = async () => {
  await setupDevServer({
    command: 'npm run test-start',
    launchTimeout: 30000,
    debug: true,
    port: 3000,
  });
};
