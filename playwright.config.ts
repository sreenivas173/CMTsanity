import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';
function getTimestamp() {
  const now = new Date();
  return now
    .toISOString()
    .replace(/[:.]/g, '-');
}

const runTimestamp =
  getTimestamp();

export default defineConfig({

  testDir: './tests',

  fullyParallel: false,

  workers: 1,

  outputDir:
    `results/${runTimestamp}`,

  reporter: [
    [
      'html',
      {
        outputFolder:
          'playwright-report',
        open:
          'never'
      }
    ],
    [
      'json',
      {
        outputFile:
          'report.json'
      }
    ]
  ],

  use: {

// Global settings for all tests; individual projects can override these.-----------
    channel: 'chrome',
    headless: false,
    ignoreHTTPSErrors: true,
    launchOptions: {
        args: [
            '--start-maximized',
            '--start-fullscreen',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
        ]
    },
    viewport: null,
//==================================================================================

    trace:
      'on-first-retry',

    screenshot:
      'on',

    video:
      'on'

  },

  projects: [

    {
      name:
        'QA1_D2C',

      testDir:
        './tests/D2C',

      use: {

        ...devices[
          'Desktop Chrome'
        ],

        baseURL:
          'https://migration-design2code-ui-qa1.cloudmt.managed.netcracker.cloud/'

      }

    },

    {
      name:
        'QA1_MM',

      testDir:
        './tests/MM',

      use: {

        ...devices[
          'Desktop Chrome'
        ],

        baseURL:
          'https://cdn-edge-service-qa1.cloudmt.managed.netcracker.cloud/'

      }

    },
    
    {
      name:
        'QA1_DMTT',

      testDir:
        './tests/DMTT',

      use: {

        ...devices[
          'Desktop Chrome'
        ],

        baseURL:
          'https://cdn-edge-service-qa1.cloudmt.managed.netcracker.cloud/'
          

      }

    }



  ]

});