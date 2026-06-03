import { test } from '@playwright/test';

import {
DMTT_LoginPage
}
from '../../pages/DMTT_LoginPage';

import { DMTTEnvironmentPage } from '../../pages/DMTTEnvironmentPage';

import { DMTTCreateConfigPage } from '../../pages/DMTTCreateConfigPage';

test( '@DMTTsanity DMTT Create Configuration',
  async ({ page }) => {
    const login = new DMTT_LoginPage(page);
    const envPage = new DMTTEnvironmentPage(page);
    const createPage = new DMTTCreateConfigPage(page);

    await login.goto();

   await login.login(process.env.DMTT_USERNAME!,
  process.env.DMTT_PASSWORD!);

    await envPage.navigate();

    await createPage.openCreatePopup();

    await createPage.createConfiguration({
      configName: `Srini_${Date.now()}`,
      cloud: 'etbss',
      namespace: 'env-2-bss',
      source: 'BSS Runtime Catalog',
      username: 'cpq@netcracker.com',
      password: 'MARket1234!',
      dns: 'cpq',
    });

    await createPage.verifySuccess();
  }
);
