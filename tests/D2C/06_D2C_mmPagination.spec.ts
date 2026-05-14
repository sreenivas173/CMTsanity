/** @author Srinivasa Rao Allamsetti */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { MMDesignPage } from '../../pages/MMDesignPage';

test.describe('Pagination Validation on MM Design Page', () => {
  let loginPage: LoginPage;
  let mmDesignPage: MMDesignPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    mmDesignPage = new MMDesignPage(page);
    await loginPage.goto();
    await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
    await expect(page).toHaveURL(/design2code\/migration-management-design/);
    if (await mmDesignPage.isPage404()) {
      test.skip(true, 'Page is showing 404 error');
    }
    // Navigate to the MM Design page
    await mmDesignPage.navigateToMMDesign();
  });

  /**
   * Validates that upon loading the MM Design page, the pagination defaults to page 1.
   * This test ensures the table is visible and the displayed range starts from 1,
   * confirming the initial page state is correctly set.
   */
  test('Default page is 1', async ({ page }) => {
    // Ensure the data table is visible on the page
    await expect(mmDesignPage.table).toBeVisible();

    // Locate the pagination range text (e.g., "X items, Y-Z shown")
    const paginationInfo = mmDesignPage.paginationInfo;

    // Verify the range text is visible
    await expect(paginationInfo).toBeVisible();

    // Extract the text content of the range
    const text = await paginationInfo.textContent();
    // Use regex to capture the start of the range (e.g., "1-10" -> start = 1)
    const match = text!.match(/(\d+)-(\d+) shown/);

    // Convert the start value to a number
    const start = Number(match![1]);

    // Assert that the start of the range is 1, indicating page 1 is active
    expect(start).toBe(1);
  });

  /**
   * Validates that clicking on page number 2 in the pagination controls
   * correctly updates the table to display the next set of data rows.
   * This test ensures data changes when navigating between pages,
   * confirming proper pagination functionality.
   */
  test('Clicking page number (2) updates table data', async ({ page }) => {
    // Ensure the data table is visible on the page
    const table = mmDesignPage.table;
    await expect(table).toBeVisible();

    // Locate the pagination information text showing total items and range
    const paginationInfo = mmDesignPage.paginationInfo;
    await expect(paginationInfo).toBeVisible();

    // Extract the total number of items from the pagination text
    const totalItems = await mmDesignPage.getTotalItems();

    // Skip the test if there are not enough items to have multiple pages (assuming default page size of 10)
    if (totalItems <= 10) {
      test.skip(true, 'Only one page available');
    }

    // Get all table rows, ensuring there are data rows beyond the header
    const rows = table.getByRole('row');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(1);

    // Select the first data row (skipping the header row)
    const firstDataRow = rows.nth(1);

    // Capture initial ID
    const initialId = await firstDataRow.getByRole('gridcell').nth(1).textContent();

    // Click page 2 using POM method
    await mmDesignPage.goToPage(2);

    // Wait for pagination to update to page 2
    await expect(mmDesignPage.paginationInfo).toContainText('11-');

    // After navigation, get the first data row again and capture its ID
    const updatedFirstRow = table.getByRole('row').nth(1);
    const newId = await updatedFirstRow.getByRole('gridcell').nth(1).textContent();

    // Assert that the ID has changed, confirming the table data has updated
    expect(newId).not.toBe(initialId);
  });

  /**
   * Validates that the next arrow button in the pagination controls
   * correctly advances to the next page when clicked.
   * This test ensures the pagination range text updates to reflect
   * the new page, confirming forward navigation works properly.
   */
  test('@Sanity Next arrow works', async ({ page }) => {
    // Ensure the data table is visible on the page
    const table = mmDesignPage.table;
    await expect(table).toBeVisible();

    // Locate the pagination range text showing current range
    const rangeText = mmDesignPage.paginationInfo;
    await expect(rangeText).toBeVisible();

    // Capture the initial range text before clicking next
    const initialRange = await rangeText.textContent();

    // Click the next arrow button using POM method
    await mmDesignPage.clickNextArrow();
    await page.waitForTimeout(2000); // Wait for pagination to update

    // Wait for the pagination range text to change, indicating page navigation
    await expect(rangeText).not.toHaveText(initialRange!);
  });

  /**
   * Validates that the previous arrow button in the pagination controls
   * correctly navigates back to the previous page when clicked.
   * This test first navigates to page 2, then uses the previous arrow
   * to return to page 1, ensuring backward navigation works properly.
   */
  test('Previous arrow works correctly', async ({ page }) => {
    const table = mmDesignPage.table;
    await expect(table).toBeVisible();

    const rangeText = mmDesignPage.paginationInfo;
    await expect(rangeText).toBeVisible();

    const pageCount = await mmDesignPage.getPageCount();

    // If only 1 page exists, skip (not a failure)
    if (pageCount < 2) {
      test.skip(true, 'Only one page available — previous arrow not applicable');
    }

    // Click the second page dynamically
    await mmDesignPage.goToPage(2);

    // Wait for range to change to page 2
    await expect(rangeText).toHaveText(/11-\d+ shown/);

    // Click previous arrow
    await mmDesignPage.clickPreviousArrow();

    // Wait deterministically for range to return to first page
    await expect(rangeText).toContainText('1-');
  });

  /**
   * Tests page-size dropdown validation
   */
  test('@Sanity Page-size dropdown validation', async ({ page }) => {
    const table = mmDesignPage.table;
    await expect(table).toBeVisible();

    const rangeText = mmDesignPage.paginationInfo;
    await expect(rangeText).toBeVisible();

    const totalItems = await mmDesignPage.getTotalItems();
    expect(totalItems).toBeGreaterThan(0);

    // Set page size to 20 using POM method
    await mmDesignPage.setPageSize(20);

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
    await mmDesignPage.goToPage(expectedPages);

    const expectedStart = (expectedPages - 1) * pageSize + 1;
    const expectedEnd = totalItems;

    await expect(rangeText).toContainText(String(expectedStart));

    const finalText = await rangeText.textContent();
    const finalMatch = finalText!.match(/(\d+)-(\d+) shown/);

    expect(Number(finalMatch![1])).toBe(expectedStart);
    expect(Number(finalMatch![2])).toBe(expectedEnd);
  });

  /**
   * Validates that the pagination range text ("X–Y shown") updates correctly
   * when navigating to page 2. This test ensures the displayed range accurately
   * reflects the current page's data boundaries, confirming proper range calculation.
   */
  test('Pagination range text updates correctly on page 2', async ({ page }) => {
    // Ensure table is loaded
    const table = mmDesignPage.table;
    await expect(table).toBeVisible();

    // Locate the pagination range text showing current range
    const rangeText = mmDesignPage.paginationInfo;
    await expect(rangeText).toBeVisible();

    // Extract the total number of items from the initial range text
    const totalItems = await mmDesignPage.getTotalItems();

    expect(totalItems).toBeGreaterThan(0);

    // Assume default page size of 10 items per page
    const pageSize = 10;
    const expectedPages = Math.ceil(totalItems / pageSize);

    // Skip the test if there are not enough items for multiple pages
    expect(expectedPages).toBeGreaterThan(1);

    // Navigate to page 2
    await mmDesignPage.goToPage(2);

    // Wait dynamically for range update
    await expect.poll(async () => {
      return await rangeText.textContent();
    }).toMatch(/\d+ items, 11-\d+ shown/);

    // Validate exact start/end range
    const range = await mmDesignPage.getCurrentPageRange();
    const expectedStart = (2 - 1) * pageSize + 1; // 11
    const expectedEnd = Math.min(2 * pageSize, totalItems); // 20 or less

    expect(range.start).toBe(expectedStart);
    expect(range.end).toBe(expectedEnd);
  });
});
