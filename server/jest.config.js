// Jest config for the server workspace. Tests live next to the code they
// cover, under `shared/<module>/__tests__/`. We set rootDir to the repo
// root so jest can resolve `require('../../../../server/models')` paths
// used by shared services exactly as they run at runtime.
module.exports = {
  rootDir: '..',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/shared/**/__tests__/**/*.test.js'],
  // resetMocks (not clearMocks) so mockResolvedValueOnce queues don't leak
  // between tests in the same suite — clearMocks only clears mock.calls,
  // not pending implementations.
  resetMocks: true,
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'starter-saas unit tests',
      outputPath: '<rootDir>/test-results/unit-tests.html',
      includeFailureMsg: true,
      includeSuiteFailure: true,
      includeConsoleLog: false,
    }],
  ],
}
