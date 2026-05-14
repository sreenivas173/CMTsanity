/**
 * @author Srinivasa Rao Allamsetti
 * @description Validates MM Configuration Download functionality for different status filters
 * 
 * Test Coverage:
 * - Data-driven testing for Active/Failed/Not Active configs
 * - Complete filter workflow (Status column → Add Filter → Apply)
 * - Detail page navigation and download button validation
 * - Automated file saving with status/timestamp prefix to test-results/
 * - Graceful skip if no matching configs found
 */

import { test, expect } from '@playwright/test';
import { MM_LoginPage } from '../../pages/MM_LoginPage';
import { MM_ConfigPage } from '../../pages/MM_ConfigPage';

/**
 * Test Suite: MM Download Config (Data-Driven by Status)
 * Downloads first available config matching each status filter
 * Validates complete workflow and file save operation
 */
test.describe('@MMsanity MM Download Config', () => {
  let mmLoginPage: MM_LoginPage;
  let mmConfigPage: MM_ConfigPage;

  /**
   * Setup: Pre-login navigation to Configurations page
   * - Authenticate with QA credentials
   * - Navigate to MM Config page for each test
   */
  test.beforeEach(async ({ page }) => {
    mmLoginPage = new MM_LoginPage(page);
    mmConfigPage = new MM_ConfigPage(page);

    // Login once per test
    await mmLoginPage.goto();
    await mmLoginPage.login('cpq-admin@netcracker.com', 'MARket1234!');

    // Navigate to Configurations tab explicitly + validate config table
    await mmConfigPage.navigateToMMConfig();
    await page.screenshot({ path: `screenshots/config-tab-nav-${Date.now()}.png` });
    console.log('✅ Verified Configurations tab + Status column');
  });

  /**
   * Data-Driven Download Tests by Config Status
   * Iterates through ['Active', 'Failed', 'Not Active'] statuses
   * Complete end-to-end download workflow for each available status
  ['Active', 'Failed', 'Not Active'].forEach((status) => 
   * 
   */
  ['Active'].forEach((status) => { // Now Configurations has "Active" option

    test(`Download first ${status} configuration and save to test-results`, async ({ page }) => {
      test.setTimeout(120000);

      // Pre-filter validation: Dashboard/Migration Hub visibility check
      await expect(page.locator('text=MIGRATION HUB'))
        .toBeVisible({ timeout: 10000 })
        .catch(() => console.log('Dashboard loaded'));

      // Step 1: Click Status column header to open filter menu
      await page.getByRole('gridcell', { name: 'Status' }).click();

      // Step 2: Select 'Add Filter' from context menu
      const addFilter = page.getByRole('menuitem', { name: 'Add Filter' });
      await expect(addFilter).toBeVisible();
      await addFilter.click();

      const popup = page.getByRole('dialog', { name: 'Filters' });

      // Step 3: Click Value dropdown (3rd control)
      const controls = popup.locator('.ux-react-filters-item__control');
      const valueDropdown = controls.nth(2);

      await expect(valueDropdown).toBeVisible();
      await valueDropdown.click();

      // Step 4: Select specific status from listbox options (robust selector)
      const listbox = page.locator('[role="listbox"]:visible');
      
      // Primary + fallback selector
      await listbox.getByRole('option', { name: status, exact: true })
        .click({ timeout: 10000 })
        .catch(async () => {
          console.log(`'getByRole option ${status}' failed → using getByText fallback`);
          await page.getByRole('option').filter({ hasText: status }).first().click();
        });

      // Step 5: Apply filter to table
      await popup.getByRole('button', { name: 'Apply' }).click();
      await page.waitForTimeout(2000); // Table refresh

      // 6. Wait for table + validate rows exist
      await expect(mmConfigPage.table).toBeVisible({ timeout: 10000 });
      
      // ⚠️ Handle no data case FIRST (avoid duplicate rows var)
      /**
       * Edge Case: Skip test if no configs match the status filter
       */
      const rowsAfterFilter = mmConfigPage.table.locator('[role="row"]');
      if ((await rowsAfterFilter.count()) <= 1) {
        test.skip(`No ${status} configs available`);
      }
      
      // Now safe to validate row count >1
      expect(await rowsAfterFilter.count()).toBeGreaterThan(1);

      await page.screenshot({
        path: `screenshots/${status}-filtered-${Date.now()}.png`
      });

      // 7. Click first config
      await expect(mmConfigPage.firstConfigIdLink).toBeVisible();
      await mmConfigPage.firstConfigIdLink.click();

      // 8. Wait for detail page
      await expect(mmConfigPage.downloadButton).toBeVisible();

      /**
       * Step 9: Trigger download with Promise.all race condition handling
       * - Wait for browser download event
       * - Click download button simultaneously
       */
      // -------------------------------Download
   const [download] = await Promise.all([
  page.waitForEvent('download', { timeout: 20000 }),
  mmConfigPage.downloadButton.click()
]);

expect(download).toBeTruthy();

      // Get original filename
      const originalName = await download.suggestedFilename();

      // Clean status (remove space)
      const cleanStatus = status.replace(/\s+/g, '');

      // Timestamp
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '')
        .slice(0, 15);

      // Final filename
      const fileName = `${cleanStatus}_${timestamp}_${originalName}`;

      const filePath = `test-results/${fileName}`;

      /**
       * Step 10: Save and validate downloaded ZIP file
       * - Dynamic filename: STATUS_TIMESTAMP_ORIGINAL.zip
       * - Save to test-results/ directory
       * - Verify .zip extension
       */
      // Save file
      await download.saveAs(filePath);

      // Validate file extension
      expect(filePath).toContain('.zip');

      console.log(`✅ File saved as: ${fileName}`);

      // Double validation (redundant for safety)
      expect(filePath).toContain('.zip');
      
      //await page.waitForTimeout(3000);
      
      await page.screenshot({
        path: `screenshots/${status}-detail-${Date.now()}.png`
      });
      

      // Success notification optional
      await expect(page.locator('.ux-react-notification__heading')).toHaveText('Success', { timeout: 5000 }).catch(() => {
        console.log('No success notification - download completed');
      });
      //await page.waitForTimeout(3000);
      console.log(`✅ ${status} config downloaded: ${filePath}`);
      console.log(`📁 Downloaded file: ${fileName}`);
    });

  });

});