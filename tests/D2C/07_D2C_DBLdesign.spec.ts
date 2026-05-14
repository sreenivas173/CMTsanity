/**
 * Author: Srinivasa Rao Allamsetti
 * This test file validates the DB Design page functionalities.
 * It includes tests for:
 * -(1) Search text validation after login
 * -(2) Refresh button functionality
 * -(3) Filtering by ID containing "d2c_exam" and validating results
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { DBLPage } from '../../pages/DBLPage';

test.describe('DB Level Design Page Validations', () => {
  let loginPage: LoginPage;
  let dblPage: DBLPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dblPage = new DBLPage(page);
    await loginPage.goto();
  });

  /** Tests search text validation after successful login */
  test('@Sanity search text validation after successful login', async ({ page }) => {
    await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
    await expect(page).toHaveURL(/design2code\/migration-management-design/);
    if (await dblPage.isPage404()) {
      test.skip(true, 'Page is showing 404 error');
    }
    // Navigate to the DB Design page
    await dblPage.navigateToDBLDesign();
    
    // Use POM method for search
    await dblPage.searchFor('d2c_example');
    await expect(dblPage.searchInput).toHaveValue('d2c_example');
  });

  /** Tests refresh button functionality */
  test('refresh button functionality', async ({ page }) => {
    await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
    await expect(page).toHaveURL(/design2code\/migration-management-design/);

    await dblPage.navigateToDBLDesign();
    await expect(dblPage.searchInput).toBeVisible();

    await dblPage.searchFor('d2c_exam');
    await expect(dblPage.searchInput).toHaveValue('d2c_exam');

    // Click refresh using POM method
    await dblPage.clickRefresh();

    // Validate table reloaded
    await expect(dblPage.table).toBeVisible();

    // Validate search cleared (expected behavior)
    await expect(dblPage.searchInput).toHaveValue('');
  });

  /** Filter by ID contains "d2c_exam" and validate results */
  test('@Sanity filter by ID contains "d2c_exam" and validate results', async ({ page }) => {
    await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
    await expect(page).toHaveURL(/design2code\/migration-management-design/);

    await dblPage.navigateToDBLDesign();

    // Use POM method for filtering
    await dblPage.filterByIdContains('d2c_exam');

    // Validate filtered results
    const rows = dblPage.table.getByRole('row');
    const rowCount = await rows.count();

    for (let i = 1; i < rowCount; i++) {
      const fileCell = rows.nth(i).getByRole('gridcell').nth(1);
      await expect(fileCell).toContainText('d2c_exam');
    }
  });
});
