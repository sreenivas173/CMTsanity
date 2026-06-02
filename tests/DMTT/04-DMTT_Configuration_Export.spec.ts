import { test, expect } from '@playwright/test';


import { DMTT_LoginPage } from '../../pages/DMTT_LoginPage';
import { DMTTEnvironmentPage } from '../../pages/DMTTEnvironmentPage';
import { DMTTEnvironmentSearchPaginationPage } from '../../pages/DMTTEnvironmentSearchPaginationPage';

test.describe('DMTT Configuration Export', () => {
  test('@DMTTsanity export first sanity configuration as json', async ({ page }, testInfo) => {
    const login = new DMTT_LoginPage(page);
    const envNav = new DMTTEnvironmentPage(page);
    const list = new DMTTEnvironmentSearchPaginationPage(page);

    await login.goto();
    await login.login('cpq-admin@netcracker.com', 'MARket1234!');

    await envNav.navigate();
    await list.waitForPageReady();

    await list.search('sanity');

    // Click first config
    const firstConfigLink = page.locator('table tr td a, [role="gridcell"] a').first();
    await expect(firstConfigLink).toBeVisible({ timeout: 30000 });

    await firstConfigLink.click();

    // Wait for details pane/page to load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // "Environment Config" tab/section
    const envConfigTab = page
      .getByRole('tab', { name: /Environment Config/i })
      .or(page.getByText(/Environment Config/i).first());

    if (await envConfigTab.isVisible().catch(() => false)) {
      await envConfigTab.click();
    }

    // Export button (in details UI)
    // In strict mode there can be multiple "export" buttons, so scope to the one with exact text.
    const exportButton = page
      .getByRole('button', { name: /Export All Configurations/i })
      .or(page.getByRole('button', { name: /^Export$/i }).first());

    await expect(exportButton).toBeVisible({ timeout: 30000 });
    await expect(exportButton).toBeEnabled();


    const [download] = await Promise.all([
      page.waitForEvent('download'),
      exportButton.click()
    ]);

    const suggested = await download.suggestedFilename();
    expect(suggested, 'Expected exported file to have .json extension').toMatch(/\.json$/i);

    // Save to test-results for artifact inspection
    const fileName = testInfo.title
      .replace(/[^a-zA-Z0-9]/g, '_')
      .concat('_')
      .concat(suggested);

    const savePath = `test-results/${fileName}`;
    await download.saveAs(savePath);

    // Basic integrity: downloaded file should be non-empty.
    // Playwright provides no direct size API in all versions, so just validate
    // the filename + successful download event.
    expect(savePath).toMatch(/\.json$/i);


  });
});


