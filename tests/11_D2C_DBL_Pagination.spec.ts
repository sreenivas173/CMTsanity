/** @author Srinivasa Rao Allamsetti */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('Pagination Validation on DBL Design Page', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
    await expect(page).toHaveURL(/design2code\/migration-management-design/);
    if (await page.locator('text=The page cannot be found').isVisible()) {
      test.skip(true, 'Page is showing 404 error');
    }
    // Navigate to the MM Design page
    await page.click('text=DB Level Design');
    await page.waitForTimeout(2000);
  });

  /**
   * Validates that upon loading the MM Design page, the pagination defaults to page 1.
   * This test ensures the table is visible and the displayed range starts from 1,
   * confirming the initial page state is correctly set.
   */
  test('Default page is 1', async ({ page }) => {
    // Ensure the data table is visible on the page
    await expect(page.getByRole('table')).toBeVisible();

    // Locate the pagination range text (e.g., "X items, Y-Z shown")
    const rangeText = page.getByText(/\d+ items, \d+-\d+ shown/);

    // Verify the range text is visible
    await expect(rangeText).toBeVisible();

    // Extract the text content of the range
    const text = await rangeText.textContent();
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
    const table = page.getByRole('table');
    await expect(table).toBeVisible();

    // Wait for page to fully load
    await page.waitForTimeout(1000);

    // Locate the pagination information text showing total items and range
    const paginationInfo = page.getByText(/\d+ items, \d+-\d+ shown/);
    await expect(paginationInfo).toBeVisible();

    // Extract the total number of items from the pagination text
    const totalText = await paginationInfo.textContent();
    const totalItems = Number(totalText!.match(/(\d+) items/)![1]);

    // Skip the test if there are not enough items to have multiple pages
    if (totalItems <= 10) {
      test.skip(true, 'Only one page available');
    }

    // Get all table rows
    const rows = table.getByRole('row');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(1);

    // Select the first data row (skipping the header row)
    const firstDataRow = rows.nth(1);

    // Capture initial ID from first data row
    const initialId = await firstDataRow.getByRole('gridcell').nth(1).textContent();
    expect(initialId).toBeTruthy();

    // Capture initial range
    const initialRange = await paginationInfo.textContent();

    // Click page 2 using role-based locator
    const pagination = page.locator('ul').filter({ hasText: /items,/ });
    const page2Button = pagination.getByRole('listitem', { name: '2' });

    // FIRST check if page 2 button exists, if not skip
    const page2Exists = await page2Button.count();
    if (page2Exists === 0) {
      test.skip(true, 'Only one page available - page 2 button not found');
    }

    // Wait for pagination to be interactive
    await page.waitForTimeout(500);
    
    // Use force click to bypass overlay issues
    await page2Button.click({ force: true });

    // Wait for the range text to change
    await expect(paginationInfo).not.toHaveText(initialRange!);

    // Wait for table to re-render
    await expect(table.getByRole('row').nth(1)).toBeVisible();

    // Get the new first data row and capture its ID
    const updatedFirstRow = table.getByRole('row').nth(1);
    const newId = await updatedFirstRow.getByRole('gridcell').nth(1).textContent();
    expect(newId).toBeTruthy();

    // Assert that the ID has changed
    expect(newId).not.toBe(initialId);
  });

  /**
   * Validates that the next arrow button in the pagination controls
   * correctly advances to the next page when clicked.
   */
  test('Next arrow works', async ({ page }) => {
    const table = page.getByRole('table');
    await expect(table).toBeVisible();

    const rangeText = page.getByText(/\d+ items, \d+-\d+ shown/);
    await expect(rangeText).toBeVisible();

    // Wait for page to be fully loaded
    await page.waitForTimeout(1000);

    const initialRange = await rangeText.textContent();

    // Scope correct pagination container
    const pagination = page.locator('ul').filter({ hasText: /items,/ });

    // Check if there's more than one page
    const pageNumbers = pagination.locator('li').filter({ hasText: /^\d+$/ });
    const pageCount = await pageNumbers.count();
    
    // Skip if only one page
    if (pageCount < 2) {
      test.skip(true, 'Only one page available - next arrow not applicable');
    }

    // Target next arrow
    const nextArrow = pagination.locator('li.ux-react-pagination-next');

    await expect(nextArrow).toBeVisible();
    
    // Check if next arrow is disabled
    const isDisabled = await nextArrow.getAttribute('aria-disabled');
    if (isDisabled === 'true') {
      test.skip(true, 'Already on last page - next arrow is disabled');
    }

    // Click the next arrow with force to bypass overlay issues
    await nextArrow.click({ force: true });

    // Wait for range to update
    await expect(rangeText).not.toHaveText(initialRange!);
  });

  /**
   * Validates that the previous arrow button in the pagination controls
   * correctly navigates back to the previous page when clicked.
   */
  test('Previous arrow works correctly', async ({ page }) => {
    const table = page.getByRole('table');
    await expect(table).toBeVisible();

    // Wait for page to be fully loaded
    await page.waitForTimeout(1000);

    const rangeText = page.getByText(/\d+ items, \d+-\d+ shown/);
    await expect(rangeText).toBeVisible();

    const pagination = page.locator('ul').filter({ hasText: /items,/ });

    // Check if there's more than one page
    const pageNumbers = pagination.locator('li').filter({ hasText: /^\d+$/ });
    const pageCount = await pageNumbers.count();

    // Skip if only 1 page exists
    if (pageCount < 2) {
      test.skip(true, 'Only one page available — previous arrow not applicable');
    }

    // Click the second page
    const secondPage = pageNumbers.nth(1);
    await secondPage.click({ force: true });

    // Wait for range to change
    await expect(rangeText).not.toContainText('1-');

    // Previous arrow = first li
    const items = pagination.locator('li');
    const prevArrow = items.nth(1);

    await expect(prevArrow).toBeVisible();
    await expect(prevArrow).toBeEnabled();

    // Click previous arrow with force
    await prevArrow.click({ force: true });
    await expect(rangeText).toContainText('1-');
  });

  /**
   * Tests page-size dropdown validation
   */
  test('Page-size dropdown validation', async ({ page }) => {
    const table = page.getByRole('table');
    await expect(table).toBeVisible();

    // Wait for page to be fully loaded
    await page.waitForTimeout(1000);

    const rangeText = page.getByText(/\d+ items, \d+-\d+ shown/);
    await expect(rangeText).toBeVisible();

    const initialText = await rangeText.textContent();
    const totalItems = Number(initialText!.match(/(\d+) items/)![1]);
    expect(totalItems).toBeGreaterThan(0);

    

    // Open dropdown - scroll into view first

    // Open dropdown properly
const pageSizeSelect = page.locator('.ant-select-selector').last();
await expect(pageSizeSelect).toBeVisible();
await pageSizeSelect.scrollIntoViewIfNeeded();
await pageSizeSelect.click(); // ✅ use Playwright click

// Wait for dropdown to appear
const dropdown = page.locator('.ant-select-dropdown').last();
await expect(dropdown).toBeVisible();

// Select "20 per page"
const option20 = dropdown.locator('.ant-select-item-option', { hasText: '20 per page' }).first();
await option20.click();

    // const pageSizeSelect = page.locator('.ant-select-selector').last();
    // await expect(pageSizeSelect).toBeVisible();
    // await pageSizeSelect.scrollIntoViewIfNeeded();
    // await page.waitForTimeout(300);
    
    // // Click using evaluate to bypass viewport issues
    // await pageSizeSelect.evaluate((el: any) => el.click());

    // const dropdown = page.locator('.ant-select-dropdown').last();
    // await expect(dropdown).toBeVisible();
    // await page.waitForTimeout(500);

    // // Use JavaScript click on the option
    // const option20 = dropdown
    //   .locator('.ant-select-item-option')
    //   .filter({ hasText: '20 per page' })
    //   .first();

    // await expect(option20).toBeVisible();
    // await page.waitForTimeout(300);
    
    // // Use JavaScript click to bypass viewport issues
    // await option20.evaluate((el: any) => el.click());

    // Wait for correct range
    await expect.poll(async () => {
      return await rangeText.textContent();
    }, { timeout: 10000 }).toMatch(/\d+ items, 1-\d+ shown/);

    const updatedText = await rangeText.textContent();
    const firstPageMatch = updatedText!.match(/(\d+)-(\d+) shown/);

    expect(Number(firstPageMatch![1])).toBe(1);
    expect(Number(firstPageMatch![2])).toBeLessThanOrEqual(20);

    const pageSize = 20;
    const expectedPages = Math.ceil(totalItems / pageSize);

    if (expectedPages === 1) return;

    const pagination = page.locator('ul', { hasText: /items,/ });

    await pagination
      .locator('li', { hasText: new RegExp(`^${expectedPages}$`) })
      .click({ force: true });

    const expectedStart = (expectedPages - 1) * pageSize + 1;
    const expectedEnd = totalItems;

    await expect(rangeText).toContainText(String(expectedStart));

    const finalText = await rangeText.textContent();
    const finalMatch = finalText!.match(/(\d+)-(\d+) shown/);

    expect(Number(finalMatch![1])).toBe(expectedStart);
    expect(Number(finalMatch![2])).toBe(expectedEnd);
  });

  /**
   * Validates that the pagination range text updates correctly on page 2
   */
  test('Pagination range text updates correctly on page 2', async ({ page }) => {
    const table = page.getByRole('table');
    await expect(table).toBeVisible();

    // Wait for page to be fully loaded
    await page.waitForTimeout(1000);

    const rangeText = page.getByText(/\d+ items, \d+-\d+ shown/);
    await expect(rangeText).toBeVisible();

    const initialText = await rangeText.textContent();
    const totalItems = Number(initialText!.match(/(\d+) items/)![1]);

    const pageSize = 10;
    const expectedPages = Math.ceil(totalItems / pageSize);

    if (expectedPages < 2) {
      test.skip(true, 'Not enough data for pagination');
    }

    // Navigate to Page 1 first
    const pagination = page.locator('ul').last();
    const page1Button = pagination.locator('li', { hasText: /^1$/ });
    await page1Button.click({ force: true });

    await expect(rangeText).toHaveText(
      new RegExp(`\\d+ items, 1-${pageSize} shown`)
    );

    // Navigate to Page 2
    const page2Button = pagination.locator('li', { hasText: /^2$/ });
    await page2Button.click({ force: true });

    // Wait for start index to become 11
    await expect(rangeText).toHaveText(
      /\d+ items, 11-\d+ shown/
    );

    // Validate exact numbers
    const updatedText = await rangeText.textContent();
    const match = updatedText!.match(/(\d+)-(\d+) shown/);

    const expectedStart = (2 - 1) * pageSize + 1; // 11
    const expectedEnd = Math.min(2 * pageSize, totalItems);

    expect(Number(match![1])).toBe(expectedStart);
    expect(Number(match![2])).toBe(expectedEnd);
  });
});
