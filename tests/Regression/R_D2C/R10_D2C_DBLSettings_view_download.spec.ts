/**
 * Author: Srinivasa Rao Allamsetti
 *
 * R10_D2C_DBLSettings_fallout-rules_view_download
 * Validate DB Level Design Settings:
 *  - View Content via kebab menu (3 dots)
 *  - Capture screenshot from the popup and close it
 *  - Download the selected setting via kebab menu
 *  - Validate downloaded file exists and has content
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import 'dotenv/config';

import { LoginPage } from '../../../pages/LoginPage';
import { SettingsPage } from '../../../pages/SettingsPage';
import { clearPotFolder, capturePotStep } from '../../../utils/PotHelper';
import { generatePotDocument } from '../../../utils/WordGenerator';

const testName = 'R10_D2C_DBLSettings_fallout-rules_view_download';

test.describe('@D2CRegression DB Level Design Settings View + Download Validation', () => {
  test(testName, async ({ page }) => {
    const loginPage = new LoginPage(page);
    const settingsPage = new SettingsPage(page);

    clearPotFolder('D2C', testName);

    await loginPage.goto();
    await loginPage.login(process.env.D2C_USERNAME!, process.env.D2C_PASSWORD!);

    await capturePotStep(page, 'D2C', testName, 1, 'Login Page');

    await expect(page).toHaveURL(/design2code\/migration-management-design/);

    if (await settingsPage.isPage404()) {
      test.skip(true, 'Page is showing 404 error');
    }

    await settingsPage.navigateToSettings();
    await capturePotStep(page, 'D2C', testName, 2, 'Navigate to Settings page');

// Ensure DB section is visible
    await expect(settingsPage.dbSection).toBeVisible();

    // Wait for DB settings table
    // DB table is the second table on the page in current UI
    const settingsTable = page.getByRole('table').nth(1);
    await expect(settingsTable).toBeVisible();

    // Find fallout-rules.json row
    const falloutRow = settingsTable
      .getByRole('row')
      .filter({ has: page.getByText('fallout-rules.json', { exact: true }) })
      .first();

    await expect(falloutRow).toBeVisible({ timeout: 15000 });
    await falloutRow.hover();
    await page.waitForTimeout(1000);

    // --- Step: kebab menu -> View Content ---
    await capturePotStep(
      page,
      'D2C',
      testName,
      3,
      'Hover fallout-rules.json row and open kebab menu'
    );

    await settingsPage.viewFileContent('fallout-rules.json', 'DB');

    await expect(settingsPage.uploadDialog).toBeVisible({ timeout: 15000 });
    await expect(await settingsPage.isContentDialogVisible()).toBeTruthy();

    // Screenshot popup window
    await page.screenshot({ path: `screenshots/${testName}-view-content.png` });
    await capturePotStep(page, 'D2C', testName, 4, 'View Content popup screenshot');

    // Close popup
    const closeBtn = settingsPage.uploadDialog.getByRole('button', { name: 'Close' });
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
    } else {
      const xBtn = settingsPage.uploadDialog
        .locator(
          'button[aria-label="Close"], button:has(svg), button:has-text("×")'
        )
        .first();
      await xBtn.click({ timeout: 5000 });
    }

    await expect(settingsPage.uploadDialog).toBeHidden({ timeout: 15000 });

    // --- Step: kebab menu -> Download ---
    await capturePotStep(page, 'D2C', testName, 5, 'Close popup then open kebab menu for Download');

    const download = await settingsPage.downloadFile('fallout-rules.json', 'DB');

    await expect(download.suggestedFilename()).toBeTruthy();
    const filename = download.suggestedFilename();

    const resourcesDir = path.join(process.cwd(), 'Resources');
    if (!fs.existsSync(resourcesDir)) {
      fs.mkdirSync(resourcesDir, { recursive: true });
    }

    const savePath = path.join(resourcesDir, filename);
    await download.saveAs(savePath);

    expect(fs.existsSync(savePath)).toBeTruthy();
    expect(fs.statSync(savePath).size).toBeGreaterThan(0);

    await capturePotStep(page, 'D2C', testName, 6, 'Download success and file validated');

    await generatePotDocument('D2C', testName);
  });
});

