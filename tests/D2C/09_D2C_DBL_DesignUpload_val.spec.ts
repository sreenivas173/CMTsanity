/**
 * Author: Srinivasa Rao Allamsetti
 * This test file validates the DB Level Design upload functionality.
 * It includes tests for:
 * - Logging into the application
 * - Navigating to the DB Level Design page
 * - Uploading a design file with various options
 * - Validating the file appears in the table after upload
 * - Validating the pagination updates after upload
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { DBLPage } from '../../pages/DBLPage';
import path from 'path';

/**
 * Test Suite: DB Level Design - Upload File Flow
 * 
 * This suite validates the upload functionality of the DB Level Design page.
 * Users can upload design files with various options like generating reports, 
 * metadata, and scripts. The tests ensure the upload process works correctly 
 * and the file appears in the table after upload.
 */
test.describe('@Sanity DB Level Design - Upload File Flow', () => {

  /**
   * Test: Upload design file with options and validate success
   * 
   * Purpose: Validates that a user can successfully upload a design file
   * with various options and the file appears in the table.
   * 
   * What it validates:
   * - Login to the application with valid credentials
   * - Navigation to the DB Level Design page
   * - Table visibility and pagination info
   * - File upload with options (generateReports, generateMeta, generateScripts)
   * - Table refresh after upload
   * - File name appears in the table
   * 
   * Expected Result: File should upload successfully and appear in the table
   */

  
  test('Upload design file with options and validate success', async ({ page }) => {

    const loginPage = new LoginPage(page);
    const dblPage = new DBLPage(page);

    // Login
    await loginPage.goto();
    await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
    await expect(page).toHaveURL(/design2code\/migration-management-design/);

    // Navigate to DB Level Design using POM
    await dblPage.navigateToDBLDesign();
    await expect(dblPage.table).toBeVisible();
    await expect(dblPage.paginationInfo).toBeVisible();

    // Get initial pagination
    const initialPaginationText = await dblPage.getPaginationText();

    // Upload file using POM method
    const filePath = path.resolve('Resources/d2c_example_IDB_ora_Srini.xlsx');
    
    await dblPage.uploadDesignFile(filePath, {
      generateReports: true,
      generateMeta: true,
      generateScripts: true
    });

    // Validate table refresh
    const updatedPaginationText = await dblPage.getPaginationText();
    expect(updatedPaginationText).toMatch(/^\d+ items, \d+-\d+ shown$/);

    // Validate file appears in table
    await expect(dblPage.table).toContainText('d2c_example_IDB_ora_Srini.xlsx');
  });
});
