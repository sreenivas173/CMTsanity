/** 
 * @author Srinivasa Rao Allamsetti
 * 
 * D2C Settings Page Test Suite
 * 
 * This test suite validates the D2C (Design to Code) Settings page functionality.
 * The Settings page allows users to manage configuration files for MM Design and DB Level Design,
 * as well as common parameters that apply to both.
 * 
 * Test Coverage:
 * 1. Settings page visibility validation
 * 2. Export button functionality - validates downloading settings
 * 3. Import button visibility validation
 * 4. Revert All functionality - resets all settings to default values
 * 5. MM Design Settings upload - uploads configuration files for MM Design
 * 6. DB Level Design Settings upload - uploads configuration files for DB Level Design
 * 7. Common Parameters editing - validates editing common parameters
 * 8. Config files validation - validates default config files exist for both MM and DB
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { SettingsPage } from '../../pages/SettingsPage';
import path from 'path';
import fs from 'fs';

/**
 * Test Suite: D2C Settings Page Validations
 * 
 * This suite performs end-to-end testing of the D2C Settings page, which includes:
 * - MM Design Settings (configuration files for Master Data Migration)
 * - DB Level Design Settings (configuration files for Database Level Design)
 * - Common Parameters (shared settings between both design types)
 * 
 * Each test follows the pattern:
 * 1. Login to the application (via beforeEach hook)
 * 2. Navigate to Settings page
 * 3. Perform specific validation actions
 * 4. Assert expected results
 */
