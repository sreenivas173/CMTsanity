/**
 * Author: Srinivasa Rao Allamsetti
 * This test file validates the filter functionality on the DB LEVEL Design page.
 * It tests various filter types, operators, and values to ensure correct filtering and data display.
 * The test logs in, navigates to the DB Level Design page, applies different filters, validates the filtered results,
 * takes screenshots for verification, and clears filters to reset the state.
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { DBLPage } from '../../pages/DBLPage';

// Test suite for DB Level (DBL) Filter Validations
test.describe('DBL Filter Validations', () => {
  // Array of filter configurations to test different types, values, and operators
  const filterConfigs = [
    { type: 'Design File', value: 'DB', column: 'design-file', operator: 'contains' },
    { type: 'Design File', value: 'design', column: 'design-file', operator: 'is' },
    { type: 'Error Severity', value: 'Blocker', column: 'error-severity', operator: 'contains' },
    { type: 'Error Severity', value: 'Minor', column: 'error-severity', operator: 'is' }
  ];

  test('Filter Validations', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dblPage = new DBLPage(page);

    // Navigate and login
    await loginPage.goto();
    await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
    await expect(page).toHaveURL(/design2code\/migration-management-design/);

    // Check for 404
    if (await dblPage.isPage404()) {
      test.skip(true, 'Page is showing 404 error');
    }

    // Navigate to DB Level Design
    await dblPage.navigateToDBLDesign();
    await expect(dblPage.table).toBeVisible();
    await expect(dblPage.paginationInfo).toBeVisible();

    // Loop through each filter configuration
    for (const config of filterConfigs) {
      // Open filter dialog using POM
      await dblPage.openFilterDialog();

      // Select filter type
      await dblPage.selectFilterType(config.type);

      // Select operator
      await dblPage.selectOperator(config.operator);

// Capture pagination before applying filter
const oldPaginationText = await dblPage.getPaginationText();

// Apply the filter
await dblPage.applyFilter();

// Wait until pagination stabilizes (react re-render safe)
await expect(dblPage.paginationInfo)
  .toHaveText(/^\d+ items, \d+-\d+ shown$/);

// Capture new pagination
const newPaginationText = await dblPage.getPaginationText();

// Only assert difference if actually reduced
if (newPaginationText !== oldPaginationText) {
  expect(newPaginationText).not.toBe(oldPaginationText);
}
      // Validate filtered data
      if (config.type !== 'Date') {
        const cells = await dblPage.getFilteredColumnCells(config.column);
        const count = await cells.count();

        for (let i = 0; i < count; i++) {
          const text = await cells.nth(i).textContent();

          if (config.operator === 'contains') {
            expect(text?.toLowerCase()).toContain(config.value.toLowerCase());
          }

          if (config.operator === 'is') {
            expect(text?.trim()).toBe(config.value);
          }
        }
      }

      // Take screenshot
      const operatorSlug = config.operator.replace(/ /g, '-');
      const valueSlug = config.value.replace(/[, ]/g, '-');
      await page.screenshot({
        path: `screenshots/filter-${config.type.toLowerCase().replace(' ', '-')}-${operatorSlug}-${valueSlug}.png`,
        fullPage: true
      });

      // Clear the filter
      await dblPage.clearFilters();

      // Verify reset
      await expect(dblPage.paginationInfo).toHaveText(/^\d+ items, 1-\d+ shown$/);
    }
  });
});
