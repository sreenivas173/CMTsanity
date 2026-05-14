/**
 * Author: Srinivasa Rao Allamsetti
 * This test file validates the MM Design upload functionality.
 * It includes tests for:
 * - Uploading a design file and verifying the item count increases
 * - Checking the error severity of the uploaded item
 * - Capturing a screenshot after successful upload
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { MMDesignPage } from '../../pages/MMDesignPage';
import path from 'path';


test.describe('@Sanity MM Design Upload Validations', () => {
  /** Tests MM Design upload validations */
  test('MM Design Upload Validations', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const mmDesignPage = new MMDesignPage(page);
    
    await loginPage.goto();
    await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
    await expect(page).toHaveURL(/design2code\/migration-management-design/);
    if (await mmDesignPage.isPage404()) {
      test.skip(true, 'Page is showing 404 error');
    }
    // Navigate to the MM Design page
    await mmDesignPage.navigateToMMDesign();
    
    // Get initial item count
    const initialCount = await mmDesignPage.getTotalItems();

    // Upload design file using the full upload flow
    const folderPath = path.resolve('Resources/oss-lm-migration-21008.zip');
    
    // Open upload dialog
    await mmDesignPage.openUploadDialog();
    
    
    // Upload file
    await mmDesignPage.uploadFile(folderPath);
    
    // Click proceed
    await mmDesignPage.clickProceed();

    // Check that item count increased by 1
    const updatedCount = await mmDesignPage.getTotalItems();
    expect(updatedCount).toBe(initialCount + 1);
    
    // Wait until table row count increases
    const rowCount = await mmDesignPage.getRowCount();
    expect(rowCount).toBeGreaterThan(1);

    // Get first data row (skip header)
    const firstDataRow = mmDesignPage.table.getByRole('row').nth(1);

    // Get Error Severity cell (6th column index = 5)
    const errorSeverityCell = firstDataRow.getByRole('gridcell').nth(5);

    // Wait until cell is visible
    await expect(errorSeverityCell).toBeVisible();

    // Get text safely
    const errorSeverityText = (await errorSeverityCell.textContent())?.trim() ?? '';

    expect(
      errorSeverityText === '' ||
      errorSeverityText.toLowerCase().includes('minor')
    ).toBeTruthy();
    
    // Take screenshot after successful upload
    await page.screenshot({ path: 'screenshots/successful_upload.png' });
  });
});
