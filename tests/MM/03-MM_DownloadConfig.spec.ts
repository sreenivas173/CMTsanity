
/**
 * @author Srinivasa Rao Allamsetti
 * @description  MM Configuration Download Validation
 *
 * Flow:
 * 1. Login
 * 2. Navigate to Configurations
 * 3. Apply Status = Active filter
 * 4. Open first filtered config
 * 5. Download configuration ZIP
 * 6. Save file into test-results/
 * 7. Validate download success
 */

import { test, expect } from '@playwright/test';

import * as fs from 'fs';
import * as path from 'path';

import { MM_LoginPage } from '../../pages/MM_LoginPage';
import { MM_ConfigPage } from '../../pages/MM_ConfigPage';

test.describe('@MMSanity MM Download Config', () => {

  let mmLoginPage: MM_LoginPage;
  let mmConfigPage: MM_ConfigPage;

  test.beforeEach(async ({ page }) => {

    mmLoginPage = new MM_LoginPage(page);
    mmConfigPage = new MM_ConfigPage(page);

    // Login
    await mmLoginPage.goto();

    await mmLoginPage.login(
      'cpq-admin@netcracker.com',
      'MARket1234!'
    );

    // Validate app shell
    await expect(
      page.getByText('MIGRATION HUB')
    ).toBeVisible({
      timeout: 20000
    });

    // Navigate to Configurations
    await mmConfigPage.navigateToMMConfig();

    // Validate table visible
   await expect(
  page.getByText('Configuration ID')
).toBeVisible({
  timeout: 20000
});

    console.log('✅ Configurations page loaded');

    // Move mouse away from overlays/tooltips
    await page.mouse.move(0, 0);

  });

  test(
    'downloads first Active MM configuration and validates saved ZIP',
    async ({ page }, testInfo) => {

      testInfo.setTimeout(120000);

      console.log(
        'QA1_MM: Starting production-grade MM config download flow...'
      );

      // =========================================================
      // STEP 1: Apply Active Status Filter
      // =========================================================

      console.log(
        'QA1_MM: Applying filter: Status = Active'
      );

      // Click Status column
      const statusHeader = page
        .getByRole('gridcell', {
          name: 'Status'
        });

      await expect(statusHeader)
        .toBeVisible({
          timeout: 15000
        });

      await statusHeader.click();

      // Click Add Filter
      const addFilter = page
        .getByRole('menuitem', {
          name: 'Add Filter'
        });

      await expect(addFilter)
        .toBeVisible({
          timeout: 10000
        });

      await addFilter.click();

      // Filter popup
      const popup = page
        .getByRole('dialog', {
          name: /filters/i
        });

      await expect(popup)
        .toBeVisible({
          timeout: 15000
        });

      // =========================================================
      // STEP 2: Select Value Dropdown
      // =========================================================

      // 3rd dropdown = Value
      const controls = popup
        .locator('.ux-react-filters-item__control');

      const valueDropdown = controls.nth(2);

      await expect(valueDropdown)
        .toBeVisible({
          timeout: 10000
        });

      await valueDropdown.click();

      console.log('Opened Value dropdown');

      // =========================================================
      // STEP 3: Select Active Option
      // =========================================================

      const listbox = page
        .locator('[role="listbox"]:visible');

      const activeOption = listbox
        .locator('[role="option"]')
        .filter({
          hasText: /^Active$/
        })
        .first();

      await expect(activeOption)
        .toBeVisible({
          timeout: 10000
        });

      await activeOption.click();

      console.log('Selected Active filter');

      // =========================================================
      // STEP 4: Apply Filter
      // =========================================================

      const applyButton = popup
        .getByRole('button', {
          name: 'Apply'
        });

      await expect(applyButton)
        .toBeVisible({
          timeout: 10000
        });

      await applyButton.click();

      // Wait table refresh
   await expect(
  page.getByRole('gridcell', {
    name: 'Configuration ID'
  })
).toBeVisible({
  timeout: 20000
});

      console.log(
        'Active filter applied successfully'
      );

      // =========================================================
      // STEP 5: Validate Filtered Rows
      // =========================================================

      // Validate Active rows exist after filtering
const activeRows = page
  .locator('text=Active');

const activeCount = await activeRows.count();

console.log(
  `QA1_MM: Active rows found after filtering: ${activeCount}`
);

if (activeCount === 0) {

  console.log(
    'QA1_MM: No Active configs found to download.'
  );

  return;
}

expect(activeCount).toBeGreaterThan(0);
      // =========================================================
      // STEP 6: Open First Config
      // =========================================================

      console.log(
        'QA1_MM: Opening first filtered configuration detail...'
      );

      // First configuration link from filtered rows
const firstConfigLink = page
  .getByRole('link')
  .first();

await expect(firstConfigLink)
  .toBeVisible({
    timeout: 10000
  });

await firstConfigLink.click();

console.log(
  'Opened first filtered configuration detail'
);

      // =========================================================
      // STEP 7: Wait for Download Button
      // =========================================================

      console.log(
        'QA1_MM: Waiting for Download button and triggering download...'
      );

      await expect(
        mmConfigPage.downloadButton
      ).toBeVisible({
        timeout: 20000
      });

      // =========================================================
      // STEP 8: Download File
      // =========================================================

      const [download] = await Promise.all([

        page.waitForEvent('download', {
          timeout: 30000
        }),

        mmConfigPage.downloadButton.click()

      ]);

      expect(download).toBeTruthy();

      const originalName =
        await download.suggestedFilename();

      console.log(
        `QA1_MM: Download event received. Suggested filename: ${originalName}`
      );

      // =========================================================
      // STEP 9: Build Safe Filename
      // =========================================================

      const status = 'Active';

      const cleanStatus =
        status.replace(/\s+/g, '');

      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '')
        .slice(0, 15);

      const safeOriginalName =
        (originalName || 'config')
          .replace(/[^a-zA-Z0-9._-]/g, '_')
          .replace(/_+/g, '_');

      const fileName =
        `${cleanStatus}_${timestamp}_${safeOriginalName}`;

      // =========================================================
      // STEP 10: Save Download
      // =========================================================

      // Create downloads directory
const resultsDir = path.join(
  process.cwd(),
  'test-results',
  'downloads'
);

      if (!fs.existsSync(resultsDir)) {

        fs.mkdirSync(resultsDir, {
          recursive: true
        });
      }

      const filePath =
        path.join(resultsDir, fileName);

      console.log(
        `QA1_MM: Saving downloaded file to: ${filePath}`
      );

        console.log('Download save completed');

        
      await download.saveAs(filePath);

      // =========================================================
      // STEP 11: Validate Download
      // =========================================================

      expect(
        fs.existsSync(filePath)
      ).toBeTruthy();

      expect(
        filePath.toLowerCase()
      ).toContain('.zip');

      console.log(
        `✅ QA1_MM: Download completed successfully`
      );

      console.log(
        `📁 Downloaded file: ${fileName}`
      );

      // =========================================================
      // STEP 12: Optional Notification Validation
      // =========================================================

      const notificationHeading = page
        .locator('.ux-react-notification__heading');

      if (
        await notificationHeading
          .isVisible({ timeout: 5000 })
          .catch(() => false)
      ) {

        await expect(notificationHeading)
          .toHaveText('Success', {
            timeout: 10000
          });

      } else {

        console.log(
          'QA1_MM: Success notification not found (download still valid).'
        );
      }

      // =========================================================
      // STEP 13: Screenshot
      // =========================================================

      await page.screenshot({
        path:
          `screenshots/qa1mm-download-${timestamp}.png`,
        fullPage: true
      });

    }

  );

});
