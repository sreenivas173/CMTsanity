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
  ],
});
