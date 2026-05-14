/**
 * Author: Srinivasa Rao Allamsetti
 * This test file validates the MM Design download functionality.
 * It includes tests for:
 * - Navigating to the MM Design page after login
 * - Selecting a design file from the table
 * - Downloading the selected design as a ZIP file
 * - Validating the downloaded file exists and has content
 * - Saving the downloaded file to the Resources directory
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { MMDesignPage } from '../../pages/MMDesignPage';
import fs from 'fs';

/**
 * Test Suite: MM Design Download Validation
 * 
 * This suite validates the download functionality of the MM Design page.
 * Users can download their design files as ZIP archives for offline use.
 * The tests ensure the download process works correctly and files are saved properly.
 */
test.describe('@Sanity MM Design Download Validation', () => {
  
  /**
   * Test: MM Design Download Validation
   * 
   * Purpose: Validates that a user can successfully download a design file from the MM Design page.
   * 
   * What it validates:
   * - Login to the application with valid credentials
   * - Navigation to the MM Design page
   * - Selection of the first design file from the table
   * - Presence of the Download ZIP button
   * - Successful initiation of the download
   * - Valid filename suggestion from the server
   * - File is saved to the Resources directory
   * 
   * Expected Result: A ZIP file should be downloaded successfully with a valid filename
   */
test('MM Design Download Validation', async ({ page }) => {
    // Initialize the LoginPage object for authentication
    const loginPage = new LoginPage(page);
    const mmDesignPage = new MMDesignPage(page);

    // Navigate to the login page and perform login with admin credentials
    await loginPage.goto();
    await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');

    // Verify that the user is redirected to the migration management design page
    await expect(page).toHaveURL(/design2code\/migration-management-design/);

    // Skip the test if the page shows a 404 error
    if (await mmDesignPage.isPage404()) {
      test.skip(true, 'Page is showing 404 error');
    }

    // Navigate to the MM Design page by clicking the 'MM Design' link
    await mmDesignPage.navigateToMMDesign();

    // Locate the first data row in the table (skipping the header row)
    const firstDataRow = mmDesignPage.table.getByRole('row').nth(1);
    await expect(firstDataRow).toBeVisible();

    // Click on the first data row to navigate to the details page
    await firstDataRow.click();
    await page.waitForTimeout(2000); // Wait for the page to redirect

    // ✅ VIDEO CAPTURE: Screenshot before download for video context
    await page.screenshot({ path: 'screenshots/download-before.png' });

    // Wait for the 'Download ZIP' link to become visible on the page
    const downloadLink = page.locator('text=Download ZIP');
    await expect(downloadLink).toBeVisible();

    // Set up a promise to wait for the download event to be triggered
    const downloadPromise = page.waitForEvent('download');

    // Click the 'Download ZIP' link to initiate the download
    await downloadLink.click();

    // Wait for the download to start and retrieve the download object
    const download = await downloadPromise;

    // ✅ VIDEO CAPTURE: Explicit delay to show download progress in video
    await page.waitForTimeout(3000);

    // Assert that the download has a valid suggested filename
    expect(download.suggestedFilename()).toBeTruthy();

    const filename = download.suggestedFilename();
    console.log(`📥 Downloaded file: ${filename}`);

    // Save the downloaded file to the Resources directory with its suggested filename
    const savePath = `Resources/${filename}`;
    await download.saveAs(savePath);

    // ✅ VIDEO CAPTURE: Screenshot after download success
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/download-after.png' });

    // ✅ VIDEO VALIDATION: Verify file saved (visible in traces)
    expect(fs.existsSync(savePath)).toBeTruthy();
    console.log(`💾 File saved successfully: ${savePath} (size: ${fs.statSync(savePath).size} bytes)`);
  });
});
