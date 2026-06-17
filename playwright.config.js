// playwright.config.js
// This is the "settings" file for Playwright. It tells the test runner
// HOW to run our tests (which folder, which browser, base address, etc.).

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  // Where our test files live.
  testDir: './tests',

  // Each test gets max 30 seconds before it's marked as failed (safety net).
  timeout: 30 * 1000,

  // 'list' prints progress in the terminal; 'html' writes a self-contained
  // report (with the per-test screenshots and the attached axe report) to
  // playwright-report/, which CI uploads as an artifact. open: 'never' stops it
  // popping a browser open on a local run.
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    // The website we are testing. Now in tests we can write page.goto('/')
    // instead of typing the full URL every time.
    baseURL: 'https://gohome.io',

    // Always capture a screenshot so the HTML report carries visual evidence.
    // (Note: 'only-on-failure' would capture nothing here - the tests are marked
    // test.fail(), so an expected failure counts as a pass and never triggers it.)
    screenshot: 'on',
  },

  // Run tests in Chromium (the engine behind Chrome). Kept to one browser for a
  // simple, fast daily check. Firefox/WebKit can be added back here when you
  // want a periodic cross-browser run.
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
