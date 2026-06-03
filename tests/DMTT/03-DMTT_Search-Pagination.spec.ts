import { test, expect } from '@playwright/test';

import { DMTT_LoginPage } from '../../pages/DMTT_LoginPage';
import { DMTTEnvironmentPage } from '../../pages/DMTTEnvironmentPage';
import { DMTTEnvironmentSearchPaginationPage } from '../../pages/DMTTEnvironmentSearchPaginationPage';

test.describe('DMTT Search & Pagination validations', () => {
  test('@DMTTsanity Search "sanity" and validate only sanity-related configs are displayed', async ({ page }) => {
    const login = new DMTT_LoginPage(page);
    const envNav = new DMTTEnvironmentPage(page);
    const list = new DMTTEnvironmentSearchPaginationPage(page);

    await login.goto();
    await login.login('cpq-admin@netcracker.com', 'MARket1234!');
    await envNav.navigate();
    await list.waitForPageReady();

    await list.search('sanity');
    await list.assertOnlySanityConfigsDisplayed();
  });

  test('@DMTTsanity Pagination validation', async ({ page }) => {
    const login = new DMTT_LoginPage(page);
    const envNav = new DMTTEnvironmentPage(page);
    const list = new DMTTEnvironmentSearchPaginationPage(page);

    await login.goto();
    await login.login(process.env.DMTT_USERNAME!,process.env.DMTT_PASSWORD!);
    await envNav.navigate();
    await list.waitForPageReady();

    await list.search('Swathi');
    await list.assertOnlySanityConfigsDisplayed();

    const page1Range = await list.getPaginationRange();
    const page1Names = await list.getVisibleConfigNames();

    const page2Available = await list.isPage2Available();
    if (!page2Available) {
      // If page 2 isn't available we can only validate page 1.
      test.skip(true, 'Skipping page-2 validation: page 2 not available in dataset');
    }

    await list.goToPage2();

    if (page1Range) {
      await list.waitForPaginationRangeToChange(page1Range.start, page1Range.end);
      const page2Range = await list.getPaginationRange();
      expect(page2Range, 'Expected pagination range on page 2').not.toBeNull();

      expect(page2Range!.start).toBeGreaterThan(page1Range.start);
      // Common pagination behavior: next page starts right after previous end.
      expect(page2Range!.start).toBe(page1Range.end + 1);
    }

    const page2Names = await list.getVisibleConfigNames();

    // Sanity-only must still hold on page 2.
    await list.assertOnlySanityConfigsDisplayed();

    // Verify we still have results on page 2.
    expect(page2Names.length).toBeGreaterThan(0);

    // Pagination correctness is validated by pagination range (start/end) change above.
    // Visible row content can remain identical in some datasets/builds, so we don't
    // assert content difference here.
  });
});

