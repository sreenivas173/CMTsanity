import { test } from '@playwright/test';

import { DMTT_LoginPage } from '../../pages/DMTT_LoginPage';
import { DMTTEnvironmentPage } from '../../pages/DMTTEnvironmentPage';
import { DMTTCreateConfigPage } from '../../pages/DMTTCreateConfigPage';

/**
 * DMTT Config Create (sanity).
 *
 * What it validates:
 * - Users can create a new DMTT configuration from the Environment UI.
 * - The create flow completes successfully (asserted via page object verifySuccess()).
 *
 * Assumptions / data:
 * - Uses environment credentials from process.env.DMTT_USERNAME/DMTT_PASSWORD.
 * - Uses a unique configName based on current timestamp to avoid name collisions.
 * - Uses fixed sample values for cloud/namespace/source/admin credentials as required by the test environment.
 */


test('@DMTTsanity DMTT Create Configuration', async ({ page }) => {
  const login = new DMTT_LoginPage(page);
  const envPage = new DMTTEnvironmentPage(page);
  const createPage = new DMTTCreateConfigPage(page);

  // 1) Navigate to login + authenticate
  await login.goto();
  await login.login(process.env.DMTT_USERNAME!, process.env.DMTT_PASSWORD!);

  // 2) Navigate to environment list/page
  await envPage.navigate();

  // 3) Open “Create Configuration” popup/dialog
  await createPage.openCreatePopup();

  // 4) Fill configuration fields and submit
  await createPage.createConfiguration({
    configName: `Srini_${Date.now()}`,
    cloud: 'etbss',
    namespace: 'env-2-bss',
    source: 'BSS Runtime Catalog',
    username: 'cpq@netcracker.com',
    password: 'MARket1234!',
    dns: 'cpq',
  });

  // 5) Verify create operation success
  await createPage.verifySuccess();
});

