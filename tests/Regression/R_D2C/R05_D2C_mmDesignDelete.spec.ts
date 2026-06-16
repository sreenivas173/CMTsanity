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

    // Search for oss
    await page.getByPlaceholder('Search').fill('oss');

    const firstRow = page.getByRole('row').nth(1);
    await expect(firstRow).toBeVisible({ timeout: 15000 });

    await capturePotStep(page, 'D2C', 'R05_D2C_mmDesignDelete', 3, 'Search results');

    // Hover first row to reveal actions
    await firstRow.hover();
    await page.waitForTimeout(1000);

    // Open 3-dot menu
    const menuButton = firstRow.locator('xpath=..').locator('button').first();
    await expect(menuButton).toBeVisible({ timeout: 10000 });
    await menuButton.click();

    // Click View Delete
    await page.getByText('View Delete', { exact: true }).click();

    await capturePotStep(page, 'D2C', 'R05_D2C_mmDesignDelete', 4, 'Delete confirmation popup');

    // Verify confirmation dialog and click yes
    const confirmDialog = page.getByRole('dialog');
    await expect(confirmDialog).toBeVisible({ timeout: 10000 });

    await confirmDialog.getByRole('button', { name: /^Yes$/i }).click();

    // Ensure success notification to pass
    const successToast = page.locator(
      '[role="status"], [aria-live="polite"], .ant-notification-notice'
    );

    await expect(successToast).toBeVisible({ timeout: 20000 });
    await expect(successToast).toContainText(/success|deleted|removed/i, {
      timeout: 20000,
    });

    await generatePotDocument('D2C', 'R05_D2C_mmDesignDelete');
  });
});

