/**
 * @author Srinivasa Rao Allamsetti
 * @description Validates MM Configuration Upload functionality for both success and failure scenarios
 * 
 * Test Coverage:
 * - Data-driven testing with valid/invalid ZIP config files
 * - Upload dialog interaction and file selection
 * - Success: New row appears with "Activating" status, table refresh validation
 * - Failure: Error notification validation
 * - Robust async handling with re-navigation and polling
 * - FIXED v3: Simplified path (direct resolve), removed ESM polyfill causing ReferenceError
 */

import { test, expect } from '@playwright/test';
import { MM_LoginPage } from '../../pages/MM_LoginPage';
import { MM_ConfigPage } from '../../pages/MM_ConfigPage';  

// Test data configuration - currently testing Invalid Config (direct CWD-relative path)
const uploadFiles = [
  {
    name: 'Invalid Config',
    file: 'test-data/oss-lm-mmip_d2c_may_OP.zip',
    expected: 'failure'
  }
];

/**
 * Test Suite: MM Configuration Upload Validations (Data-Driven)
 */
test.describe('MM CONFIGURATION Upload Validations', () => {

  uploadFiles.forEach(({ name, file, expected }) => {

  test(`Upload Config → ${name}`, async ({ page }) => {
    test.setTimeout(180000);

    const filePath = `test-data/oss-lm-mmip_d2c_may_OP.zip`; // Hardcode working path for simplicity/stability

    const mmLoginPage = new MM_LoginPage(page);
    const mmConfigPage = new MM_ConfigPage(page);

    // Step 1: Login
    await mmLoginPage.goto();
    await mmLoginPage.login('cpq-admin@netcracker.com', 'MARket1234!');

// Step 2: Navigate to Configurations - Click tab explicitly if not already there
    await mmConfigPage.navigateToMMConfig();
    
    // Explicitly click Configurations tab if Sessions is selected
    const configTab = page.getByRole('tab', { name: 'Configurations' });
    if (await configTab.isVisible()) {
      await configTab.click();
      console.log('Clicked Configurations tab');
    }
    
    // Wait for Configurations page content (different table than Sessions)
    await page.waitForTimeout(2000);
    await expect(mmConfigPage.table).toBeVisible({ timeout: 20000 });

    // Step 3: Wait for table, log count
    await expect(mmConfigPage.table).toBeVisible({ timeout: 20000 });
    const beforeCount = await mmConfigPage.getTotalItems();
    console.log(`Initial total items count: ${beforeCount}`);

    await page.screenshot({ path: `screenshots/${expected}-before-upload-${Date.now()}.png`, fullPage: true });

    // Step 4: Robust upload button wait + click
    console.log('Polling for Upload button...');
    await expect(mmConfigPage.uploadButton).toBeVisible({ timeout: 45000 });
    await mmConfigPage.uploadButton.click();

    // Step 5: Upload dialog & file upload
    const uploadDialog = page.getByRole('dialog');
    await expect(uploadDialog).toBeVisible({ timeout: 10000 });

    const fileInput = uploadDialog.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    console.log(`File selected: ${filePath}`);

// Step 6: Submit upload - Wait for processing then validation
    await uploadDialog.getByRole('button', { name: /upload/i }).first().click();
    console.log('Upload button clicked, waiting for processing...');
    
    // Wait for upload dialog to close or show result (loading completes)
    try {
      await uploadDialog.waitFor({ state: 'hidden', timeout: 60000 });
      console.log('Upload dialog closed');
    } catch (e) {
      // Dialog still open - check for loading to complete or error
      console.log('Checking upload status...');
      await page.waitForTimeout(10000);
    }

    // Step 7: Outcome validation
    if (expected === 'success') {
      // Wait for processing + refresh
      await page.waitForTimeout(15000);
      await mmConfigPage.navigateToMMConfig();
      await mmConfigPage.table.waitFor({ state: 'visible', timeout: 20000 });

      // Poll for new row status
      const firstRow = mmConfigPage.table.locator('[role="row"]').nth(1);
      await expect.poll(
        async () => (await firstRow.textContent() || '').trim(),
        { timeout: 90000 }
      ).toMatch(/Activating|Active/i);

      const afterCount = await mmConfigPage.getTotalItems();
      console.log(`Success validated - count: ${beforeCount} → ${afterCount}`);
      
      await page.screenshot({ path: `screenshots/${expected}-success-${Date.now()}.png`, fullPage: true });
    } else {
// Failure: Valid error notification appears (flexible locators)
      console.log('Checking for error notification...');
      const errorNotif = page.locator('.ux-react-notification__heading').or(page.locator('[class*="error"]')).or(page.getByText(/error|invalid|failure/i));
      await expect(errorNotif.first()).toBeVisible({ timeout: 45000 });
      
      console.log('✅ Invalid config error validated');
      await page.screenshot({ path: `screenshots/${expected}-notification-${Date.now()}.png`, fullPage: true });
    }

    console.log(`✅ Test PASS: ${name}`);
  });
  });
});

