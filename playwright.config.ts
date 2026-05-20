// import { defineConfig, devices } from '@playwright/test';


// function getTimestamp() {
//   const now = new Date();
//   return now.toISOString().replace(/[:.]/g, '-');
// }

// const runTimestamp = getTimestamp();

// export default defineConfig({
//   testDir: './tests',
//   fullyParallel: false,
//   outputDir: `results/${runTimestamp}`,
//   // forbidOnly: !!process.env.CI,
//   // retries: process.env.CI ? 2 : 0,

//   //To run the test files in sequential order -- alphabetic order 
//   workers: 1,

//   reporter: [
//     ['html', { outputFolder: 'playwright-report', open: 'never' }],
//     ['json', { outputFile: 'report.json' }]
//   ],
//   use: {
//     trace: 'on-first-retry',
//     screenshot: 'on',
//     video: 'on'
//   },
//   projects: [
//     {
//       name: 'QA1_D2C',
//       use: {
//         ...devices['Desktop Chrome'],
//         baseURL: 'https://migration-design2code-ui-qa1.cloudmt.managed.netcracker.cloud/'
//       },
//     },
   
//     {
//        name: 'QA1_MM',
//        use: {
//          ...devices['Desktop Chrome'],
//          baseURL: 'https://cdn-edge-service-qa1.cloudmt.managed.netcracker.cloud/'
//        },
//      }
//     // { 
//     //   name: 'QA3', 
//     //   use: { ...devices['Desktop Chrome'],
//     //   baseURL: 'https://migration-design2code-ui-qa3.cloudmt.managed.netcracker.cloud/' },,
//     // },

//     // {
//     //   name: 'DEV1',
//     //    use: { ...devices['Desktop Chrome'],
//     //    baseURL: 'https://migration-design2code-ui-dev1.cloudmt.managed.netcracker.cloud' },
//     // },

//   ],

// });


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
  workers: 1,

  // Default reporters (used if you run all tests together)
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
      testDir: './tests/D2C',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://migration-design2code-ui-qa1.cloudmt.managed.netcracker.cloud/'
      },
      reporter: [
        ['html', { outputFolder: 'd2c-report', open: 'never' }],
        ['json', { outputFile: 'd2c-report.json' }]
      ]
    },
    {
      name: 'QA1_MM',
      testDir: './tests/MM',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://cdn-edge-service-qa1.cloudmt.managed.netcracker.cloud/'
      },
      reporter: [
        ['html', { outputFolder: 'mm-report', open: 'never' }],
        ['json', { outputFile: 'mm-report.json' }]
      ]
    }
    // You can add QA3, DEV1, etc. later with their own reporter configs
  ],
});
