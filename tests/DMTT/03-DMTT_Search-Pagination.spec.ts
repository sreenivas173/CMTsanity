import { test, expect } from '@playwright/test';

import { DMTT_LoginPage } from '../../pages/DMTT_LoginPage';
import { DMTTEnvironmentPage } from '../../pages/DMTTEnvironmentPage';
import { DMTTEnvironmentSearchPaginationPage } from '../../pages/DMTTEnvironmentSearchPaginationPage';

/**
 * DMTT Environment list search + pagination validations.
 *
 * Purpose:
 * - Verify that search for a keyword returns only configurations matching the expected
 *   dataset constraint (in these tests: “sanity” configs).
 * - Verify pagination behaves correctly (page 1 -> page 2) using pagination range start/end.
 *
 * Notes/assumptions:
 * - Uses fixed dataset keywords like "sanity" and "Swathi".
 * - Pagination page-2 might not exist in every environment/dataset; in that case
 *   the test skips page-2 assertions.
 */
test.describe('@DMTTsanity DMTT Search & Pagination validations', () => {
  /**
   * Verifies that searching for the keyword “sanity” shows only sanity configurations.
   */
  test('Search validation with "sanity" keyword', async ({ page }) => {
    const login = new DMTT_LoginPage(page);
    const envNav = new DMTTEnvironmentPage(page);
    const list = new DMTTEnvironmentSearchPaginationPage(page);

    // Login + navigate to environment configuration list
    await login.goto();
    await login.login('cpq-admin@netcracker.com', 'MARket1234!');
    await envNav.navigate();
    await list.waitForPageReady();

    // Apply search filter
    await list.search('sanity');

    // Assert the grid only shows sanity configs
    await list.assertOnlySanityConfigsDisplayed();
  });

  /**
   * Verifies pagination correctness for an environment search.
   *
   * We validate pagination using:
   * - getPaginationRange() start/end values on page 1
   * - waiting for page-range change after switching to page 2
   * - verifying the next page start is immediately after previous end
   */
  test('Env config Pagination validation', async ({ page }) => {
    const login = new DMTT_LoginPage(page);
    const envNav = new DMTTEnvironmentPage(page);
    const list = new DMTTEnvironmentSearchPaginationPage(page);

    // Login + navigate to environment configuration list
    await login.goto();
    await login.login(process.env.DMTT_USERNAME!, process.env.DMTT_PASSWORD!);
    await envNav.navigate();
    await list.waitForPageReady();

    // Apply a keyword that yields sanity-only results in the current dataset
    await list.search('Swathi');
    await list.assertOnlySanityConfigsDisplayed();

    // Capture page 1 pagination range and visible config list
    const page1Range = await list.getPaginationRange();
    const page1Names = await list.getVisibleConfigNames();

    // Some datasets may not have enough items to render page 2.
    const page2Available = await list.isPage2Available();
    if (!page2Available) {
      test.skip(true, 'Skipping page-2 validation: page 2 not available in dataset');
    }

    // Navigate to page 2
    await list.goToPage2();

    // Validate pagination range movement (start/end)
    if (page1Range) {
      await list.waitForPaginationRangeToChange(page1Range.start, page1Range.end);
      const page2Range = await list.getPaginationRange();
      expect(page2Range, 'Expected pagination range on page 2').not.toBeNull();

      expect(page2Range!.start).toBeGreaterThan(page1Range.start);

      // Common pagination behavior: page 2 starts right after page 1 ends.
      expect(page2Range!.start).toBe(page1Range.end + 1);
    }

    // Validate sanity-only constraint persists on page 2
    const page2Names = await list.getVisibleConfigNames();
    await list.assertOnlySanityConfigsDisplayed();

    // Verify we still have results on page 2.
    expect(page2Names.length).toBeGreaterThan(0);

    // Pagination correctness is validated by pagination range change.
    // Visible row content may remain identical across builds/datasets,
    // so we do not assert content differences here.
  });
});


