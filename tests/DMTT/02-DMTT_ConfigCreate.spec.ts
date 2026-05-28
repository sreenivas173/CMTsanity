import { test } from '@playwright/test';

import {
DMTT_LoginPage
}
from '../../pages/DMTT_LoginPage';

import { DMTTEnvironmentPage } from '../../pages/DMTTEnvironmentPage';

import { DMTTCreateConfigPage } from '../../pages/DMTTCreateConfigPage';

test(
  'DMTT Create Configuration',
  async ({ page }) => {
    const login = new DMTT_LoginPage(page);
    const envPage = new DMTTEnvironmentPage(page);
    const createPage = new DMTTCreateConfigPage(page);

    await login.goto();

    await login.login(
      'cpq-admin@netcracker.com',
      'MARket1234!'
    );

    await envPage.navigate();

    await createPage.openCreatePopup();

    await createPage.createConfiguration({
      configName: `Srini_${Date.now()}`,
      cloud: 'etbss',
      namespace: 'env-1-bss',
      source: 'Api Hub',
      username: 'cpq-admin@netcracker.com',
      password: 'MARket1234!',
      dns: 'cpq',
    });

    await createPage.verifySuccess();
  }
);
