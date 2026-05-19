/**
 * @author Srinivasa Rao Allamsetti
 * @description Validates MM Session Creation workflow and pagination impact
 * 
 * Test Coverage:
 * - Complete session creation with dynamic naming (date/timestamp)
 * - Config selection and description fields
 * - Pagination count increase validation post-creation
 * - Full URL navigation to sessions page
 */

import { test, expect } from '@playwright/test';
import { MM_LoginPage } from '../../pages/MM_LoginPage';
import { MM_SessionsPage } from '../../pages/MM_SessionsPage';

import path from 'path';

/**
 * Test Suite: MM Session Creation Validation
 * Creates new migration session and verifies table pagination update
 */
test.describe('@MMsanity SMM Session Creation Validations', () => {

  let loginPage: MM_LoginPage;
  let mmSessionsPage: MM_SessionsPage;

  /**
   * Setup: Authentication and page object initialization
   */
  test.beforeEach(async ({ page }) => {
    loginPage = new MM_LoginPage(page);
    mmSessionsPage = new MM_SessionsPage(page);

    await loginPage.goto();
    // Login with credentials
    await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
    // Wait for login to complete
    await page.waitForTimeout(3000);
  });

  /**
   * Test: Create New Session and Validate Pagination Growth
   * - Navigate to exact QA sessions URL
   * - Generate dynamic session name/description with timestamps
   * - Create session using POM method
   * - Verify total items count increases
   */
//   test('MM Session Create - Verify Pagination Count Increases', async ({ page }) => {

//     // Navigate to QA Sessions page using full URL
//     const fullUrl = 'https://cdn-edge-service-qa1.cloudmt.managed.netcracker.cloud/fragment/migration-ui/sessions';
//     await mmSessionsPage.navigateToMMSession(fullUrl);
//     await expect(page).toHaveURL(/sessions$/);

//     // Verify pagination controls visible (indicates page fully loaded)
//     await expect(mmSessionsPage.paginationInfo).toBeVisible({ timeout: 10000 });

//     // Generate dynamic test data
//     const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
//     const datetime = new Date().toISOString().slice(0,19).replace(/[:]/g, '-').replace('T', '_');
//     const sessionName = `Srini_MM_AT_Newsession_${today}`;
//     const sessionDesc = `SRINI_MM_AT_${datetime}`;

//     // Record baseline count
//     //const initialCount = await mmSessionsPage.getTotalItems();
//     //console.log('Initial count:', `${initialCount}`);

//       // ✅ BEFORE creation


//     // Execute session creation via Page Object
//     await mmSessionsPage.createNewSession(
//       sessionName, 
//       'oss-lm-migMaySr-21011', 
//       sessionDesc, 
//       'cbt'
//     );

//   //  const initialCount = await mmSessionsPage.getTotalItems();
//     //console.log(`Initial count: ${initialCount}`);

// // Create
// await createButton.click();

// // Wait for dialog close
// await expect(dialog).toBeHidden();

// // ✅ Wait for actual UI update (NOT timeout)
// await expect(
//   mmSessionsPage.page.getByRole('link', { name })
// ).toBeVisible({ timeout: 15000 });

// // ✅ AFTER creation
// const finalCount = await mmSessionsPage.getTotalItems();
// console.log(`Final count: ${finalCount}`);

// expect(finalCount).toBeGreaterThan(initialCount);

// });   


test('MM Session Create - Verify Pagination Count Increases', async ({ page }) => {

  const fullUrl = 'https://cdn-edge-service-qa1.cloudmt.managed.netcracker.cloud/fragment/migration-ui/sessions';
  await mmSessionsPage.navigateToMMSession(fullUrl);
  await expect(page).toHaveURL(/sessions$/);

  await expect(mmSessionsPage.paginationInfo).toBeVisible();

  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const datetime = new Date().toISOString().slice(0,19).replace(/[:]/g, '-').replace('T', '_');

  //const sessionName = `Srini_MM_AT_Newsession_${today}`;
  const sessionName = `Srini_MM_AT_Newsession_${datetime}`;
  const sessionDesc = `SRINI_MM_AT_smoke_${datetime}`;

  // ✅ BEFORE creation
  const initialCount = await mmSessionsPage.getTotalItems();
  console.log(`Initial count: ${initialCount}`);

  // Create session
  await mmSessionsPage.createNewSession(
    sessionName,
    'oss-lm-migMaySr-21011',
    sessionDesc,
    'cbt'
  );

  // ✅ Step 1: Wait for success notification (VERY IMPORTANT)
await expect(
  page.getByText('has been created')
).toBeVisible({ timeout: 15000 });

// (optional but helps stabilize UI)
await page.waitForTimeout(1000);

// Wait until new session appears in FIRST row
await expect
  .poll(async () => {
    const text = await page.getByRole('row').nth(1).textContent();
    return text;
  }, { timeout: 20000 })
  .toContain(sessionName);

  // ✅ AFTER creation
  const finalCount = await mmSessionsPage.getTotalItems();
  console.log(`Final count: ${finalCount}`);

  expect(finalCount).toBeGreaterThan(initialCount);
});
});

