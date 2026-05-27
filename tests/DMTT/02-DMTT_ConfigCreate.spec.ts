/**
 * DMTT Config Create validations
 * Flow:
 * 1) Login to DMTT
 * 2) Navigate to Environment Configurations
 * 3) Click "Create Configurations"
 * 4) Fill popup fields
 * 5) Click "Create"
 */

import { test, expect } from '@playwright/test';
import { DMTT_LoginPage } from '../../pages/DMTT_LoginPage';
import { MM_ConfigPage } from '../../pages/MM_ConfigPage';

const CREDS = {
  username: 'cpq-admin@netcracker.com',
  password: 'MARket1234!'
};

test.describe('DMTT Configuration Create', () => {
  test('should create configuration from Create Configurations popup', async ({ page }) => {
    test.setTimeout(180000);

    const loginPage = new DMTT_LoginPage(page);
    const mmConfigPage = new MM_ConfigPage(page);

    await loginPage.goto();
    await loginPage.login(CREDS.username, CREDS.password);

    // Confirm dashboard loaded (we reuse DMTT success validation logic)
    await expect.poll(async () => {
      const ok = await loginPage.isSuccessMessageVisible().catch(() => false);
      return ok;
    }, { timeout: 60000, intervals: [2000] }).toBe(true);

    // Navigate to configurations tab/page
    await mmConfigPage.navigateToMMConfig();

    // Click Create Configurations button and fill popup
    // UI button text/role can vary; also sometimes it is an icon button.
    // Try: role buttons -> generic search -> toolbar "Create".
    const createBtnCandidates = [
      page.getByRole('button', { name: /Create Configurations/i }),
      page.getByRole('button', { name: /Create Configuration/i }),
      page.getByRole('button', { name: /^Create$/i }),
      page.getByRole('button', { name: /Create/i }),
      page.locator('[role="button"]:has-text("Create")').first(),
      page.locator('button:has-text("Create")').first()
    ];

    let clicked = false;
    for (const cand of createBtnCandidates) {
      if (await cand.isVisible().catch(() => false)) {
        await cand.click();
        clicked = true;
        break;
      }
    }

    if (!clicked) {
      // Last resort: click on any visible toolbar item containing 'Create'
      const createText = page.locator('text=/Create\s+(Configurations|Configuration)?/i').first();
      if (await createText.isVisible({ timeout: 8000 }).catch(() => false)) {
        await createText.click();
        clicked = true;
      }
    }

    if (!clicked) {
      throw new Error('Create Configurations button not found (tried multiple selectors)');
    }



    // Popup inputs - use common locator patterns; these are intentionally tolerant.
    const cfgName = page.getByLabel(/Configuration Name/i).or(page.locator('[placeholder*="Configuration" i]'));
    const cloudName = page.getByLabel(/Cloud Name/i).or(page.locator('[placeholder*="Cloud" i]'));
    const namespace = page.getByLabel(/Namespace/i).or(page.locator('[placeholder*="Namespace" i]'));
    const sources = page.getByLabel(/Sources/i).or(page.locator('[placeholder*="Sources" i]'));
    const tenantUser = page.getByLabel(/Tenant admin username/i).or(page.getByLabel(/Tenant.*username/i));
    const tenantPassword = page.getByLabel(/password/i).or(page.locator('input[type="password"]'));
    const dnsName = page.getByLabel(/DNS Name/i).or(page.locator('[placeholder*="DNS" i]'));

    await cfgName.fill('Srini_Sanity_');
    await cloudName.fill('etbss');
    await namespace.fill('env-1-bss');
    await sources.fill('Api Hub');
    await tenantUser.fill(CREDS.username);
    await tenantPassword.fill(CREDS.password);
    await dnsName.fill('cpq');

    const popupCreate = page.getByRole('button', { name: /Create/i });
    await expect(popupCreate).toBeVisible({ timeout: 20000 });
    await popupCreate.click();

    // Validate success notification/toast
    await expect.poll(async () => {
      const successText = page.locator('text=/created|successfully|success/i').first();
      const toast = page.locator('.ant-notification-notice-success, .toast-success, [role="alert"]:has-text(success)');
      const visible = (await successText.isVisible().catch(() => false)) || (await toast.isVisible().catch(() => false));
      return visible;
    }, { timeout: 60000, intervals: [2000] }).toBe(true);
  });
});

