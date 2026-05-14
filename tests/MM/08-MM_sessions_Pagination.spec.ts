/**
 * 
 * @author Srinivasa Rao Allamsetti
 * @description This test file validates the pagination functionality on the MM SESSIONS page.
 * It includes tests for:
 * - Default page validation (page 1)
 * - Page number navigation
 * - Next/Previous arrow functionality
 * - Page size dropdown validation
 * - Pagination range text updates
 */

import { test, expect } from '@playwright/test';
import { MM_LoginPage } from '../../pages/MM_LoginPage';
import { MM_SessionsPage } from '../../pages/MM_SessionsPage';

/**
 * Test Suite: Pagination Validation on MM SESSION Page
 * 
 * This suite validates the pagination functionality of the MM SESSION page.
 * It ensures that users can navigate through large datasets using pagination controls,
 * including page numbers, next/previous arrows, and page size dropdown.
 */
test.describe('Pagination Validation on MM SESSION Page', () => {
  // let loginPage: LoginPage;
  // let dblPage: DBLPage;
  let loginPage: MM_LoginPage;
  let mmSessionsPage: MM_SessionsPage;
  /**
   * beforeEach Hook - Runs before each test
   * 
   * Purpose: Sets up the test environment by:
   * 1. Creating a new LoginPage instance
   * 2. Creating a new DBLPage instance
   * 3. Navigating to the D2C application
   * 4. Logging in with test credentials
   * 5. Navigating to the DB Level Design page
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

  /** Validates default page is 1 */
  test('Default page is 1', async ({ page }) => {
    await expect(mmSessionsPage.table).toBeVisible();
    const text = await mmSessionsPage.getPaginationText();
    const match = text.match(/(\d+)-(\d+) shown/);
    const start = Number(match![1]);
    expect(start).toBe(1);
  });

  /** Clicking page number (2) updates table data */
  test('Clicking page number (2) updates table data', async ({ page }) => {
    const table = mmSessionsPage.table;
    await expect(table).toBeVisible();

    const paginationInfo = mmSessionsPage.paginationInfo;
    await expect(paginationInfo).toBeVisible();

    const totalItems = await mmSessionsPage.getTotalItems();
    if (totalItems <= 10) {
      test.skip(true, 'Only one page available');
    }

    const rows = table.getByRole('row');
    const firstDataRow = rows.nth(1);
    const initialId = await firstDataRow.getByRole('gridcell').nth(1).textContent();
    expect(initialId).toBeTruthy();

    const initialRange = await mmSessionsPage.getPaginationText();

    // Click page 2
    const page2Exists = await mmSessionsPage.goToPage(2);
    if (!page2Exists) {
      test.skip(true, 'Only one page available - page 2 button not found');
    }

    // Wait for pagination text to change first
    await expect(paginationInfo).not.toHaveText(initialRange!);
    
    // Wait for table to fully reload by waiting for a network request or loading state
    // Wait for the table body to be refreshable - check for any loading indicator disappearance
    await page.waitForFunction(() => {
      const loading = document.querySelector('.ant-spin-container, .ant-table-loading');
      return !loading || (loading as HTMLElement).style.display === 'none';
    });
    
    // Additional wait to ensure table data is rendered
    await page.waitForTimeout(2000);

    // Get fresh reference to table and rows
    const updatedFirstRow = table.getByRole('row').nth(1);
    await expect(updatedFirstRow).toBeVisible();
    
    const newId = await updatedFirstRow.getByRole('gridcell').nth(1).textContent();
    expect(newId).toBeTruthy();
    expect(newId).not.toBe(initialId);
  });

  /** Next arrow works */
  test('Next arrow works', async ({ page }) => {
    await expect(mmSessionsPage.table).toBeVisible();
    const rangeText = mmSessionsPage.paginationInfo;
    await expect(rangeText).toBeVisible();

    const initialRange = await mmSessionsPage.getPaginationText();

    // Check if more than one page
    const pageCount = await mmSessionsPage.getPageCount();
    if (pageCount < 2) {
      test.skip(true, 'Only one page available');
    }

    // Click next arrow
    const clicked = await mmSessionsPage.clickNextArrow();
    if (!clicked) {
      test.skip(true, 'Already on last page');
    }

    await expect(rangeText).not.toHaveText(initialRange!);
  });


  
  /** Previous arrow works correctly */
  test('Previous arrow works correctly', async ({ page }) => {
    await expect(mmSessionsPage.table).toBeVisible();

    const pageCount = await mmSessionsPage.getPageCount();
    if (pageCount < 2) {
      test.skip(true, 'Only one page available');
    }

    // Go to page 2 first
    await mmSessionsPage.goToPage(2);

    // Click previous arrow
    await mmSessionsPage.clickPreviousArrow();

    // Verify we're back to page 1
    const rangeText = await mmSessionsPage.getPaginationText();
    expect(rangeText).toMatch(/1-/);
  });

  /** Page-size dropdown validation */
  test('Page-size dropdown validation', async ({ page }) => {
    const table = mmSessionsPage.table;
    await expect(table).toBeVisible();

    const rangeText = mmSessionsPage.paginationInfo;
    await expect(rangeText).toBeVisible();

    const totalItems = await mmSessionsPage.getTotalItems();
    expect(totalItems).toBeGreaterThan(0);

    // Set page size to 20 using POM method
    await mmSessionsPage.setPageSize(20);

    // Wait deterministically for correct range
    await expect.poll(async () => {
      return await rangeText.textContent();
    }).toMatch(/\d+ items, 1-\d+ shown/);

    const updatedText = await rangeText.textContent();
    const firstPageMatch = updatedText!.match(/(\d+)-(\d+) shown/);

    expect(Number(firstPageMatch![1])).toBe(1);
    expect(Number(firstPageMatch![2])).toBeLessThanOrEqual(20);

    const pageSize = 20;
    const expectedPages = Math.ceil(totalItems / pageSize);

    if (expectedPages === 1) return;

    // Navigate to the last page
    await mmSessionsPage.goToPage(expectedPages);

    const expectedStart = (expectedPages - 1) * pageSize + 1;
    const expectedEnd = totalItems;

    await expect(rangeText).toContainText(String(expectedStart));

    const finalText = await rangeText.textContent();
    const finalMatch = finalText!.match(/(\d+)-(\d+) shown/);

    expect(Number(finalMatch![1])).toBe(expectedStart);
    expect(Number(finalMatch![2])).toBe(expectedEnd);
  });

  /** Pagination range text updates correctly on page 2 */
  test('Pagination range text updates correctly on page 2', async ({ page }) => {
    await expect(mmSessionsPage.table).toBeVisible();

    const totalItems = await mmSessionsPage.getTotalItems();
    const pageSize = 10;
    const expectedPages = Math.ceil(totalItems / pageSize);

    if (expectedPages < 2) {
      test.skip(true, 'Not enough data for pagination');
    }

    // Navigate to Page 1
    await mmSessionsPage.goToPage(1);
    await expect(mmSessionsPage.paginationInfo).toHaveText(new RegExp(`\\d+ items, 1-${pageSize} shown`));

    // Navigate to Page 2
    await mmSessionsPage.goToPage(2);
    await expect.poll(async () => {
  return await mmSessionsPage.paginationInfo.textContent();
}).toMatch(/\d+ items, 11-\d+ shown/);
  });
  
});
