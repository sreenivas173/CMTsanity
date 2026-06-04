import { test } from '@playwright/test';

import { DMTT_LoginPage } from '../../pages/DMTT_LoginPage';
import { DMTTEnvironmentPage } from '../../pages/DMTTEnvironmentPage';
import { DMTTEnvironmentSearchPaginationPage } from '../../pages/DMTTEnvironmentSearchPaginationPage';
import { DMTTEnvironmentConfigValidatePage } from '../../pages/DMTTEnvironmentConfigValidatePage';

test.describe('DMTT Environment Configuration - Validate Environment', () => {
  test('@DMTTsanity Validate Environment from first sanity config', async ({ page }, testInfo) => {
    const login = new DMTT_LoginPage(page);
    const envNav = new DMTTEnvironmentPage(page);
    const list = new DMTTEnvironmentSearchPaginationPage(page);
    const validatePage = new DMTTEnvironmentConfigValidatePage(page);

    await login.goto();
    await login.login(process.env.DMTT_USERNAME!, process.env.DMTT_PASSWORD!);

    await envNav.navigate();
    await list.waitForPageReady();

    await list.search('sanity');

    // After search, each config row has a vertical-3-dots menu.
    // Click the menu for the first config and choose "Validate Environment".
    await validatePage.openValidateEnvironmentFromFirstConfigRow();

    // Validate environment and assert success toast/message
    await validatePage.validateEnvironment();
    await validatePage.expectValidationSuccess();

    // Optional artifact for trace/debug
    if (process.env.CI) {
      await page.screenshot({
        path: `test-results/${testInfo.title.replace(/[^a-zA-Z0-9]/g, '_')}.png`
      });
    }
  });
});

