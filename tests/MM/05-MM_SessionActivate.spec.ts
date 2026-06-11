
/**
 * Author: Srinivasa Rao Allamsetti
 * This test file validates the MM Session Start functionality.
 * It verifies finding a newly created session, starting it,
 * and waiting for status change to Completed.
 */

import { test, expect } from '@playwright/test';
import { MM_LoginPage } from '../../pages/MM_LoginPage';
import { MM_SessionsPage } from '../../pages/MM_SessionsPage';
import 'dotenv/config';

test.describe('@MMsanity MM Session Start Validations', () => {

  let loginPage: MM_LoginPage;
  let mmSessionsPage: MM_SessionsPage;

  test.beforeEach(async ({ page }) => {

    loginPage = new MM_LoginPage(page);
    mmSessionsPage = new MM_SessionsPage(page);

    await loginPage.goto();

    await loginPage.login(
      process.env.MM_USERNAME!,
      process.env.MM_PASSWORD!
    );

    await page.waitForTimeout(3000);

  });

  test(
    'MM Session Start - Verify status handling for Srini_MM_AT_Newsession',
    async ({ page }) => {

      test.setTimeout(420000);

      const fullUrl =
        'https://cdn-edge-service-qa1.cloudmt.managed.netcracker.cloud/fragment/migration-ui/sessions';

      await mmSessionsPage.navigateToMMSession(fullUrl);

      await expect(page).toHaveURL(/sessions$/);

      const nameContains = 'Srini_MM_AT_Newsession';

      console.log(
        `Searching for sessions containing: ${nameContains} `
      );

      // Search sessions
      await mmSessionsPage.searchSession(nameContains);

      const sessionNameRegex = new RegExp(
        nameContains.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&'
        )
      );

      await page.waitForTimeout(3000);

      const candidateRowLinks = page
        .getByRole('link')
        .filter({ hasText: sessionNameRegex });

      const sessionCount =
        await candidateRowLinks.count();

      console.log(
        `Found ${sessionCount} matching session(s)`
      );

      if (sessionCount === 0) {

        console.log(
          `No matching session found for: ${nameContains} `
        );

        return;
      }

      // Iterate through matching sessions
      for (let i = 0; i < sessionCount; i++) {

        // Re-query every iteration
        const currentLinks = page
          .getByRole('link')
          .filter({ hasText: sessionNameRegex });

        const currentCount =
          await currentLinks.count();

        if (currentCount === 0) {
          console.log('No more matching sessions');
          break;
        }

        const link = currentLinks.first();

        const sessionName =
          (await link.textContent())?.trim() ||
          nameContains;

        console.log(
          `Handling session: ${sessionName} `
        );

        // Open session details
        await link.click();

        await page.waitForLoadState(
          'domcontentloaded'
        );

        await page.waitForTimeout(2000);

        // Read current status
        const statusChips = page.locator(
          '.ux-react-chip__text, [class*="status"], .status-text'
        );

        let statusText = '';

        const statusTextLocator = statusChips
          .filter({
            hasText:
              /Not Started|Completed|In Progress|Running/i
          })
          .first();

        if (
          await statusTextLocator
            .isVisible({ timeout: 5000 })
            .catch(() => false)
        ) {

          statusText =
            (await statusTextLocator.textContent())
              ?.trim() || '';

        } else {

          statusText =
            (await statusChips.first().textContent())
              ?.trim() || '';
        }

        const normalizedStatus =
          statusText.toLowerCase();

        console.log(
          `Current status for ${sessionName}: ${statusText} `
        );

        // =====================================================
        // COMPLETED SESSION
        // =====================================================

        if (
          normalizedStatus.includes('completed')
        ) {

          console.log(
            `Session already completed: ${sessionName} `
          );

          await page.goBack();

          await expect(page).toHaveURL(
            /sessions$/
          );

          await mmSessionsPage.searchSession(
            nameContains
          );

          continue;
        }

        // =====================================================
        // NOT STARTED SESSION
        // =====================================================

        if (
          normalizedStatus.includes('not started')
        ) {

          console.log(
            `Starting session: ${sessionName} `
          );

          const startButton = page
            .locator('span')
            .filter({ hasText: 'Start' })
            .last();

          await expect(startButton).toBeVisible({
            timeout: 10000
          });

          await expect(startButton).toBeEnabled();

          await startButton.click({
            force: true
          });

          console.log('Start button clicked');

          // Wait for status to change from Not Started first
          await expect.poll(

            async () => {

              const statusChips = page.locator(
                '.ux-react-chip__text, [class*="status"], .status-text'
              );

              const texts =
                await statusChips.allTextContents();

              return texts
                .join('|')
                .toLowerCase();

            },
            {
              timeout: 60000,
              intervals: [5000],
              message:
                'Session never moved out of Not Started state'
            }

          ).not.toContain('not started');

          console.log(
            'Session execution actually started'
          );

          console.log(
            'Waiting for session completion...'
          );

          // Wait until session becomes Completed
          await expect.poll(

            async () => {

              await page.reload();

              // Wait for session details page to reload
              await expect(
                page.getByText('General Info')
              ).toBeVisible({
                timeout: 20000
              });

              const statusChips = page.locator(
                '.ux-react-chip__text, [class*="status"], .status-text'
              );

              const texts =
                await statusChips.allTextContents();

              const normalized = texts
                .map(t => t.trim())
                .filter(Boolean)
                .join('|')
                .toLowerCase();

              console.log(
                `Current polled status: ${normalized} `
              );

              // Fail immediately if failed
              if (
                normalized.includes('failed') ||
                normalized.includes('error')
              ) {

                throw new Error(
                  `Session failed with status: ${normalized} `
                );
              }

              return normalized;

            },

            {
              timeout: 360000, // 6 mins
              intervals: [10000], // 10 sec polling
              message:
                'Timed out waiting for session completion'
            }

          ).toContain('completed');

          console.log(
            `Session ${sessionName} completed successfully`
          );

          // Go back to sessions page
          await page.goBack();

          await expect(page).toHaveURL(
            /sessions$/
          );

          await mmSessionsPage.searchSession(
            nameContains
          );

          continue;
        }

        // =====================================================
        // IN PROGRESS / RUNNING
        // =====================================================

        if (
          normalizedStatus.includes('running') ||
          normalizedStatus.includes('progress')
        ) {

          console.log(
            `Session already running: ${sessionName} `
          );

          await expect.poll(
            async () => {

              await page.reload({
                waitUntil: 'networkidle'
              });

              const status = (
                await page.locator('.ux-react-chip__text')
                  .first()
                  .textContent()
              )?.trim()
                .toLowerCase() || '';

              console.log(`Current running status: ${status}`);

              if (
                status.includes('failed') ||
                status.includes('error')
              ) {
                throw new Error(
                  `Session failed with status: ${status}`
                );
              }

              return status;

            },
            {
              timeout: 900000,
              intervals: [15000],
              message:
                'Timed out waiting for running session completion'
            }
          ).toContain('completed');
          console.log(
            `Running session ${sessionName} completed`
          );

          await page.goBack();

          await expect(page).toHaveURL(
            /sessions$/
          );

          await mmSessionsPage.searchSession(
            nameContains
          );

          continue;
        }

        // =====================================================
        // UNKNOWN STATUS
        // =====================================================

        console.log(
          `Unknown status encountered: ${statusText} `
        );

        await page.goBack();

        await expect(page).toHaveURL(
          /sessions$/
        );

        await mmSessionsPage.searchSession(
          nameContains
        );

      }

    }

  );

});