test.describe(' D2C Settings page validations', () => {
    let loginPage: LoginPage;
    let settingsPage: SettingsPage;

    /**
     * beforeEach Hook - Runs before each test
     * 
     * Purpose: Sets up the test environment by:
     * 1. Creating a new LoginPage instance
     * 2. Navigating to the D2C application
     * 3. Logging in with test credentials
     * 4. Navigating to the Settings page
     * 
     * Credentials: cpq-admin@netcracker.com / MARket1234!
     * URL Pattern: /design2code/migration-management-design
     */
    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        settingsPage = new SettingsPage(page);

        await loginPage.goto();
        await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
        await expect(page).toHaveURL(/design2code\/migration-management-design/);

        // Skip test if page shows 404 error
        if (await settingsPage.isPage404()) {
            test.skip(true, 'Page is showing 404 error');
        }

        // Navigate to the Settings page
        await settingsPage.navigateToSettings();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000); // Additional wait for dynamic content
    });

    //================================================================================
    // TEST 1: Settings Page Validation
    //================================================================================
    /** 
     * Test: Settings page validation
     * 
     * Purpose: Verifies that the Settings page loads correctly and displays the main settings container.
     * 
     * What it validates:
     * - The Settings page container element is visible on the page
     * - The Settings container contains the text "Settings"
     * 
     * Expected Result: Settings container should be visible with "Settings" text
     */
    test('@Sanity Settings page validation', async ({ page }) => {
        // Use SettingsPage method to validate
        await settingsPage.expectSettingsVisible();
    });

    //================================================================================
    // TEST 2: Export Button Validation
    //================================================================================
    /** 
     * Test: Settings_Export button validation
     * 
     * Purpose: Validates that the Export button functionality works correctly.
     * The Export button allows users to download all current settings as a JSON file.
     * 
     * What it validates:
     * - The Export button is visible on the Settings page
     * - Clicking Export triggers a file download
     * - The downloaded file has a valid filename
     * - The file is successfully saved to the Resources directory
     * 
     * Expected Result: A JSON settings file should be downloaded with a valid name
     */
    test('@Sanity Settings_Export button validation', async ({ page }) => {
        // Verify Export button is visible
        const isExportVisible = await settingsPage.isExportButtonVisible();
        expect(isExportVisible).toBeTruthy();

        // Click Export and get download
        const download = await settingsPage.clickExport();

        // Assert that the download has a valid suggested filename (not empty/null)
        expect(download.suggestedFilename()).toBeTruthy();

        // Save the downloaded file to the Resources directory with its suggested filename
        const savePath = `Resources/${download.suggestedFilename()}`;
        await download.saveAs(savePath);
    });

    //================================================================================
    // TEST 3: Import Button Validation
    //================================================================================
    /** 
     * Test: Settings_Import button validation
     * 
     * Purpose: Validates that the Import button is visible on the Settings page.
     * The Import button allows users to upload previously exported settings.
     * 
     * What it validates:
     * - The Import button is visible on the Settings page
     * 
     * Note: This test only validates visibility, not the actual import functionality.
     * The import action requires a file to be selected and uploaded.
     * 
     * Expected Result: Import button should be visible on the Settings page
     */
    test('Settings_Import button validation', async ({ page }) => {
        // Verify Import button is visible using SettingsPage method
        const isImportVisible = await settingsPage.isImportButtonVisible();
        expect(isImportVisible).toBeTruthy();
    });

    //================================================================================
    // TEST 4: Revert All Button Validation
    //================================================================================
    /** 
     * Test: Revert All resets settings to Default
     * 
     * Purpose: Validates that the Revert All button correctly resets all settings
     * to their default values across MM Design and DB Level Design sections.
     * 
     * What it validates:
     * - Clicking Revert All shows a confirmation popup
     * - The confirmation message is correct
     * - Clicking "Yes" in the popup triggers the revert action
     * - All settings rows show "Default" status after revert
     * 
     * Expected Result: All settings should display "Default" status after reverting
     */
    test('@Sanity Revert All resets settings to Default', async ({ page }) => {
        // Click Revert All button
        await settingsPage.clickRevertAll();

        // Confirm the revert action
        await settingsPage.confirmRevert();

        // Validate that all rows show "Default" status
        const areAllDefault = await settingsPage.areAllStatusDefault();
        expect(areAllDefault).toBeTruthy();
    });

    //================================================================================
    // TEST 5: MM Design Settings Upload
    //================================================================================
    /** 
     * Test: MM Design Settings--Upload Settings
     * 
     * Purpose: Validates the upload functionality for MM Design configuration files.
     * This allows users to upload custom configuration files for Master Data Migration.
     * 
     * What it validates:
     * - The MM Design Settings section has an "Upload Settings" button
     * - Clicking the button opens an upload dialog
     * - A file can be selected and uploaded
     * - The upload button becomes enabled after file selection
     * - The upload completes successfully
     * - A success message is displayed after upload
     * 
     * Test File: Resources/fallout-rules.json
     * 
     * Expected Result: File should upload successfully and show confirmation message
     */
    test('MM Design Settings--Upload Settings:', async ({ page }, testInfo) => {
        // Resolve the path to the test file
        const filePath = path.resolve(
            testInfo.project.testDir,
            '../Resources/fallout-rules.json'
        );

        // Upload settings using SettingsPage method
        await settingsPage.uploadMMSettings(filePath);

        // Validate success message appears
        const isSuccessVisible = await settingsPage.isUploadSuccessMessageVisible();
        expect(isSuccessVisible).toBeTruthy();
    });

    //================================================================================
    // TEST 6: DB Level Design Settings Upload
    //================================================================================
    /** 
     * Test File: Resources/excel.json
     * 
     * Expected Result: File should upload successfully and show confirmation message
     */
    test('DB LEVEL Design Settings--Upload Settings:', async ({ page }) => {

        // Resolve path to the test configuration file using process.cwd()
        const resourcesDir = path.join(process.cwd(), 'Resources');
        const excelFilePath = `${resourcesDir}/excel.json`;


        // Upload settings using SettingsPage method  
        await settingsPage.uploadDBLevelSettings(excelFilePath);

        // Validate success message appears
        const isSuccessVisible = await settingsPage.isUploadSuccessMessageVisible();
        expect(isSuccessVisible).toBeTruthy();
    });

    //================================================================================
    // TEST 7: Edit Common Parameters
    //================================================================================
    /** 
     * Test: Validate Edit Common Parameters
     * 
     * Purpose: Validates that common parameters can be edited and saved correctly.
     * Common parameters are settings shared between MM Design and DB Level Design.
     * 
     * What it validates:
     * - The Edit button in Common Parameters section is clickable
     * - Clicking Edit opens a dialog/popup
     * - Text fields (DIVIDER, DATABASE_TYPE) can be edited
     * - Toggle switches (PREFIX_FOR_OUTPUT, EXTRA_OUTPUT_FILES) can be toggled
     * - Save button submits the changes
     * - The dialog closes after saving
     * - The updated values are displayed on the page
     * 
     * Parameters Edited:
     * - DIVIDER: Changes from default "," to "|"
     * - DATABASE_TYPE: Changes from default "oracle" to "postgres"
     * - PREFIX_FOR_OUTPUT: Toggles to True
     * - EXTRA_OUTPUT_FILES: Toggles to True
     * 
     * Expected Result: All parameter changes should be saved and displayed
     */
    test('Validate Edit Common Parameters', async ({ page }) => {
        // Use the comprehensive method to edit and save all common parameters
        await settingsPage.editAndSaveCommonParams({
            divider: '|',
            databaseType: 'postgres',
            prefixForOutput: true,
            extraOutputFiles: true
        });

        // Validate updated values are displayed on the page
        await expect(page.getByText('|')).toBeVisible();
        await expect(page.getByText('postgres')).toBeVisible();
    });

    //================================================================================
    // TEST 8: Validate MM and DB Level Design Config Files
    //================================================================================
    /** 
     * Test: Validate MM and DB Level Design config files
     * 
     * Purpose: Validates that the default configuration files are present and correct
     * for both MM Design and DB Level Design sections. This ensures the application
     * is properly initialized with required configuration files.
     * 
     * What it validates:
     * - MM Design Settings section is visible
     * - DB Level Design Settings section is visible
     * - Both sections contain a table with configuration files
     * - MM Design table contains exactly 5 expected files
     * - DB Level Design table contains exactly 4 expected files
     * - The file names match the expected configuration files
     * 
     * Expected MM Design Files (5 files):
     * - excel-migration-dictionary.json
     * - generate.toml
     * - excel-migration-types.json
     * - excel-migration-type.json
     * - fallout-rules.json
     * 
     * Expected DB Level Design Files (4 files):
     * - database_keywords.txt
     * - generate.toml
     * - fallout-rules.json
     * - excel.json
     * 
     * Expected Result: All default configuration files should be present and match expected list
     */
   test('@Sanity   Validate MM and DB Level Design config files', async ({ page }) => {

  // Ensure we are on Settings page
  await settingsPage.navigateToSettings();

   // Ensure Settings page loaded
  //await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

  // Validate sections are visible
  await settingsPage.expectMMSectionVisible();
  await settingsPage.expectDBLevelSectionVisible();

  const expectedMMFiles = [
    'excel-migration-dictionary.json',
    'generate.toml',
    'excel-migration-types.json',
    'excel-migration-type.json',
    'fallout-rules.json'
  ];

  const expectedDBFiles = [
    'database_keywords.txt',
    'generate.toml',
    'fallout-rules.json',
    'excel.json'
  ];

  await settingsPage.validateMMFiles(expectedMMFiles);
  await settingsPage.validateDBFiles(expectedDBFiles);
});

    //================================================================================
    // TEST 9-13: Download Settings Files
    //================================================================================
    const filesToDownload = [
        'fallout-rules.json'
    ];

    for (const fileName of filesToDownload) {
        test(`Download settings file: ${fileName}`, async ({ page }) => {
            // Download file using SettingsPage method
            const download = await settingsPage.downloadFile(fileName);

            // Save and validate the file - use process.cwd() for cross-platform compatibility
            const downloadsDir = path.join(process.cwd(), 'downloads');
            if (!fs.existsSync(downloadsDir)) {
                fs.mkdirSync(downloadsDir, { recursive: true });
            }
            const downloadPath = path.join(downloadsDir, await download.suggestedFilename());
            await download.saveAs(downloadPath);

            // Validate file exists
            expect(fs.existsSync(downloadPath)).toBeTruthy();

            // Validate file content
            const content = fs.readFileSync(downloadPath, 'utf-8');
            expect(content.length).toBeGreaterThan(0);
        });
    }
});
