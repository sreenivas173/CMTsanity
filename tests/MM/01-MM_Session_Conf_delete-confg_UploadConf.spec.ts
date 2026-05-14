/**
 * @author Srinivasa Rao Allamsetti
 * @description E2E test for Delete existing config and Upload new config in Migration Manager
 */


import { test, expect } from '@playwright/test';

const screenshotOnFail = true;

import { MM_LoginPage } from '../../pages/MM_LoginPage';
import { MM_ConfigPage } from '../../pages/MM_ConfigPage';
import { MM_SessionsPage } from '../../pages/MM_SessionsPage';

const testCases = [
  {
    name: 'Delete Config and Upload New',
    configToDelete: 'oss-lm-migMaySr-21011',
    // relative to project root as used by Playwright setInputFiles
    uploadFile: 'test-data/oss-lm-mmip_d2c_may_OP.zip',
    configVersionToMatch: '1.0.1-1777625561'
  }
];

test.describe('@MMsanity MM Configuration Delete and Upload', () => {
  testCases.forEach(({ name, configToDelete, uploadFile, configVersionToMatch }) => {
    test(`Delete: ${configToDelete} and Upload new config`, async ({ page }) => {
      test.setTimeout(300000);

      const mmLoginPage = new MM_LoginPage(page);
      const mmConfigPage = new MM_ConfigPage(page);
      const mmSessionsPage = new MM_SessionsPage(page);

      // ===== STEP 1: Login =====
      console.log('Step 1: Logging in...');
      await mmLoginPage.goto();
      await mmLoginPage.login('cpq-admin@netcracker.com', 'MARket1234!');

      // ===== STEP 2: Navigate to Configurations =====
      console.log('Step 2: Navigating to Configurations...');
            const configsTabAfterDeactivate = page.getByRole('tab', { name: 'Configurations' });
            await configsTabAfterDeactivate.click({ force: true });
            await mmConfigPage.table.waitFor({ state: 'visible', timeout: 20000 });


      // ===== STEP 3.1: Delete related sessions before deleting config =====
      console.log(`Step 3.1: Deleting sessions matching configuration version: ${configVersionToMatch}`);
      const fullSessionsUrl =
        'https://cdn-edge-service-qa1.cloudmt.managed.netcracker.cloud/fragment/migration-ui/sessions';

      await page.goto(fullSessionsUrl);
      await expect(page.getByRole('table')).toBeVisible({ timeout: 30000 });

      // Always use filters (remove reliance on sessions search)
      console.log(`Applying sessions filter by configuration version (contains): ${configVersionToMatch}`);

      const statusHeader = page.getByRole('gridcell', { name: 'Status' }).first();
      await expect(statusHeader).toBeVisible({ timeout: 15000 });
      await statusHeader.click();
      await page.getByRole('menuitem', { name: 'Add Filter' }).click();

      const popup = page.getByRole('dialog', { name: 'Filters' });
      await expect(popup).toBeVisible({ timeout: 15000 });

      const controls = popup.locator('.ux-react-filters-item__control');
      await expect(controls.first()).toBeVisible({ timeout: 10000 });

      // Select filter field (first value control) => Configuration version
      await controls.nth(0).click({ timeout: 5000 });
      const fieldOption = page
        .locator('[role="listbox"]:visible')
        .getByRole('option', { name: /configuration version/i, exact: false })
        .first();
      await expect(fieldOption).toBeVisible({ timeout: 2500 });
      await fieldOption.click();

      // Operator => contains
      const operatorControl = controls.nth(1);
      await operatorControl.click({ timeout: 5000 });
      await page
        .locator('[role="listbox"]:visible')
        .getByRole('option', { name: /contains/i, exact: false })
        .first()
        .click();

      // Value => Given version
      const valueInput = popup.locator('input[type="text"], input[type="search"], textarea').first();
      await valueInput.fill(configVersionToMatch);

      await popup.getByRole('button', { name: 'Apply' }).click();
      await page.waitForTimeout(3000);

      await expect(page.getByRole('table')).toBeVisible({ timeout: 30000 });

      // Delete sessions matching configuration version BEFORE deleting/adding config
// (avoid relying on stale locators; re-query after each delete)

const getMatchingSessionRows = () =>
  page
    .getByRole('row')
    .filter({ hasText: configVersionToMatch });

const getMatchingSessionLinks = () =>
  getMatchingSessionRows()
    .locator('a');

let matchingCount = await getMatchingSessionLinks().count();

console.log(`Found ${matchingCount} session(s) after filter`);

const maxDeletes = Math.min(matchingCount, 50);

for (let i = 0; i < maxDeletes; i++) {

//  await page.waitForLoadState('networkidle');

  const matchingSessionLinks = getMatchingSessionLinks();

  const currentCount = await matchingSessionLinks.count();

  if (currentCount === 0) {
    console.log('No more matching sessions found');
    break;
  }
//======================
const link = matchingSessionLinks.first();

const sessionName = (await link.textContent())?.trim();

console.log(`Deleting session: ${sessionName}`);

// Open session details
await link.click();

console.log('Session details page opened');

// Wait for page action buttons
await expect(
  page.getByRole('button', { name: 'Edit' })
).toBeVisible({
  timeout: 20000
});

// Click 3-dots menu
// Wait for toolbar section
const actionToolbar = page
  .getByRole('button', { name: 'Edit' })
  .locator('..');

await expect(actionToolbar).toBeVisible({
  timeout: 15000
});

// 3-dots button = last button inside toolbar
const actionMenuButton = actionToolbar
  .locator('button')
  .last();

await expect(actionMenuButton).toBeVisible({
  timeout: 15000
});

console.log('Clicking 3-dots menu...');

await actionMenuButton.click({
  force: true
});

// Click Delete option
const deleteOption = page.getByText('Delete');

await expect(deleteOption).toBeVisible({
  timeout: 15000
});

console.log('Clicking Delete option...');

await deleteOption.click();

// Confirm delete popup
const confirmDeleteButton = page
  .getByRole('dialog')
  .getByRole('button', { name: /^delete$/i });

await expect(confirmDeleteButton).toBeVisible({
  timeout: 15000
});

console.log('Confirming session delete...');

await confirmDeleteButton.click();

// Wait for success notification
// Wait until redirected back to Sessions table
await expect(page.getByRole('table')).toBeVisible({
  timeout: 30000
});

// Verify deleted session no longer exists
await expect(
  page.getByRole('link', { name: sessionName || '' })
).toHaveCount(0, {
  timeout: 30000
});

console.log('Session deleted successfully');

//=============================================================

  // Reload page to refresh grid state
await page.reload();

await expect(page.getByRole('table')).toBeVisible({
  timeout: 30000
});

    // Re-apply filter if needed
  const hasFilteredResults = await getMatchingSessionLinks().count();

  if (hasFilteredResults === 0) {

    console.log('Re-applying filter after reload...');

    const statusHeader = page
      .getByRole('gridcell', { name: 'Status' })
      .first();

    await statusHeader.click({ force: true });

    await page
      .getByRole('menuitem', { name: 'Add Filter' })
      .click();

    const popup = page.getByRole('dialog', {
      name: 'Filters'
    });

    await expect(popup).toBeVisible({
      timeout: 15000
    });

    const controls = popup.locator(
      '.ux-react-filters-item__control'
    );

    await controls.nth(0).click({
      timeout: 5000
    });

    const option = page
      .locator('[role="listbox"]:visible')
      .getByRole('option', {
        name: /configuration version/i,
        exact: false
      })
      .first();

    await expect(option).toBeVisible({
      timeout: 5000
    });

    await option.click();

    // contains operator
    await controls.nth(1).click({
      timeout: 5000
    });

    await page
      .locator('[role="listbox"]:visible')
      .getByRole('option', {
        name: /contains/i,
        exact: false
      })
      .first()
      .click();

    // value input
    const valueInput = popup
      .locator(
        'input[type="text"], input[type="search"], textarea'
      )
      .first();

    await valueInput.fill(configVersionToMatch);

    await popup
      .getByRole('button', { name: 'Apply' })
      .click();

    //await page.waitForLoadState('networkidle');

    await page.waitForTimeout(3000);
  }

  matchingCount = await getMatchingSessionLinks().count();

  console.log(
    `Remaining sessions after deletes: ${matchingCount}`
  );
}

// Final safety validation
await expect.poll(
  async () => {

   // await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

 return await page
  .getByRole('row')
  .filter({ hasText: configVersionToMatch })
  .count();
  },
  {
    timeout: 60000,
    intervals: [2000],
    message:
      'Timed out waiting for all matching sessions to be deleted'
  }
).toBe(0);

console.log('All matching sessions deleted successfully');


      // ===== STEP 3.2: Go back to Configurations =====
      console.log('Returning to Configurations...');

      // Re-open configs tab directly (avoid navigateToMMConfig() scrollIntoViewIfNeeded flakiness)
      const configsTab = page.getByRole('tab', { name: 'Configurations' });
      await configsTab.waitFor({ state: 'visible', timeout: 15000 });
      await configsTab.click({ force: true });
      await mmConfigPage.table.waitFor({ state: 'visible', timeout: 20000 });

      await page.waitForTimeout(2000);

      const initialCount = await mmConfigPage.getTotalItems();
      console.log(`Initial configuration count: ${initialCount}`);



      // ===== STEP 4: Search and Delete Config =====
      console.log(`Step 4: Searching for config: ${configToDelete}`);

      const configFound = await mmConfigPage.searchAndClickConfig(configToDelete);

      if (configFound) {
        console.log(`Config ${configToDelete} found, checking status...`);
        await page.waitForTimeout(2000);

        const status = await mmConfigPage.getCurrentConfigStatus(configToDelete);
        console.log(`Config status: ${status}`);

        if (status.toLowerCase().includes('active')) {

          console.log('Config is Active, deactivating...');
          const deactivated = await mmConfigPage.deactivateConfigIfActive();

          if (deactivated) {
            console.log('Config deactivated, navigating back to list view...');
            const configsTabAfterDeactivate = page.getByRole('tab', { name: 'Configurations' });
            await configsTabAfterDeactivate.click({ force: true });
            await mmConfigPage.table.waitFor({ state: 'visible', timeout: 20000 });
            await page.waitForTimeout(1000);



            await mmConfigPage.searchAndClickConfig(configToDelete);
            await page.waitForTimeout(2000);
          }
        }

        console.log('Deleting config...');
        const deleted = await mmConfigPage.deleteCurrentConfig();

        if (deleted) {
          console.log(`Config ${configToDelete} deleted successfully`);
          await mmConfigPage.navigateToMMConfig();
          await page.waitForTimeout(2000);
        }
      } else {
        console.log(`Config ${configToDelete} not found - skipping delete, proceeding to upload`);
      }

      // ===== STEP 5: Upload New Config =====
      console.log(`Step 5: Uploading new config from: ${uploadFile}`);

      await expect(mmConfigPage.uploadButton).toBeVisible({ timeout: 45000 });
      await mmConfigPage.uploadButton.click();

      const uploadDialog = page.getByRole('dialog');
      await expect(uploadDialog).toBeVisible({ timeout: 10000 });

      const fileInput = uploadDialog.locator('input[type="file"]');
      await fileInput.setInputFiles(uploadFile);
      console.log(`File selected: ${uploadFile}`);

      await uploadDialog.getByRole('button', { name: /upload/i }).first().click();
      console.log('Upload button clicked, waiting for processing...');

      await page.waitForTimeout(10000);

      const successHeading = page
        .locator('.ux-react-notification__heading')
        .filter({ hasText: 'Success' });

      await successHeading.first().waitFor({ state: 'visible', timeout: 30000 }).catch(() => {});

      await page.waitForTimeout(15000);

      await mmConfigPage.navigateToMMConfig();
      await mmConfigPage.table.waitFor({ state: 'visible', timeout: 20000 });

      // ===== STEP 6: Validate Upload =====
      console.log('Step 6: Validating upload...');

      const firstRow = mmConfigPage.table.locator('[role="row"]').nth(1);
      await expect.poll(
        async () => (await firstRow.textContent())?.trim() || '',
        { timeout: 90000 }
      ).toMatch(/Activating|Active/i);

      const afterCount = await mmConfigPage.getTotalItems();
      console.log(`Upload validated - count: ${afterCount}`);

      await page.screenshot({
        path: `screenshots/delete-upload-complete-${Date.now()}.png`,
        fullPage: true
      });

      console.log(`✅ Test PASS: ${name}`);
    });
  });
});

