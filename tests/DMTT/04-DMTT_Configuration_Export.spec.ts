import { test, expect } from '@playwright/test';
import { DMTT_LoginPage } from '../../pages/DMTT_LoginPage';
import { DMTTEnvironmentPage } from '../../pages/DMTTEnvironmentPage';
import { DMTTEnvironmentSearchPaginationPage } from '../../pages/DMTTEnvironmentSearchPaginationPage';

/**
 * DMTT Configuration Export (sanity).
 *
 * What it validates:
 * - From the Environment configuration list, search for “sanity” configs.
 * - Open the first matching configuration details.
 * - Trigger configuration export and verify the downloaded artifact is JSON.
 *
 * Notes/assumptions:
 * - Assumes the details page provides an “Export” button with a stable accessible name.
 * - Uses download.suggestedFilename() to confirm the exported format (.json).
 * - Download save path is written to test-results/.
 */
test.describe('@DMTTsanity DMTT Configuration Export', () => {

  test('Export first sanity configuration',
    async ({ page }, testInfo) => {

      const login = new DMTT_LoginPage(page);
      const envNav = new DMTTEnvironmentPage(page);
      const list = new DMTTEnvironmentSearchPaginationPage(page);


      await login.goto();

      await login.login(
        process.env.DMTT_USERNAME!,
        process.env.DMTT_PASSWORD!
      );

      await envNav.navigate();

      await list.waitForPageReady();

      await list.search('sanity');

      // Wait until search results are loaded
      await expect(
        page.getByRole('link').first()
      ).toBeVisible({
        timeout: 30000
      });

      // Click first configuration returned by search
      const firstConfigLink = page
        .getByRole('link')
        .filter({ hasText: /sanity/i })
        .first();

      await firstConfigLink.click();

      // Wait until details page is fully loaded
      await expect(
        page.getByRole('button', {
          name: /Create Snapshot/i
        })
      ).toBeVisible({
        timeout: 30000
      });

      // Exact Export button from details page
      const exportButton = page.getByRole(
        'button',
        {
          name: /^Export$/i
        }
      );

      await expect(exportButton).toBeVisible({
        timeout: 30000
      });

      await expect(exportButton).toBeEnabled();

      // Start download listener BEFORE click
      const downloadPromise = page.waitForEvent(
        'download',
        {
          timeout: 60000
        }
      );

      await exportButton.click();

      const download = await downloadPromise;

      const suggested =
        download.suggestedFilename();

      expect(
        suggested,
        'Expected exported file to have .json extension'
      ).toMatch(/\.json$/i);

      const fileName = testInfo.title
        .replace(/[^a-zA-Z0-9]/g, '_')
        .concat('_')
        .concat(suggested);

      const savePath =
        `test-results/${fileName}`;

      await download.saveAs(savePath);

      //const suggested = download.suggestedFilename();

      console.log('Downloaded file name:', suggested);

      await download.saveAs(savePath);

      console.log('Saved to:', savePath);
      expect(savePath).toMatch(/\.json$/i);
    }
  );
});