/**
 * D2C Template Configuration Download Tests
 * 
 * This test suite validates the functionality of downloading template configuration files
 * from the D2C (Design to Code) Templates page in the application.
 * 
 * Test Approach:
 * - Uses Playwright for end-to-end testing
 * - Implements Page Object Model pattern for better test maintainability
 * - Tests file download functionality with proper validation
 * 
 * Prerequisites:
 * - User must have valid credentials (cpq-admin@netcracker.com / MARket1234!)
 * - Application must be accessible at the specified URL
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { TemplatesPage } from '../../pages/TemplatesPage';
import path from 'path';
import fs from 'fs';

/**
 * Test Suite: D2C Templates Page Validations
 * 
 * This suite tests the download functionality of configuration files from the 
 * Design-to-Code (D2C) Templates page. It validates that users can browse
 * through the template folder structure and download required configuration files.
 * 
 * Key Validations:
 * 1. User authentication and page navigation
 * 2. Folder expansion and navigation in templates tree
 * 3. File visibility in the directory structure
 * 4. Download functionality via dropdown menu
 * 5. File integrity after download (exists and has content)
 */
test.describe('D2C Templates page validations', () => {

    // Page Objects - Used for Page Object Model pattern
    // LoginPage: Handles login functionality (navigation, credential entry, submission)
    // TemplatesPage: Handles templates page functionality (navigation, UI interactions)
    let loginPage: LoginPage;
    let templatesPage: TemplatesPage;

    /**
     * beforeEach Hook - Runs before each test case
     * 
     * Purpose:
     * - Initializes page objects for reuse in tests
     * - Performs automated login with valid credentials
     * - Navigates to the Templates page as a baseline for all tests
     * 
     * Validation:
     * - Ensures login is successful by checking URL contains 'design2code'
     * - This confirms the user is authenticated and redirected to the main application
     * - Skips test if page shows 404 error (application unavailable)
     * 
     * How Validation Works:
     * - Uses Playwright's toHaveURL matcher with regex pattern
     * - The URL should contain 'design2code/migration-management-design' after login
     */
    test.beforeEach(async ({ page }) => {
        // Initialize page objects for the current test
        // These are fresh instances for each test to avoid state pollution
        loginPage = new LoginPage(page);
        templatesPage = new TemplatesPage(page);

        // Step 1: Navigate to the application login page
        await loginPage.goto();
        
        // Step 2: Perform login with valid credentials
        // Credentials: cpq-admin@netcracker.com / MARket1234!
        await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
        
        // Step 3: Validate successful authentication
        // WHAT: Checks that the URL contains 'design2code' after login
        // HOW: Using expect(page).toHaveURL() - waits for URL to match pattern
        // This assertion will fail if:
        // - Login credentials are invalid
        // - Application redirects to an error page
        // - Network issues prevent proper authentication
        await expect(page).toHaveURL(/design2code\/migration-management-design/);

        // Step 4: Navigate to the Templates page
        // This is the starting point for all subsequent test validations
        await templatesPage.navigateToTemplates();
    });


    //===================================================================================
    // TEST: Validate descriptor.yaml file download
    //===================================================================================
    
    /**
     * Test: Validate descriptor.yaml file download
     * 
     * PURPOSE:
     * This test validates that a user can successfully download the descriptor.yaml 
     * configuration file from the D2C Templates page. The descriptor.yaml is a critical
     * configuration file that defines the structure and settings for template generation.
     * 
     * WHAT IT VALIDATES:
     * 1. File Visibility: The descriptor.yaml file is visible in the templates directory tree
     * 2. Download Trigger: The download action can be triggered via the dropdown menu
     * 3. File Download: The file is successfully downloaded with the correct filename
     * 4. File Integrity: The downloaded file exists and contains non-empty content
     * 
     * HOW IT VALIDATES:
     * 
     * Step 1: Navigate to the templates folder
     * - Uses getByRole('table') to locate the main templates table
     * - Filters rows by text 'templates' (exact match) to find the templates folder row
     * - Clicks the expand button to reveal nested contents
     * 
     * Step 2: Navigate to the configuration folder
     * - Similar to step 1, finds the 'configuration' folder within templates
     * - Expands it to reveal the configuration files
     * 
     * Step 3: Locate the descriptor.yaml file
     * - Filters table rows to find 'descriptor.yaml' (exact text match)
     * - Uses expect().toBeVisible() to validate the file is displayed in the UI
     * 
     * Step 4: Trigger the download dropdown
     * - Hovers over the file row to reveal action buttons
     * - Uses multiple fallback selectors to find the dropdown trigger button:
     *   a. First tries specific CSS selector: 'button.ux-react-dropdown__trigger'
     *   b. Falls back to finding first dropdown in table
     *   c. Falls back to iterating through all visible buttons
     * - This robust approach handles potential UI variations
     * 
     * Step 5: Initiate download
     * - Uses Promise.all() to handle concurrent events:
     *   a. waitForEvent('download') - listens for download event
     *   b. getByText('Download').click() - clicks the download menu option
     * - This ensures we capture the download before it completes
     * 
     * Step 6: Validate download filename
     * - WHAT: Checks that the suggested filename contains 'descriptor.yaml'
     * - HOW: Using expect().toContain() matcher
     * 
     * Step 7: Save and validate the downloaded file
     * - Creates 'downloads' directory if it doesn't exist
     * - Saves the file using download.saveAs()
     * - Validates file exists using fs.existsSync()
     * - Validates file has content by checking length > 0
     * 
     * EXPECTED RESULT:
     * - The descriptor.yaml file should be downloaded successfully
     * - File should be saved to <project_root>/downloads/descriptor.yaml
     * - File should contain valid YAML content
     */

test('@Sanity Validate descriptor.yaml file download', async ({ page }) => {

  // Locate the main templates table element
  // This is the container that holds all template files and folders
  const table = page.getByRole('table');

  //-----------------------------------------------------------------------------------
  // STEP 1: Expand the 'templates' folder in the directory tree
  //-----------------------------------------------------------------------------------
  // WHAT: Find and click the expand button for the templates folder
  // HOW: 
  //   - getByRole('row') gets all table rows
  //   - .filter({ has: page.getByText('templates', { exact: true }) }) 
  //     filters to only rows containing exact text 'templates'
  //   - .getByRole('button') gets the expand/collapse button in that row
  //   - .click() performs the click action
  await table.getByRole('row')
    .filter({ has: page.getByText('templates', { exact: true }) })
    .getByRole('button')
    .click();

  //-----------------------------------------------------------------------------------
  // STEP 2: Expand the 'configuration' folder to reveal its files
  //-----------------------------------------------------------------------------------
  // WHAT: Find and click the expand button for the configuration folder
  // HOW: Same pattern as step 1 - filter by 'configuration' text and click button
  await table.getByRole('row')
    .filter({ has: page.getByText('configuration', { exact: true }) })
    .getByRole('button')
    .click();

  //-----------------------------------------------------------------------------------
  // STEP 3: Wait for folder expansion animation to complete
  //-----------------------------------------------------------------------------------
  // WHAT: Add a brief wait to ensure the UI has updated after folder expansion
  // HOW: Using page.waitForTimeout() for a fixed 1-second delay
  // Note: In production, prefer more reliable waits like waitForSelector
  await page.waitForTimeout(1000);

  //-----------------------------------------------------------------------------------
  // STEP 4: Locate the descriptor.yaml file row in the table
  //-----------------------------------------------------------------------------------
  // WHAT: Find the specific row containing descriptor.yaml
  // HOW: 
  //   - Filter table rows to find one containing 'descriptor.yaml'
  //   - Use { exact: true } to match the exact filename
  const fileRow = table.getByRole('row')
    .filter({ has: page.getByText('descriptor.yaml', { exact: true }) });

  //-----------------------------------------------------------------------------------
  // VALIDATION 1: Check that the file row is visible in the UI
  //-----------------------------------------------------------------------------------
  // WHAT: Ensures the descriptor.yaml file is displayed in the folder
  // HOW: Using expect().toBeVisible() - fails if element is hidden or not rendered
  await expect(fileRow).toBeVisible();

  //-----------------------------------------------------------------------------------
  // STEP 5: Hover over the file row to reveal action buttons
  //-----------------------------------------------------------------------------------
  // WHAT: Hovering typically reveals dropdown menus or action buttons in modern UIs
  // HOW: Using fileRow.hover() method
  await fileRow.hover();

  //-----------------------------------------------------------------------------------
  // STEP 6: Wait for the dropdown trigger button to appear after hover
  //-----------------------------------------------------------------------------------
  // WHAT: Give time for the hover-triggered UI elements to become visible
  await page.waitForTimeout(1000);

  //-----------------------------------------------------------------------------------
  // STEP 7: Find the dropdown trigger button (with fallback strategies)
  //-----------------------------------------------------------------------------------
  // WHAT: Locate the button that opens the download dropdown menu
  // HOW: Multiple selector strategies for robustness:
  // 
  // Strategy A: Try the specific CSS class used by the dropdown component
  // This is the most precise approach if the UI uses standard class naming
  let dropdownTrigger = fileRow.locator('button.ux-react-dropdown__trigger');
  
  // Strategy B: If not found in fileRow context, search in the entire table
  // This handles cases where the button might be positioned differently
  if (await dropdownTrigger.count() === 0) {
    dropdownTrigger = table.locator('button.ux-react-dropdown__trigger').first();
  }
  
  // Strategy C: Generic button search as final fallback
  // Iterates through all buttons and uses the first visible one
  if (await dropdownTrigger.count() === 0) {
    const allButtons = table.locator('button');
    const buttonCount = await allButtons.count();
    for (let i = 0; i < buttonCount; i++) {
      const btn = allButtons.nth(i);
      const isVisible = await btn.isVisible().catch(() => false);
      if (isVisible) {
        dropdownTrigger = btn;
        break;
      }
    }
  }

  //-----------------------------------------------------------------------------------
  // STEP 8: Click the dropdown trigger to open the context menu
  //-----------------------------------------------------------------------------------
  // WHAT: Opens the menu containing Download, Rename, Delete options
  await dropdownTrigger.click();

  //-----------------------------------------------------------------------------------
  // STEP 9: Wait for dropdown menu animation/appearance
  //-----------------------------------------------------------------------------------
  await page.waitForTimeout(500);

  //-----------------------------------------------------------------------------------
  // STEP 10: Initiate the file download
  //-----------------------------------------------------------------------------------
  // WHAT: Click the 'Download' option in the dropdown menu
  // HOW: 
  //   - Promise.all() ensures both actions happen concurrently
  //   - waitForEvent('download') sets up listener BEFORE clicking
  //   - This is crucial: if we waited after clicking, we might miss the event
  //   - getByText('Download').click() clicks the menu item
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByText('Download').click()
  ]);

  //-----------------------------------------------------------------------------------
  // VALIDATION 2: Validate the downloaded filename
  //-----------------------------------------------------------------------------------
  // WHAT: Ensures the file was downloaded with the correct name
  // HOW: 
  //   - download.suggestedFilename() gets the filename from the download headers
  //   - expect().toContain() checks if 'descriptor.yaml' is in the filename
  const fileName = download.suggestedFilename();
  expect(fileName).toContain('descriptor.yaml');

  //-----------------------------------------------------------------------------------
  // STEP 11: Prepare the downloads directory
  //-----------------------------------------------------------------------------------
  // WHAT: Create a 'downloads' folder in the project root if it doesn't exist
  // HOW: Using path.join() to create cross-platform path, fs.mkdirSync() to create directory
  const downloadsDir = path.join(process.cwd(), 'downloads');
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }

  //-----------------------------------------------------------------------------------
  // STEP 12: Save the downloaded file to disk
  //-----------------------------------------------------------------------------------
  // WHAT: Write the downloaded file content to the downloads directory
  const downloadPath = path.join(downloadsDir, fileName);
  await download.saveAs(downloadPath);

  //-----------------------------------------------------------------------------------
  // VALIDATION 3: Validate file exists on disk
  //-----------------------------------------------------------------------------------
  // WHAT: Ensures the file was successfully written to the filesystem
  // HOW: Using fs.existsSync() - returns true if file exists
  // This validates that saveAs() completed without errors
  expect(fs.existsSync(downloadPath)).toBeTruthy();

  //-----------------------------------------------------------------------------------
  // VALIDATION 4: Validate file has content (not empty)
  //-----------------------------------------------------------------------------------
  // WHAT: Ensures the downloaded file contains actual data
  // HOW: 
  //   - fs.readFileSync() reads the file content as UTF-8 string
  //   - expect(content.length).toBeGreaterThan(0) fails if file is empty
  // This catches cases where download might have succeeded but content is empty
  const content = fs.readFileSync(downloadPath, 'utf-8');
  expect(content.length).toBeGreaterThan(0);

  //-----------------------------------------------------------------------------------
  // SUCCESS: Log completion message
  //-----------------------------------------------------------------------------------
  console.log(`File downloaded successfully to: ${downloadPath}`);
});

});
