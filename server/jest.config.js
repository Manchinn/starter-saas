// Jest config for the server workspace. Tests live next to the code they
// cover, under `shared/<module>/__tests__/`. We set rootDir to the repo
// root so jest can resolve `require('../../../../server/models')` paths
// used by shared services exactly as they run at runtime.
const path = require('path')

module.exports = {
  rootDir: '..',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/shared/**/__tests__/**/*.test.js',
    '<rootDir>/server/**/__tests__/**/*.test.js',
  ],
  // resetMocks (not clearMocks) so mockResolvedValueOnce queues don't leak
  // between tests in the same suite — clearMocks only clears mock.calls,
  // not pending implementations.
  resetMocks: true,
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'starter-saas — unit test report',
      outputPath: '<rootDir>/test-results/unit-tests.html',
      includeFailureMsg: true,
      includeSuiteFailure: true,
      includeConsoleLog: false,
      sort: 'titleAsc',
      // jest-html-reporter does not expand <rootDir> for this option, so
      // pass an absolute path resolved from this config file's location.
      styleOverridePath: path.join(__dirname, 'test-report-style.css'),
    }],
  ],
}
