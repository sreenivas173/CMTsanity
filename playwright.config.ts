import { defineConfig, devices } from '@playwright/test';


function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-');
}

const runTimestamp = getTimestamp();

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  outputDir: `results/${runTimestamp}`,
  // forbidOnly: !!process.env.CI,
  // retries: process.env.CI ? 2 : 0,

  //To run the test files in sequential order -- alphabetic order 
  workers: 1,

  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'report.json' }]
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'on'
  },
  projects: [
    {
      name: 'QA1_D2C',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://migration-design2code-ui-qa1.cloudmt.managed.netcracker.cloud/'
      },
    },
   
    {
       name: 'QA1_MM',
       use: {
         ...devices['Desktop Chrome'],
         baseURL: 'https://cdn-edge-service-qa1.cloudmt.managed.netcracker.cloud/'
       },
     }
    // { 
    //   name: 'QA3', 
    //   use: { ...devices['Desktop Chrome'],
    //   baseURL: 'https://migration-design2code-ui-qa3.cloudmt.managed.netcracker.cloud/' },,
    // },

    // {
    //   name: 'DEV1',
    //    use: { ...devices['Desktop Chrome'],
    //    baseURL: 'https://migration-design2code-ui-dev1.cloudmt.managed.netcracker.cloud' },
    // },

  ],

});
