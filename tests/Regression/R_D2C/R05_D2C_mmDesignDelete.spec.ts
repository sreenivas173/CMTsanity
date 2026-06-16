/**
 * Author: Srinivasa Rao Allamsetti
 *
 * R05_D2C_mmDesignDelete
 * Validate MM Design Delete functionality.
 */

import { test, expect } from '@playwright/test';
import 'dotenv/config';

import { LoginPage } from '../../../pages/LoginPage';
import { MMDesignPage } from '../../../pages/MMDesignPage';
import { clearPotFolder, capturePotStep } from '../../../utils/PotHelper';
import { generatePotDocument } from '../../../utils/WordGenerator';

test.describe('@D2CRegression MM Design Delete Validation', () => {
  test('R05_D2C_mmDesignDelete', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const mmDesignPage = new MMDesignPage(page);

    clearPotFolder('D2C', 'R05_D2C_mmDesignDelete');

    await loginPage.goto();

    await loginPage.login(process.env.D2C_USERNAME!, process.env.D2C_PASSWORD!);

    await capturePotStep(page, 'D2C', 'R05_D2C_mmDesignDelete', 1, 'Login Page');

    await expect(page).toHaveURL(/design2code\/migration-management-design/);

    await mmDesignPage.navigateToMMDesign();

    await capturePotStep(page, 'D2C', 'R05_D2C_mmDesignDelete', 2, 'MM Design page');

    // Search
    await page.getByPlaceholder('Search').fill('oss');

    const firstRow = page.getByRole('row').nth(1);

    await expect(firstRow).toBeVisible({
      timeout: 15000
    });

    // Save ID before any hover/menu/dialog operations
    const deletedId = (
      await page.getByRole('row').nth(1)
        .locator('[role="gridcell"]')
        .nth(1)
        .textContent()
    )?.trim();

    console.log('Deleting:', deletedId);

    // Hover and open menu
    await firstRow.hover();
    await page.waitForTimeout(1000);

    const menuButton = firstRow.locator('xpath=..').locator('button').first();

    await menuButton.click();

    await page.getByRole('menuitem', {
      name: 'Delete'
    }).click();

    const confirmDialog = page.getByRole('dialog');

    await expect(confirmDialog).toBeVisible();

    // Save count BEFORE deleting
    const countLabelBefore = await page
      .locator('li')
      .filter({ hasText: /items.*shown/i })
      .first()
      .textContent();

    console.log('Before:', countLabelBefore);

    const totalBefore = Number(
      countLabelBefore?.match(/\d+/)?.[0]
    );

    // Click Yes
    await confirmDialog.getByRole('button', {
      name: /^Yes$/i
    }).click();

// Wait until delete confirmation dialog closes
await expect(confirmDialog).not.toBeVisible({
  timeout: 30000
});

     // Read count again
    const countLabelAfter = await page
      .locator('li')
      .filter({ hasText: /items.*shown/i })
      .first()
      .textContent();

    console.log('After:', countLabelAfter);

    const totalAfter = Number(
      countLabelAfter?.match(/\d+/)?.[0]
    );

    // Verify one item was removed
    expect(totalAfter).toBe(totalBefore - 1);

    await generatePotDocument('D2C', 'R05_D2C_mmDesignDelete');
  });
});

