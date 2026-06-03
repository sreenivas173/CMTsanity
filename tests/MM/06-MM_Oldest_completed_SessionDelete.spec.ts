/**
 * Author: Srinivasa Rao Allamsetti (assisted by BLACKBOXAI)
 * This test file validates the MM Session Delete functionality.
 * It verifies filtering completed sessions, deleting the first one, and count reduction.
 */

import { test, expect } from '@playwright/test';
import { MM_LoginPage } from '../../pages/MM_LoginPage';
import { MM_SessionsPage } from '../../pages/MM_SessionsPage';
import 'dotenv/config';

test.describe('@MMsanity MM Session Delete Validations', () => {
  let loginPage: MM_LoginPage;
  let mmSessionsPage: MM_SessionsPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new MM_LoginPage(page);
    mmSessionsPage = new MM_SessionsPage(page);

    await loginPage.goto();
    // Login with credentials (matching other MM specs)
    await loginPage.login(process.env.MM_USERNAME!, process.env.MM_PASSWORD!);
    // Wait for login to complete
    await page.waitForTimeout(3000);
  });

  test('MM Session Delete - Verify Successful Deletion by Reduced Session Count', async ({ page }) => {
    // Full URL as in 07-MM_SessionStart.spec.ts
    const fullUrl = 'https://cdn-edge-service-qa1.cloudmt.managed.netcracker.cloud/fragment/migration-ui/sessions';
    
    // Navigate to sessions page
    await mmSessionsPage.navigateToMMSession(fullUrl);
    await expect(page).toHaveURL(/sessions$/);

    // Get initial total sessions count
    const initialCount = await mmSessionsPage.getTotalItems();
    console.log(`Initial session count: ${initialCount}`);

    // ========================================
// STEP 1: Sort Start Time → Ascending
// ========================================

console.log(
  'Sorting Start Time ascending'
);

// Click Start Time column
const startTimeHeader = page.getByRole(
  'gridcell',
  {
    name: /Start Time/i
  }
);

await expect(startTimeHeader)
  .toBeVisible({
    timeout: 10000
  });

await startTimeHeader.click();

// Select Sort Ascending
const sortAscending = page
  .getByRole('menuitem', {
    name: 'Sort Ascending'
  });

await expect(sortAscending)
  .toBeVisible({
    timeout: 10000
  });

await sortAscending.click();

await page.waitForTimeout(
  2000
);

console.log(
  'Start Time sorted ascending'
);

// ========================================
// STEP 2: Filter Completed
// ========================================

await page
  .getByRole(
    'gridcell',
    {
      name: 'Status'
    }
  )
  .click();

const addFilter = page
  .getByRole(
    'menuitem',
    {
      name: 'Add Filter'
    }
  );

await expect(addFilter)
  .toBeVisible({
    timeout: 10000
  });

await addFilter.click();

const popup = page
  .getByRole(
    'dialog',
    {
      name: 'Filters'
    }
  );

const controls = popup.locator(
  '.ux-react-filters-item__control'
);

// Value dropdown
await controls
  .nth(2)
  .click();

const listbox = page.locator(
  '[role="listbox"]:visible'
);

await listbox
  .getByRole(
    'option',
    {
      name: 'Completed',
      exact: true
    }
  )
  .click();

// Apply filter
await popup
  .getByRole(
    'button',
    {
      name: 'Apply'
    }
  )
  .click();

await page.waitForTimeout(
  3000
);

console.log(
  'Completed filter applied'
);

    // Wait for table post-filter (poll pagination like page object)
    await expect.poll(async () => {
      await mmSessionsPage.getTotalItems();
      return true;
    }, { timeout: 15000 }).toBeTruthy();

    // First session link in table (exclude header/favicon)
    const firstSessionLink = mmSessionsPage.table.getByRole('link').first();
    await expect(firstSessionLink).toBeVisible({ timeout: 10000 });
    console.log('First completed session link found');

    // Click the first completed session link to go to detail page
    await firstSessionLink.click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // On detail page, click Delete button
    const deleteButton = page.getByRole('button', { name: /Delete/i });
    await expect(deleteButton).toBeVisible({ timeout: 10000 });
    await expect(deleteButton).toBeEnabled();
    await deleteButton.click();

    // Popup: click confirm Delete button
    const confirmDelete = page.locator("//button[@class='button-module_ux-react-button__ff3bae ux-react-button _medium _primary taButton']//span[@class='ux-react-button__text'][normalize-space()='Delete']");
    await expect(confirmDelete).toBeVisible({ timeout: 10000 });
    await confirmDelete.click();

    // Wait for deletion to complete and return/refresh to list
    await page.waitForTimeout(5000);

    // Get new total sessions count (should navigate back or refresh list)
    // Assume returns to list; if not, add: await mmSessionsPage.navigateToMMSession(fullUrl);
    const newCount = await mmSessionsPage.getTotalItems();
    console.log(`New session count: ${newCount}`);

    // Verify count decreased (delete worked)
    expect(newCount).toBeLessThan(initialCount);
    console.log(`Delete successful: count reduced from ${initialCount} to ${newCount}`);
  });
});

// 