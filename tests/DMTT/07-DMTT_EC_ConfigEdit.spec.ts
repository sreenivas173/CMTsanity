import { test, expect } from '@playwright/test';

import { DMTT_LoginPage } from '../../pages/DMTT_LoginPage';
import { DMTTEnvironmentPage } from '../../pages/DMTTEnvironmentPage';
import { DMTTEnvironmentSearchPaginationPage } from '../../pages/DMTTEnvironmentSearchPaginationPage';

/**
 * DMTT Environment Configuration - Edit (sanity).
 *
 * What it validates:
 * - Search for “sanity” configs.
 * - Open the first config details.
 * - Click Edit and update configuration name + tenant admin credentials.
 * - Save and verify:
 *   - success/toast OR updated dialog state is handled
 *   - edited name is visible on the details page.
 *
 * Notes/assumptions:
 * - Tenant admin username/password inputs are updated along with config name.
 * - Dialog close or success toast are used as the completion signal.
 */

test.describe('@DMTTsanity DMTT Configuration Edit', () => {
  test('Edit first sanity configuration name', async ({ page }, testInfo) => {
    const login = new DMTT_LoginPage(page);
    const envNav = new DMTTEnvironmentPage(page);
    const list = new DMTTEnvironmentSearchPaginationPage(page);

    await login.goto();
    await login.login(process.env.DMTT_USERNAME!, process.env.DMTT_PASSWORD!);

    await envNav.navigate();
    await list.waitForPageReady();

    let searchTerm = 'sanity';

    await list.search(searchTerm);

    if (!(await list.hasResults())) {

      console.log('"sanity" not found. Trying "swathi"...');

      searchTerm = 'swathi';

      await list.search(searchTerm);

      if (!(await list.hasResults())) {

        test.skip(
          true,
          'No sanity or swathi configurations found'
        );

      }
    }

    // Step 2: Click first config link
    const firstConfigLink = page
      .getByRole('link')
      .filter({
        hasText: new RegExp(searchTerm, 'i')
      })
      .first();

    await expect(firstConfigLink).toBeVisible({ timeout: 30000 });
    await firstConfigLink.click();

    // Wait until details page is fully loaded enough to access actions.
    await expect(
      page.getByRole('button', { name: /create\s+snapshot/i }).first()
    ).toBeVisible({ timeout: 30000 }).catch(() => null);

    const editedName = `Edited_Config_${new Date().toISOString().replace(/[:.]/g, '-')}`;

    // Skip test if any snapshot is still in progress
    const inProgressCount =
      await page
        .getByText('In Progress')
        .count();

    if (inProgressCount > 0) {

      test.skip(
        true,
        'Configuration currently has snapshot in progress'
      );

    }


    // Click Exact/Edit button from details page
    const editButton = page.getByRole(
      'button',
      { name: /^Edit$/i }
    );

    await expect(editButton).toBeVisible({
      timeout: 30000
    });

    await expect.poll(
      async () => {
        return await editButton.isEnabled();
      },
      {
        timeout: 300000,
        intervals: [5000]
      }
    ).toBe(true);

    await editButton.click();

    // Popup/dialog should appear
    const dialog = page
      .locator('[role="dialog"], .ux-react-popup__wrapper')
      .first();

    await expect(dialog).toBeVisible({ timeout: 30000 });

    // Replace existing config name with editedName
    const configNameInput = dialog
      .getByRole('textbox', { name: /configuration name/i })
      .or(dialog.getByPlaceholder(/configuration name/i))
      .or(dialog.locator('input[type="text"], input:not([type])').first());

    await expect(configNameInput).toBeVisible({ timeout: 30000 });

    // Ensure we overwrite, not append
    await configNameInput.fill(editedName);

    // Also modify Tenant Admin Username + Password
    const tenantUserInput = dialog
      .getByRole('textbox', { name: /tenant admin username/i })
      .or(dialog.getByPlaceholder(/tenant admin username/i))
      .first();

    const tenantPasswordInput = dialog
      .getByRole('textbox', { name: /tenant admin password/i })
      .or(dialog.locator('input[type="password"]'))
      .first();


    const tenantUsername = 'cpq@netcracker.com';
    const tenantPassword = 'MARket1234!';

    await expect(tenantUserInput).toBeVisible({ timeout: 30000 });
    await tenantUserInput.fill(tenantUsername);

    await expect(tenantPasswordInput).toBeVisible({ timeout: 30000 });
    await tenantPasswordInput.fill(tenantPassword);

    // Click Save
    const saveButton = dialog
      .getByRole('button', { name: /^Save$/i })
      .or(dialog.getByRole('button', { name: /save/i }).first());

    await expect(saveButton).toBeVisible({ timeout: 30000 });
    await expect(saveButton).toBeEnabled();

    await saveButton.click();

    const spinner = dialog.getByRole('button', {
      name: /loading icon/i
    });
    console.log(
      'Spinner visible:',
      await spinner.isVisible()
    );

    console.log(
      'Spinner class:',
      await spinner.getAttribute('class')
    );

    console.log(
      'Current URL:',
      page.url()
    );

    await expect(spinner).toBeHidden({
      timeout: 60000
    });

    await expect(dialog).toBeHidden({
      timeout: 60000
    });

    // Wait for save/update to complete (toast/alert or dialog close)
    await expect
      .poll(async () => {
        const stillOpen = await dialog.isVisible().catch(() => false);
        if (!stillOpen) return true;

        const toast = page
          .locator('[role="alert"], .pf-m-success, .pf-v5-c-alert--success')
          .filter({ hasText: /success|updated|saved|configuration/i })
          .first();
        return (await toast.isVisible().catch(() => false)) === true;
      })
      .toBe(true);

    // Ensure the updated name is visible on the details page
    await expect(page.getByText(editedName, { exact: true }).first()).toBeVisible({ timeout: 60000 });


    // Optional artifact for trace/debug
    if (process.env.CI) {
      await page.screenshot({
        path: `test-results/${testInfo.title.replace(/[^a-zA-Z0-9]/g, '_')}.png`,
        fullPage: true,
      });
    }
  });
});

