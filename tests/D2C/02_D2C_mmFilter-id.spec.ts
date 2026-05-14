/**
 * Author: Srinivasa Rao Allamsetti
 * This test file validates the filter functionality on the MM Design page.
 * It tests various filter types, operators, and values to ensure correct filtering and data display.
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { MMDesignPage } from '../../pages/MMDesignPage';


test.describe('Filter Validations', () => {
  const filterConfigs = [
    { type: 'ID', value: 'oss', column: 'file-id', operator: 'contains' },
    { type: 'ID', value: 'oss', column: 'file-id', operator: 'is' },
    // { type: 'Design File', value: 'design', column: 'design-file', operator: 'contains' },
    // { type: 'Design File', value: 'design', column: 'design-file', operator: 'is' },
    // { type: 'Author', value: 'admin', column: 'author', operator: 'contains' },
    // { type: 'Author', value: 'admin', column: 'author', operator: 'is' },
    // { type: 'Date', value: '2026/02/12, 00:00', column: 'date', operator: 'is before' }
    // { type: 'Date', value: '2026/02/12, 00:00', column: 'date', operator: 'is after' },
    // { type: 'Date', value: '2026/02/12, 00:00', column: 'date', operator: 'is on or before' },
    // { type: 'Date', value: '2026/02/12, 00:00', column: 'date', operator: 'is on or after' },
    { type: 'Error Severity', value: 'error', column: 'error-severity', operator: 'contains' },
    { type: 'Error Severity', value: 'error', column: 'error-severity', operator: 'is' }
  ];

  test('Filter Validations', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const mmDesignPage = new MMDesignPage(page);

    await loginPage.goto();
    await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
    await expect(page).toHaveURL(/design2code\/migration-management-design/);

    if (await mmDesignPage.isPage404()) {
      test.skip(true, 'Page is showing 404 error');
    }

    // Navigate to MM Design
    await mmDesignPage.navigateToMMDesign();

    const table = mmDesignPage.table;
    await expect(table).toBeVisible();

    const filtersButton = mmDesignPage.filtersButton;
    const paginationInfo = mmDesignPage.paginationInfo;

    await expect(paginationInfo).toBeVisible();

    for (const config of filterConfigs) {
      const dialog = mmDesignPage.filterDialog;

      // Ensure dialog closed before opening
      if (await dialog.isVisible()) {
        await dialog.getByRole('button', { name: 'Close' }).click();
        await expect(dialog).toBeHidden();
      }

      // Open filter dialog
      await filtersButton.click();
      await expect(dialog).toBeVisible();

      // ---------------------------
      // Select Filter Type
      // ---------------------------
      const firstSelect = dialog.locator('.ux-react-select__control').first();
      await firstSelect.click();

      const typeOption = page.locator('.ux-react-select__option')
        .filter({ hasText: config.type });

      await expect(typeOption).toBeVisible();
      await typeOption.click();

      // ---------------------------
      // Select Operator
      // ---------------------------
      const secondSelect = dialog.locator('.ux-react-select__control').nth(1);
      await secondSelect.click();

      const operatorOption = page.locator('.ux-react-select__option')
        .filter({ hasText: config.operator });

      await expect(operatorOption).toBeVisible();
      await operatorOption.click();

      // ---------------------------
      // Fill Value (if not Date)
      // ---------------------------
      if (config.type !== 'Date') {
        const filterInput = dialog.getByRole('textbox').last();
        await expect(filterInput).toBeVisible();
        await filterInput.fill(config.value);
      }

      // Capture pagination text BEFORE applying filter
      const oldPaginationText = await paginationInfo.textContent();

      // ---------------------------
      // Click Apply
      // ---------------------------
      await dialog.getByRole('button', { name: 'Apply' }).click();

      // Wait for pagination text to change (table refreshed)
      // await expect(paginationInfo).not.toHaveText(oldPaginationText!);
      const newPaginationText = await paginationInfo.textContent();
      expect(newPaginationText).toMatch(/^\d+ items, \d+-\d+ shown$/);

      // ---------------------------
      // Validate Table Data (Non-Date)
      // ---------------------------
      if (config.type !== 'Date') {
        const cells = page.locator(
          `.ux-react-table-new__cell[data-column-id="${config.column}"]`
        );

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

      // ---------------------------
      // Screenshot
      // ---------------------------
      const operatorSlug = config.operator.replace(/ /g, '-');
      const valueSlug = config.value.replace(/[, ]/g, '-');

      await page.screenshot({
        path: `screenshots/filter-${config.type.toLowerCase().replace(' ', '-')}-${operatorSlug}-${valueSlug}.png`,
        fullPage: true
      });

      // ---------------------------
      // Clear Filter
      // ---------------------------
      await filtersButton.click();
      await expect(dialog).toBeVisible();

      await dialog.getByRole('button', { name: 'Clear All' }).click();
      await dialog.getByRole('button', { name: 'Apply' }).click();

      // Wait for table to repopulate
      await expect(paginationInfo).toHaveText(/^\d+ items, 1-\d+ shown$/);

      const resetText = await paginationInfo.textContent();
      const total = Number(resetText!.match(/^(\d+)/)![1]);
      expect(total).toBeGreaterThan(0);

      // Apply likely closes dialog automatically
      await expect(dialog).toBeHidden();

    }
  });
});
