/**
 * @author Srinivasa Rao Allamsetti
 * @description Validates MM Configuration Activation workflow for "Not Active" configs
 * 
 * Test Coverage:
 * - Filter "Not Active" configs using complete filter UI flow
 * - Navigate to first config detail page
 * - Activate button validation and confirmation dialog handling
 * - Success notification validation
 * - Graceful skip if no eligible configs found
 */

import { test, expect } from '@playwright/test';
import { MM_LoginPage } from '../../pages/MM_LoginPage';
import { MM_ConfigPage } from '../../pages/MM_ConfigPage';

/**
 * Test Suite: MM Activate Config (Target: Not Active Status)
 * Complete activation workflow from filtering through success notification
 */
test.describe('MM Activate Config', () => {
  let mmLoginPage: MM_LoginPage;
  let mmConfigPage: MM_ConfigPage;

  /**
   * Setup: Pre-authentication navigation to Configurations page
   */
  test.beforeEach(async ({ page }) => {
    mmLoginPage = new MM_LoginPage(page);
    mmConfigPage = new MM_ConfigPage(page);

    // Login once per test
    await mmLoginPage.goto();
    await mmLoginPage.login('cpq-admin@netcracker.com', 'MARket1234!');

    await mmConfigPage.navigateToMMConfig();
  });

  /**
   * Single Status Test: Activate first "Not Active" configuration
   * Identical filter workflow to download tests
   * Adds activation button + confirmation + success notification validation
   */
  ['Not Active'].forEach((status) => {

    test(`Activate first ${status} configuration`, async ({ page }) => {
      test.setTimeout(120000);

      // Step 1: Click Status column to open filter menu
      await page.getByRole('gridcell', { name: 'Status' }).click();

      // 2. Add Filter
      const addFilter = page.getByRole('menuitem', { name: 'Add Filter' });
      await expect(addFilter).toBeVisible();
      await addFilter.click();

      const popup = page.getByRole('dialog', { name: 'Filters' });

      // 3. Value dropdown
      const controls = popup.locator('.ux-react-filters-item__control');
      const valueDropdown = controls.nth(2);

      await expect(valueDropdown).toBeVisible();
      await valueDropdown.click();

      // 4. Select status dynamically
      const listbox = page.locator('[role="listbox"]:visible');

      await listbox.getByRole('option', {
        name: status,
        exact: true
      }).click();

      // 5. Apply filter
      await popup.getByRole('button', { name: 'Apply' }).click();

      // 6. Wait for table
      await expect(mmConfigPage.table).toBeVisible({ timeout: 10000 });

      // ⚠️ Handle no data case
      /**
       * Edge Case Handling: Skip if no "Not Active" configs available
       */
      const rows = mmConfigPage.table.locator('[role="row"]');
      if ((await rows.count()) <= 1) {
        test.skip(`No ${status} configs available`);
      }

      await page.screenshot({
        path: `screenshots/${status}-filtered-${Date.now()}.png`
      });

      // 7. Click first config
      await expect(mmConfigPage.firstConfigIdLink).toBeVisible();
      await mmConfigPage.firstConfigIdLink.click();

      // 8. Wait for detail page
      await expect(mmConfigPage.downloadButton).toBeVisible();

      /**
       * Step 9: Locate and click Activate button on detail page
       */
      const activateButton = page.getByRole('button', { name: 'Activate' }).first();

      await expect(activateButton).toBeVisible();
      await activateButton.click();

      /**
       * Step 10: Handle confirmation dialog
       * - Wait for dialog visibility
       * - Click confirmation Activate button
       */
      const confirmDialog = page.getByRole('dialog');

      await expect(confirmDialog).toBeVisible();

      await confirmDialog
        .getByRole('button', { name: 'Activate' })
        .click();

      /**
       * Step 11: Final validation via success notification
       * - Notification visible with timeout
       * - Heading text exactly "Success"
       */
      const notification = page.locator('.ux-react-notification').first();

      await expect(notification).toBeVisible({ timeout: 10000 });

      await expect(
        notification.locator('.ux-react-notification__heading')
      ).toHaveText('Success');

      console.log(`✅ ${status} config activated successfully (via notification)`);
    });

  });

});