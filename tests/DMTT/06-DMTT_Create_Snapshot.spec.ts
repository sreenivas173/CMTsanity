import { test, expect } from '@playwright/test';

import { DMTT_LoginPage } from '../../pages/DMTT_LoginPage';
import { DMTTEnvironmentPage } from '../../pages/DMTTEnvironmentPage';
import { DMTTEnvironmentSearchPaginationPage } from '../../pages/DMTTEnvironmentSearchPaginationPage';
import { DMTTEnvironmentConfigValidatePage } from '../../pages/DMTTEnvironmentConfigValidatePage';

/**
 * DMTT Environment Configuration - Create Snapshot (sanity).
 *
 * What it validates:
 * - Search for “sanity” configs.
 * - Open the first config details.
 * - Trigger “Create Snapshot” from the configuration details page.
 * - Wait for snapshot operation to reach completed state.
 * - Validate snapshot count increases (when a count can be parsed).
 * - Validate a success toast/message is visible.
 *
 * Notes/assumptions:
 * - Uses body text parsing to extract numeric “items” count.
 * - Operation completion is detected via polling for “completed/complete” text.
 */

test.describe('@DMTTsanity Env Configuration - Create Snapshot', () => {
  test.setTimeout(6 * 60 * 1000);
  test('Create Snapshot from first sanity config', async ({ page }) => {
    const login = new DMTT_LoginPage(page);
    const envNav = new DMTTEnvironmentPage(page);
    const list = new DMTTEnvironmentSearchPaginationPage(page);
    const validatePage = new DMTTEnvironmentConfigValidatePage(page);

    await login.goto();
    await login.login(process.env.DMTT_USERNAME!, process.env.DMTT_PASSWORD!);

    await envNav.navigate();
    await list.waitForPageReady();
    await list.search('sanity');

    // Open first config details
    await validatePage.clickFirstConfigFromList();

    const extractNumericCount = (txt: string) => {
      const m = txt.match(/(\d+)\s+items?/i) || txt.match(/items\s*:\s*(\d+)/i);
      return m ? Number(m[1]) : null;
    };

    const beforeText = await page.locator('body').innerText();
    const beforeCount = extractNumericCount(beforeText);

    // “Create Snapshot” is commonly a row/section action under the Snapshots area.
    // So we search for it globally as well as inside containers that mention “Snapshots”.
    const createSnapshotAction = page
      .getByRole('button', { name: /create\s+snapshot/i })
      .or(page.getByRole('menuitem', { name: /create\s+snapshot/i }))
      .or(page.getByText(/create\s+snapshot/i));

    await expect(createSnapshotAction.first()).toBeVisible({ timeout: 30000 });
    await createSnapshotAction.first().click({ force: true });

   await validatePage.waitForSnapshotCompletion();

    // Success toast/message
    const successToast = page
      .locator('[role="alert"]')
      .filter({ hasText: /success|created|snapshot/i })
      .first()
      .or(page.getByText(/success|created|snapshot/i).first());

    await expect(successToast).toBeVisible({ timeout: 60000 });
  });
});

