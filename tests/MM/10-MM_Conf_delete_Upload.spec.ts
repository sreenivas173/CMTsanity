/**
 * @author Srinivasa Rao Allamsetti
 * @description E2E test for Delete existing config and Upload new config in Migration Manager
 * 
 * Test Flow:
 * 1. Search for config by name (e.g., 'oss-lm-migMaySr-21011')
 * 2. If found → Click config → Check status
 *    - If status is Active → Deactivate → Confirm popup → Refresh page
 *    - Then click Delete → Confirm popup → Refresh page
 * 3. If NOT found → Skip delete, proceed to upload
 * 4. Upload config from given file path
 * 
 * Test Coverage:
 * - Delete active config (deactivate first, then delete)
 * - Delete inactive config (direct delete)
 * - Upload new config
 * - Graceful skip if config not found
 */

import { test, expect } from '@playwright/test';
import { MM_LoginPage } from '../../pages/MM_LoginPage';
import { MM_ConfigPage } from '../../pages/MM_ConfigPage';
import 'dotenv/config';  // Load environment variables from .env file
// Test data configuration
const testCases = [
  {
    name: 'Delete Config and Upload New',
    configToDelete: 'oss-lm-migMaySr-21011',
    uploadFile: 'test-data/oss-lm-mmip_d2c_may_OP.zip'
  }
];

/**
 * Test Suite: MM Configuration Delete + Upload
 */
test.describe('MM session delete,Config Delete and Config Upload', () => {

  testCases.forEach(({ name, configToDelete, uploadFile }) => {

    test(`Delete: ${configToDelete} and Upload new config`, async ({ page }) => {
      test.setTimeout(300000); // 5 minutes for full delete + upload flow

      const mmLoginPage = new MM_LoginPage(page);
      const mmConfigPage = new MM_ConfigPage(page);

      // ===== STEP 1: Login =====
      console.log('Step 1: Logging in...');
      await mmLoginPage.goto();
      await mmLoginPage.login(process.env.MM_USERNAME!, process.env.MM_PASSWORD!);

      // ===== STEP 2: Navigate to Configurations =====
      console.log('Step 2: Navigating to Configurations...');
      await mmConfigPage.navigateToMMConfig();
      
await page.waitForTimeout(2000);

      // ===== STEP 3: Get initial count =====
      const initialCount = await mmConfigPage.getTotalItems();
      console.log(`Initial configuration count: ${initialCount}`);

      // ===== STEP 4: Search and Delete Config =====
      console.log(`Step 4: Searching for config: ${configToDelete}`);
      
      const configFound = await mmConfigPage.searchAndClickConfig(configToDelete);
        
      if (configFound) {
        console.log(`Config ${configToDelete} found, checking status...`);
        await page.waitForTimeout(2000);
        
        // Get status of the config
        const status = await mmConfigPage.getCurrentConfigStatus(configToDelete);
        console.log(`Config status: ${status}`);
        
        // If Active, deactivate first, then delete
        if (status.toLowerCase().includes('active')) {
          console.log('Config is Active, deactivating...');
          const deactivated = await mmConfigPage.deactivateConfigIfActive();
          
          if (deactivated) {
            console.log('Config deactivated, navigating back to list view...');
            await mmConfigPage.navigateToMMConfig();
            await page.waitForTimeout(3000);
            
            // Click config again after refresh
            await mmConfigPage.searchAndClickConfig(configToDelete);
            await page.waitForTimeout(2000);
          }
        }
        
        // Now delete the config (if NOT Active, directly delete without deactivate)
        console.log('Deleting config...');
        const deleted = await mmConfigPage.deleteCurrentConfig();
        
        if (deleted) {
          console.log(`Config ${configToDelete} deleted successfully`);
          // Navigate back to list view after delete
          await mmConfigPage.navigateToMMConfig();
          await page.waitForTimeout(2000);
        }
      } else {
        console.log(`Config ${configToDelete} not found - skipping delete, proceeding to upload`);
      }

      // ===== STEP 5: Upload New Config =====
      console.log(`Step 5: Uploading new config from: ${uploadFile}`);
      
      // Wait for upload button
      await expect(mmConfigPage.uploadButton).toBeVisible({ timeout: 45000 });
      await mmConfigPage.uploadButton.click();

      // Upload dialog
      const uploadDialog = page.getByRole('dialog');
      await expect(uploadDialog).toBeVisible({ timeout: 10000 });

      // Select file
      const fileInput = uploadDialog.locator('input[type="file"]');
      await fileInput.setInputFiles(uploadFile);
      console.log(`File selected: ${uploadFile}`);

      // Submit upload
      await uploadDialog.getByRole('button', { name: /upload/i }).first().click();
      console.log('Upload button clicked, waiting for processing...');
      
      // Wait for dialog to close
      try {
        //await uploadDialog.waitFor({ state: 'hidden', timeout: 60000 });
        // Click delete
await confirmDeleteBtn.click();
console.log('Confirmed deletion');

// Wait for either:
// 1. dialog disappears OR
// 2. success indication OR
// 3. config no longer exists

await Promise.race([
  // Dialog disappears
  expect(confirmDialog).toBeHidden({ timeout: 15000 }),

  // OR success notification (if exists)
  this.page.locator('.ux-react-notification__heading')
    .filter({ hasText: 'Success' })
    .waitFor({ state: 'visible', timeout: 15000 }),

  // OR config disappears from UI
  this.page.getByText(/oss-lm-migMaySr-21011/i)
    .waitFor({ state: 'detached', timeout: 15000 })
]);

return true;

        console.log('Upload dialog closed');
      } catch (e) {
        console.log('Checking upload status...');
        await page.waitForTimeout(10000);
      }

      // Wait for processing
      await page.waitForTimeout(15000);
      
      // Refresh page to see new config
      await mmConfigPage.navigateToMMConfig();
      await mmConfigPage.table.waitFor({ state: 'visible', timeout: 20000 });

      // ===== STEP 6: Validate Upload =====
      console.log('Step 6: Validating upload...');
      
      // Poll for new row status
      const firstRow = mmConfigPage.table.locator('[role="row"]').nth(1);
      await expect.poll(
        async () => (await firstRow.textContent() || '').trim(),
        { timeout: 90000 }
      ).toMatch(/Activating|Active/i);

      const afterCount = await mmConfigPage.getTotalItems();
      console.log(`Upload validated - count: ${afterCount}`);
      
      // Take screenshot
      await page.screenshot({ path: `screenshots/delete-upload-complete-${Date.now()}.png`, fullPage: true });

      console.log(`✅ Test PASS: ${name}`);
    });
  });
});
