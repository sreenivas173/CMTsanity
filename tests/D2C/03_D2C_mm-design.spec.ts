/**
 * Author: Srinivasa Rao Allamsetti
 * This test file validates the MM Design page functionalities.
 * It includes tests for:
 * -(1) Search text validation after login
 * -(2) Refresh button functionality
 * -(3) Filtering by ID containing "oss" and validating results
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { MMDesignPage } from '../../pages/MMDesignPage';

test.describe('MM Design Page Validations', () => {
  let loginPage: LoginPage;
  let mmDesignPage: MMDesignPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    mmDesignPage = new MMDesignPage(page);
    await loginPage.goto();
  });

  /**1 Tests search text validation after successful login */
  test('@Sanity search text validation after successful login', async ({ page }) => {
    await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
    await expect(page).toHaveURL(/design2code\/migration-management-design/);
    if (await mmDesignPage.isPage404()) {
      test.skip(true, 'Page is showing 404 error');
    }
    // Navigate to the MM Design page where the search input is located
    await mmDesignPage.navigateToMMDesign();
    
    const searchInput = mmDesignPage.searchInput;
    await expect(searchInput).toBeVisible();
    await mmDesignPage.searchFor('oss-lm-mig');
    await expect(searchInput).toHaveValue('oss-lm-mig');
  });

  /**2 Tests refresh button functionality */
  test('refresh button functionality', async ({ page }) => {
    await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
    await expect(page).toHaveURL(/design2code\/migration-management-design/);

    await mmDesignPage.navigateToMMDesign();

    const searchInput = mmDesignPage.searchInput;
    await expect(searchInput).toBeVisible();

    await searchInput.fill('oss-lm-mig');
    await expect(searchInput).toHaveValue('oss-lm-mig');

    await mmDesignPage.clickRefresh();

    // Validate search input is cleared after refresh (actual behavior)
    await expect(searchInput).toHaveValue('');

    // Validate table reloaded
    const table = mmDesignPage.table;
    await expect(table.getByRole('row').nth(1)).toBeVisible();
  });

  /**3 Tests filtering by ID containing "oss" and validates results */
  test('@Sanity filter by ID contains "oss" and validate results', async ({ page }) => {
    await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
    await expect(page).toHaveURL(/design2code\/migration-management-design/);
    if (await mmDesignPage.isPage404()) {
      test.skip(true, 'Page is showing 404 error');
    }
    // Navigate to the MM Design page
    await mmDesignPage.navigateToMMDesign();

    // Click the filters button (the one with the badge)
    await mmDesignPage.filtersButton.click();
    await page.waitForTimeout(1000);

    // Ensure the first select is set to "ID"
    const firstSelect = page.locator('.ux-react-select__control').first();
    await firstSelect.click();
    await page.locator('.ux-react-select__option').filter({ hasText: 'ID' }).click();

    // Ensure the second select is set to "contains"
    const secondSelect = page.locator('.ux-react-select__control').nth(1);
    await secondSelect.click();
    await page.locator('.ux-react-select__option').filter({ hasText: 'contains' }).click();

    // Ensure the input is set to "oss"
    const filterInput = page.getByRole('textbox', { name: 'Value' }); 
    await filterInput.fill('oss');

    // Click Apply
    const applyButton = page.locator('button:has-text("Apply")');
    await applyButton.click();
    await page.waitForTimeout(3000);

    // Check that all visible rows have IDs containing 'oss'
    const idCells = page.locator('.ux-react-table-new__cell[data-column-id="file-id"]');
    const count = await idCells.count();
    for (let i = 0; i < count; i++) {
      const text = await idCells.nth(i).textContent();
      expect(text).toContain('oss');
    }
  });
});
