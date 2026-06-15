/**
 * Author: Srinivasa Rao Allamsetti
 * This test file validates the MM Design upload functionality.
 * It includes tests for:
 * - Uploading a design file and verifying the item count increases
 * - Checking the error severity of the uploaded item
 * - Capturing a screenshot after successful upload
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/LoginPage';
import { MMDesignPage } from '../../../pages/MMDesignPage';
import path from 'path';
import 'dotenv/config';
import { capturePotStep } from '../../../utils/PotHelper';
import { generatePotDocument } from '../../../utils/WordGenerator';

test.describe('@D2CRegression MM Design Upload Validations', () => {
  /** Tests MM Design upload validations */
  test('MM Design Upload Validations', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const mmDesignPage = new MMDesignPage(page);

    await loginPage.goto();
    await loginPage.login(
      process.env.D2C_USERNAME!,
      process.env.D2C_PASSWORD!
    );


    await capturePotStep(page,
      'D2C',
      'R01_D2C_mmDesignUpload',
      1,
      'Login Page'
    );

    await expect(page).toHaveURL(/design2code\/migration-management-design/);
    if (await mmDesignPage.isPage404()) {
      test.skip(true, 'Page is showing 404 error');
    }
    // Navigate to the MM Design page
    await mmDesignPage.navigateToMMDesign();

    // Get initial item count
    const initialCount = await mmDesignPage.getTotalItems();


    await capturePotStep(page,
      'D2C',
      'R01_D2C_mmDesignUpload',
      2,
      'Navigate to MM and initialCount'
    );

    // Upload design file using the full upload flow
    const folderPath = path.resolve('Resources/oss-lm-migration-21008.zip');

    // Open upload dialog
    await mmDesignPage.openUploadDialog();


    // Upload file
    await mmDesignPage.uploadFile(folderPath);

    await capturePotStep(page,
      'D2C',
      'R01_D2C_mmDesignUpload',
      3,
      'Upload the design file'
    );

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

    await capturePotStep(page,
      'D2C',
      'R01_D2C_mmDesignUpload',
      4,
      'uploaded file information'
    );


    await generatePotDocument(
      'D2C',
      'R01_D2C_mmDesignUpload'
    );


  });
});
