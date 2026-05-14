/**
 * @author Srinivasa Rao Allamsetti
 *
 * Test Suite: DBL Design Download Validation
 *
 * Validates:
 * - Login
 * - Navigation to DB Level Design
 * - File selection (.xlsx)
 * - ZIP download
 * - File existence
 * - File size > 0
 * - Proper extension
 * - Attachment to Playwright report
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { LoginPage } from '../../pages/LoginPage';
import { DBLPage } from '../../pages/DBLPage';

test.describe('@Sanity DBL Design Download Validation', () => {

  test('DBL Design Download Validation', async ({ page }, testInfo) => {

    const loginPage = new LoginPage(page);
    const dblPage = new DBLPage(page);

    // Step 1: Login
    await loginPage.goto();
    await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
    await expect(page).toHaveURL(/design2code\/migration-management-design/);

    // Skip if 404 page appears
    if (await dblPage.isPage404()) {
      test.skip(true, 'Page is showing 404 error');
    }

    // Step 2: Navigate to DB Level Design
    await dblPage.navigateToDBLDesign();
    await expect(dblPage.table).toBeVisible();

    // Step 3: Select file row and download using POM
    const download = await dblPage.downloadFile('\\.xlsx$');

    // Step 4: Validate filename from server
    const originalFileName = download.suggestedFilename();
    expect(originalFileName).toBeTruthy();
    expect(originalFileName.endsWith('.zip')).toBeTruthy();

    // Step 5: Save file to dedicated downloads folder
    const timestamp = Date.now();
    const fileName = `${timestamp}_${originalFileName}`;
    
    const today = new Date().toISOString().split('T')[0];
    const downloadsFolder = path.join(process.cwd(), 'Resources', 'downloads', today);
    
    if (!fs.existsSync(downloadsFolder)) {
      fs.mkdirSync(downloadsFolder, { recursive: true });
    }
    
    const filePath = path.join(downloadsFolder, fileName);
    await download.saveAs(filePath);

    // Step 6: Validate file exists
    expect(fs.existsSync(filePath)).toBeTruthy();

    const stats = fs.statSync(filePath);
    expect(stats.size).toBeGreaterThan(100);

    // Step 7: Attach file to Playwright report
    await testInfo.attach('Downloaded ZIP File', {
      path: filePath,
      contentType: 'application/zip',
    });
  });
});
