/**
 * Author: Srinivasa Rao Allamsetti
 *
 * R06_D2C_DBLDesUpload_genscripts
 * Validate DB Level Design upload with options generateReports, generateMeta, generateScripts with PSE.
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import 'dotenv/config';

import { LoginPage } from '../../../pages/LoginPage';
import { DBLPage } from '../../../pages/DBLPage';
import { clearPotFolder, capturePotStep } from '../../../utils/PotHelper';
import { generatePotDocument } from '../../../utils/WordGenerator';

test.describe('@D2CRegression DB Level Design Upload Generate Scripts Validations', () => {
  test('R08_D2C_DBL-Upload_genScriptsPSE', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dblPage = new DBLPage(page);

    clearPotFolder('D2C', 'R08_D2C_DBL-Upload_genScriptsPSE');

    // Login
    await loginPage.goto();
    await loginPage.login(process.env.D2C_USERNAME!, process.env.D2C_PASSWORD!);

    await capturePotStep(
      page,
      'D2C',
      'R08_D2C_DBL-Upload_genScriptsPSE',
      1,
      'Login Page'
    );





    await expect(page).toHaveURL(/design2code\/migration-management-design/);



    // Navigate to DB Level Design using POM
    await dblPage.navigateToDBLDesign();
    await expect(dblPage.table).toBeVisible();
    await expect(dblPage.paginationInfo).toBeVisible();

    // Get initial pagination
    const initialPaginationText = await dblPage.getPaginationText();

    await capturePotStep(page, 'D2C', 'R08_D2C_DBL-Upload_genScriptsPSE', 2, 'DB Level Design table loaded');

    // Upload file with options
    const filePath = path.resolve('Resources/d2c_example_IDB_ora_Srini.xlsx');


    
    await dblPage.uploadDesignFile(filePath, {
      generateReports: true,
      generateMeta: true,
      generatePSE: true
    });

    
    await capturePotStep(page, 'D2C', 'R08_D2C_DBL-Upload_genScriptsPSE', 3, 'Upload completed');

    // Validate table refresh (pagination should change)
    const updatedPaginationText = await dblPage.getPaginationText();
    expect(updatedPaginationText).not.toBe(initialPaginationText);

    // Validate file appears in table
    await expect(dblPage.table).toContainText('d2c_example_IDB_ora_Srini.xlsx');

    await generatePotDocument('D2C', 'R08_D2C_DBL-Upload_genScriptsPSE');
  });
});

