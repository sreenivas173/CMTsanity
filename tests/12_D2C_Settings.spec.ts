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
import { LoginPage } from '../pages/LoginPage';
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
test.describe('D2C Settings page validations', () => {
    let loginPage: LoginPage;

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
        await loginPage.goto();
        await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
        await expect(page).toHaveURL(/design2code\/migration-management-design/);
        
        // Skip test if page shows 404 error
        if (await page.locator('text=The page cannot be found').isVisible()) {
            test.skip(true, 'Page is showing 404 error');
        }
        
        // Navigate to the D2C Settings page
        await page.click('text=Settings');
        await page.waitForTimeout(2000);
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
     * How it validates:
     * 1. Locates the settings container using CSS selector (div.sc-cmEail.eFiMdx)
     * 2. Asserts the element is visible using expect().toBeVisible()
     * 3. Asserts the element contains "Settings" text using expect().toContainText()
     * 
     * Expected Result: Settings container should be visible with "Settings" text
     */
    test('Settings page validation', async ({ page }) => {
        // Locate the Settings container element using its CSS class
        const settingsLocator = page.locator('div.sc-cmEail.eFiMdx:visible');
        
        // Ensure the Settings container is visible on the page
        await expect(settingsLocator).toBeVisible();
        
        // Assert that the Settings container contains the text "Settings"
        await expect(settingsLocator).toContainText('Settings');
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
     * How it validates:
     * 1. Locates the Export button by its text
     * 2. Sets up a download event listener using page.waitForEvent('download')
     * 3. Clicks the Export button to trigger the download
     * 4. Asserts the download has a valid suggested filename
     * 5. Saves the downloaded file to Resources directory
     * 
     * Expected Result: A JSON settings file should be downloaded with a valid name
     */
    test('Settings_Export button validation', async ({ page }) => {
        // Locate the Export button by its visible text
        const exportButton = page.locator(':text("Export")');
        
        // Ensure the Export button is visible
        await expect(exportButton).toBeVisible();

        // Set up a promise to wait for the download event to be triggered
        // This must be done BEFORE clicking the button
        const downloadPromise = page.waitForEvent('download');

        // Click the Export button to initiate the download
        await exportButton.click();

        // Wait for the download to start and retrieve the download object
        const download = await downloadPromise;

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
     * How it validates:
     * 1. Locates the Import button by its text
     * 2. Asserts the button is visible using expect().toBeVisible()
     * 
     * Note: This test only validates visibility, not the actual import functionality.
     * The import action requires a file to be selected and uploaded.
     * 
     * Expected Result: Import button should be visible on the Settings page
     */
    test('Settings_Import button validation', async ({ page }) => {
        // Locate the Import button by its visible text
        const Importbutton = page.locator(':text("Import")');
        
        // Ensure the Import button is visible
        await expect(Importbutton).toBeVisible();
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
     * How it validates:
     * 1. Clicks the "Revert All" button
     * 2. Waits for and validates the confirmation popup header text
     * 3. Clicks the "Yes" button to confirm the action
     * 4. Locates all status cells (.ux-react-chip__text) showing current status
     * 5. Iterates through each status cell and asserts it shows "Default"
     * 
     * Expected Result: All settings should display "Default" status after reverting
     */
    test('Revert All resets settings to Default', async ({ page }) => {
        // Step 1: Click the Revert All button to open confirmation dialog
        await page.click('button:has-text("Revert All")');

        // Step 2: Wait for the popup header text and validate the message
        // This ensures the confirmation dialog appeared correctly
        await expect(page.locator('.ux-react-popup__header-content.taTitle'))
            .toHaveText('Are you sure you want to revert all settings to the default?');

        // Step 3: Click the "Yes" button to confirm the revert action
        await page.click('button:has-text("Yes")');

        // Step 4: Validate that all rows show "Default" status
        // The status is displayed in elements with class .ux-react-chip__text
        const statusCells = page.locator('.ux-react-chip__text');
        const count = await statusCells.count();

        // Loop through each status cell and verify it shows "Default"
        for (let i = 0; i < count; i++) {
            await expect(statusCells.nth(i)).toHaveText('Default');
        }
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
     * How it validates:
     * 1. Locates the "MM Design Settings" section
     * 2. Clicks the "Upload Settings" button (first occurrence)
     * 3. Waits for the upload dialog to appear
     * 4. Resolves the path to the test file (fallout-rules.json)
     * 5. Sets the file as input using setInputFiles()
     * 6. Waits for the Upload button to become enabled
     * 7. Clicks the Upload button to submit
     * 8. Validates success message appears using regex match for "uploaded"
     * 
     * Test File: Resources/fallout-rules.json
     * 
     * Expected Result: File should upload successfully and show confirmation message
     */
    test('MM Design Settings--Upload Settings:', async ({ page }, testInfo) => {
        // Locate the MM Design Settings section
        const mmSection = page.getByText('MM Design Settings');

        // Click the Upload Settings button inside MM Design section
        // Using .first() to ensure we get the correct button
        await page
            .getByRole('button', { name: 'Upload Settings' })
            .first()
            .click();

        // Wait for the upload dialog to appear
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();

        // Resolve the path to the test file
        // Using testInfo.project.testDir to get the project root directory
        const filePath = path.resolve(
            testInfo.project.testDir,
            '../Resources/fallout-rules.json'
        );

        // Set the file as input to the file picker
        await dialog.locator('input[type="file"]').setInputFiles(filePath);

        // Locate and wait for the Upload button to become enabled
        const uploadBtn = dialog.getByRole('button', { name: 'Upload' });
        await expect(uploadBtn).toBeEnabled();
        
        // Click the Upload button to submit the file
        await uploadBtn.click();

        // Validate that a success message appears
        // Using regex /uploaded/i to match case-insensitive "uploaded" text
        await expect(page.getByText(/uploaded/i)).toBeVisible();
    });

//================================================================================
// TEST 6: DB Level Design Settings Upload
//================================================================================
    /** 
     * Test: DB LEVEL Design Settings--Upload Settings
     * 
     * Purpose: Validates the upload functionality for DB Level Design configuration files.
     * This allows users to upload custom configuration files for Database Level Design.
     * 
     * What it validates:
     * - The DB Level Design Settings section has an "Upload Settings" button
     * - Clicking the button opens an upload dialog specific to DB Level Design
     * - A file can be selected and uploaded
     * - The upload completes successfully
     * - A success message is displayed after upload
     * 
     * How it validates:
     * 1. Locates the "DB Level Design Settings" heading using exact match
     * 2. Finds the parent card/section container
     * 3. Clicks the "Upload Settings" button within that specific section
     * 4. Waits for the upload dialog to appear
     * 5. Resolves the path to the test file (excel.json)
     * 6. Sets the file as input using setInputFiles()
     * 7. Clicks the Upload button to submit
     * 8. Validates success message appears
     * 
     * Test File: Resources/excel.json
     * 
     * Note: Uses XPath to scope the button click to the specific DB Level section
     * to avoid clicking the wrong Upload Settings button (there are multiple sections)
     * 
     * Expected Result: File should upload successfully and show confirmation message
     */
    test('DB LEVEL Design Settings--Upload Settings:', async ({ page }) => {
        // Step 1: Locate the exact heading "DB Level Design Settings"
        // Using { exact: true } ensures we match exactly and not partial text
        const dbHeading = page.getByText('DB Level Design Settings', { exact: true });

        // Step 2: Navigate to the closest parent container (card/section)
        // This helps scope our search to only this specific section
        const dbSection = dbHeading.locator('xpath=ancestor::div[contains(@class,"card") or contains(@class,"section")]').first();

        // Step 3: Click Upload Settings inside THIS specific DB Level section
        await dbSection
            .getByRole('button', { name: 'Upload Settings' })
            .click();

        // Wait for the upload dialog to appear
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();

        // Resolve path to the test configuration file
        const filePath = path.resolve(
            __dirname,
            '../Resources/excel.json'
        );

        // Set the file as input and submit
        await dialog.locator('input[type="file"]').setInputFiles(filePath);
        await dialog.getByRole('button', { name: 'Upload' }).click();

        // Validate success message appears
        await expect(page.getByText(/uploaded/i)).toBeVisible();
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
     * How it validates:
     * 1. Clicks the Edit button (matches button with "edit" in name)
     * 2. Waits for dialog to appear
     * 3. Locates and fills the DIVIDER text field with "|"
     * 4. Locates and fills the DATABASE_TYPE text field with "postgres"
     * 5. Finds toggle switches and toggles them if not already on
     * 6. Clicks the Save button
     * 7. Validates dialog closes (toBeHidden)
     * 8. Validates new values appear on the page
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
        // Step 1: Click Edit button in Common Parameters section
        // Using regex /edit/i to match case-insensitive "Edit" text
        await page.getByRole('button', { name: /edit/i }).click();

        // Step 2: Validate popup/dialog appears
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();

        // Step 3: Edit Text Fields

        // Locate DIVIDER textbox and fill with new value "|"
        const dividerInput = dialog.getByLabel('DIVIDER');
        await dividerInput.fill('|');

        // Locate DATABASE_TYPE textbox and fill with new value "postgres"
        const dbTypeInput = dialog.getByLabel('DATABASE_TYPE');
        await dbTypeInput.fill('postgres');

        // Step 4: Toggle Switches
        // Find the toggle switches in the dialog
        // nth(0) = PREFIX_FOR_OUTPUT switch
        // nth(1) = EXTRA_OUTPUT_FILES switch

        const prefixSwitch = dialog.getByRole('switch').nth(0);
        const extraSwitch = dialog.getByRole('switch').nth(1);

        // Toggle PREFIX_FOR_OUTPUT if it's currently off (aria-checked="false")
        const prefixState = await prefixSwitch.getAttribute('aria-checked');
        if (prefixState === 'false') {
            await prefixSwitch.click();
        }

        // Toggle EXTRA_OUTPUT_FILES if it's currently off
        const extraState = await extraSwitch.getAttribute('aria-checked');
        if (extraState === 'false') {
            await extraSwitch.click();
        }

        // Step 5: Click Save to submit the changes
        await dialog.getByRole('button', { name: 'Save' }).click();

        // Step 6: Validate dialog closed (hidden from view)
        await expect(dialog).toBeHidden();

        // Step 7: Validate updated values are displayed on the page
        // The new DIVIDER value "|" should be visible
        await expect(page.getByText('|')).toBeVisible();
        
        // The new DATABASE_TYPE value "postgres" should be visible
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
     * How it validates:
     * 1. Asserts both MM Design Settings and DB Level Design Settings are visible
     * 2. Locates all tables on the page (should be 2)
     * 3. Gets the first table (index 0) as MM table
     * 4. Gets the second table (index 1) as DB table
     * 5. Defines a helper function getFileNames() to extract file names:
     *    - Gets all rows from the table
     *    - Starts from index 1 to skip the header row
     *    - Validates each row has at least 2 cells (data row)
     *    - Extracts the file name from the second cell (index 1)
     *    - Filters out empty values
     * 6. Compares extracted MM file names against expected list
     * 7. Compares extracted DB file names against expected list
     * 8. Uses .sort() on both arrays for order-independent comparison
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
    test('Validate MM and DB Level Design config files', async ({ page }) => {
        // Validate that both Settings sections are visible on the page
        await expect(page.getByText('MM Design Settings')).toBeVisible();
        await expect(page.getByText('DB Level Design Settings')).toBeVisible();

        // Get all tables on the page - there should be exactly 2 tables
        const tables = page.getByRole('table');
        await expect(tables).toHaveCount(2);

        // Assign tables: first is MM Design, second is DB Level Design
        const mmTable = tables.nth(0);
        const dbTable = tables.nth(1);

        /** 
         * Helper Function: getFileNames
         * 
         * Purpose: Extracts file names from a configuration table
         * 
         * How it works:
         * 1. Gets all rows from the table using getByRole('row')
         * 2. Iterates through rows starting from index 1 (skips header row)
         * 3. For each row, checks if it has at least 2 grid cells
         * 4. Extracts the file name from the second cell (index 1)
         * 5. Filters out empty or whitespace-only values
         * 6. Returns array of file names
         * 
         * @param table - The Playwright Locator for the table element
         * @returns string[] - Array of file names extracted from the table
         */
        async function getFileNames(table) {
            // Get all rows in the table
            const rows = table.getByRole('row');

            const fileNames: string[] = [];
            const count = await rows.count();

            // Start from index 1 to skip header row "Name Status"
            for (let i = 1; i < count; i++) {
                const cells = rows.nth(i).getByRole('gridcell');
                const cellCount = await cells.count();
                
                // Only process rows that have at least 2 cells (data rows)
                // This skips empty/padding rows in the table
                if (cellCount >= 2) {
                    try {
                        // Get text from the second cell (index 1) which contains the file name
                        const text = await cells.nth(1).innerText();
                        // Only add non-empty, non-whitespace values
                        if (text && text.trim()) {
                            fileNames.push(text.trim());
                        }
                    } catch (e) {
                        // Skip rows that can't be read due to timing or other issues
                        console.log(`Skipping row ${i}: ${e}`);
                    }
                }
            }

            return fileNames;
        }

        // ==================== MM Design Validation ====================
        // Define the expected configuration files for MM Design
        const expectedMMFiles = [
            'excel-migration-dictionary.json',  // Migration dictionary configuration
            'generate.toml',                     // Code generation settings
            'excel-migration-types.json',       // Migration type definitions
            'excel-migration-type.json',        // Migration type configuration
            'fallout-rules.json'                // Fallout/error handling rules
        ];

        // Extract actual file names from MM table and compare with expected
        const mmFiles = await getFileNames(mmTable);
        expect(mmFiles.sort()).toEqual(expectedMMFiles.sort());

        // ==================== DB Level Design Validation ====================
        // Define the expected configuration files for DB Level Design
        const expectedDBFiles = [
            'database_keywords.txt',   // SQL keywords list
            'generate.toml',           // Code generation settings
            'fallout-rules.json',      // Fallout/error handling rules
            'excel.json'               // Excel configuration
        ];

        // Extract actual file names from DB table and compare with expected
        const dbFiles = await getFileNames(dbTable);
        expect(dbFiles.sort()).toEqual(expectedDBFiles.sort());
    });


const filesToDownload = [ 
 // 'excel-migration-dictionary.json', 
 // 'generate.toml', 
 // 'excel-migration-types.json', 
 // 'excel-migration-type.json', 
  'fallout-rules.json' ];
for (const fileName of filesToDownload)
   { 
    test(`Download settings file: ${fileName}`, async ({ page }) => { 
      // Step 1: Hover over the file row 
      const fileRow = page.locator(`text=${fileName}`); 
      await fileRow.hover();
      // Step 2: Click the three-dot menu (adjust locator to match your DOM) 
      await page.locator('button.ux-react-dropdown__trigger').click();
      // Step 3: Trigger download
      const [ download ] = await Promise.all([ 
        page.waitForEvent('download'), 
        page.click('text=Download') ]);

      // Step 4: Save and validate the file 
      
      const downloadPath = path.join(__dirname, 'downloads', await download.suggestedFilename());
      await download.saveAs(downloadPath); 
      // Validate file exists
      expect(fs.existsSync(downloadPath)).toBeTruthy(); 
      
      //Validate file content
      const content = fs.readFileSync(downloadPath, 'utf-8');
      expect(content.length).toBeGreaterThan(0); // basic check 
      }); 
    }

});
