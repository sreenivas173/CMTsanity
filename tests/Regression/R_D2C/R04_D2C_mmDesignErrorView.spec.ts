/**
 * Author: Srinivasa Rao Allamsetti
 *
 * R04_D2C_mmDesignErrorView
 * Validate MM Design Error View functionality.
 */

import { test, expect } from '@playwright/test';
import 'dotenv/config';

import { LoginPage } from '../../../pages/LoginPage';
import { MMDesignPage } from '../../../pages/MMDesignPage';
import { clearPotFolder, capturePotStep } from '../../../utils/PotHelper';
import { generatePotDocument } from '../../../utils/WordGenerator';

test.describe('@D2CRegression MM Design Error View Validation', () => {
  test('R04_D2C_mmDesignErrorView', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const mmDesignPage = new MMDesignPage(page);

    clearPotFolder('D2C', 'R04_D2C_mmDesignErrorView');

    await loginPage.goto();

    await loginPage.login(
      process.env.D2C_USERNAME!,
      process.env.D2C_PASSWORD!
    );

    await capturePotStep(
      page,
      'D2C',
      'R04_D2C_mmDesignErrorView',
      1,
      'Login Page'
    );

    await expect(page).toHaveURL(/design2code\/migration-management-design/);

    await mmDesignPage.navigateToMMDesign();

    await capturePotStep(
      page,
      'D2C',
      'R04_D2C_mmDesignErrorView',
      2,
      'MM Design page'
    );

    // Sort Error Severity ascending
    await page.getByText('Error Severity', { exact: true }).click();
    await page.getByText('Sort Ascending', { exact: true }).click();

    // Search for oss
    await page.getByPlaceholder('Search').fill('oss');

    const firstRow = page.getByRole('row').nth(1);
    await expect(firstRow).toBeVisible({ timeout: 15000 });

    await capturePotStep(
      page,
      'D2C',
      'R04_D2C_mmDesignErrorView',
      3,
      'Search results'
    );

    // Hover row to reveal menu
    await firstRow.hover();
    await page.waitForTimeout(1000);

    // 3-dot menu
    const menuButton = firstRow
      .locator('xpath=..')
      .locator('button')
      .first();

    await expect(menuButton).toBeVisible({ timeout: 10000 });
    await menuButton.click();

    // Open View Errors
    await page.getByText('View Errors', { exact: true }).click();

    await capturePotStep(
      page,
      'D2C',
      'R04_D2C_mmDesignErrorView',
      4,
      'View Errors page'
    );

    // Click ID node in the tree
    // Expand all error files
    const expandAllBtn = page.getByRole('button', {
      name: /Expand All/i
    });

    await expect(expandAllBtn).toBeVisible({
      timeout: 15000
    });

    await expandAllBtn.click();

    const firstFile = page
      .locator('text=/.*\\.xlsx/')
      .first();

    await expect(firstFile).toBeVisible();

    await firstFile.click();



    // Wait for the first error row (table rows may take time to render)
    await expect(page.getByRole('table')).toBeVisible({ timeout: 15000 });

    // Error page may have multiple tables/trees; target the visible error grid rows.
    // Use the first table on the page and pick its first data row.
    const errorTable = page.getByRole('table').last();
    await expect(errorTable).toBeVisible({ timeout: 15000 });

    const firstErrorRow = errorTable.getByRole('row').nth(1);


    await expect(firstErrorRow).toBeVisible({
      timeout: 15000
    });
    await expect(firstErrorRow).toBeVisible({ timeout: 30000 });



    // Hover first error row to reveal expand arrow
    // Hover first error row to reveal Message button
    await firstErrorRow.hover();

    await page.waitForTimeout(1000);

    // Click Message button
    const messageButton = page.getByRole('button', {
      name: 'Message'
    });

    await expect(messageButton).toBeVisible({
      timeout: 10000
    });

    await messageButton.click();

    await capturePotStep(
      page,
      'D2C',
      'R04_D2C_mmDesignErrorView',
      5,
      'Expanded error details'
    );
    console.log(
      await page.locator('[role="tree"]').textContent()
    );
    // Verify the message/details window appears
    const messageDialog = page.getByRole('dialog');

    await expect(messageDialog).toBeVisible({
      timeout: 15000
    });

    await expect(
      messageDialog.getByRole('button', { name: 'Close' })
    ).toBeVisible({
      timeout: 15000
    });

    await generatePotDocument('D2C', 'R04_D2C_mmDesignErrorView');
  });
});

