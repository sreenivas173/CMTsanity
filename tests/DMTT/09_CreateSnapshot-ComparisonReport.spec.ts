import { test, expect } from '@playwright/test';

import { DMTT_LoginPage } from '../../pages/DMTT_LoginPage';
import { DMTTEnvironmentPage } from '../../pages/DMTTEnvironmentPage';
import { DMTTEnvironmentSearchPaginationPage } from '../../pages/DMTTEnvironmentSearchPaginationPage';
import { DMTTEnvironmentConfigValidatePage } from '../../pages/DMTTEnvironmentConfigValidatePage';

/**
 * DMTT Environment - Create Comparison Report from Snapshot (sanity).
 *
 * Required flow (as provided):
 * 1) Search with "sanity"
 * 2) Click first config link
 * 3) Check snapshot exist or not
 * 4) If snapshot count > 0 -> click first snapshot
 * 5) If snapshot count == 0 -> click "Create snapshot" and wait until completed, then click first snapshot
 * 6) Click "Create Comparison Report" (popup window opens to pick a snapshot)
 * 7) Click "pick a snapshot" (opens dropdown)
 * 8) Select first snapshot name
 * 9) Ensure Create button is enabled and click Create
 * 10) Ensure success notification OR snapshot comparison report items count increment is PASS
 */

test.describe(' Env Snapshot - Comparison Report', () => {
  test('Create Comparison Report from first snapshot (create snapshot if needed)', async ({ page }, testInfo) => {
    const login = new DMTT_LoginPage(page);
    const envNav = new DMTTEnvironmentPage(page);
    const list = new DMTTEnvironmentSearchPaginationPage(page);
    const validatePage = new DMTTEnvironmentConfigValidatePage(page);

    await login.goto();
    await login.login(process.env.DMTT_USERNAME!, process.env.DMTT_PASSWORD!);

    await envNav.navigate();
    await list.waitForPageReady();

    await list.search('sanity');

    // Click first config returned by search.
    const firstConfigLink = page
      .getByRole('link')
      .filter({ hasText: /sanity/i })
      .first();

    await expect(firstConfigLink).toBeVisible({ timeout: 30000 });
    await firstConfigLink.click();

    // Wait for details page.
    await page.waitForTimeout(1500);

    const extractFirstSnapshotCount = async (): Promise<number | null> => {
      // Multiple possible UI implementations:
      // - a text containing "X items"
      // - a table header like "Snapshots (X)"
      // - somewhere in body text
      const bodyTxt = await page.locator('body').innerText();
      const match = bodyTxt.match(/(\d+)\s+(?:items?|snapshots?)/i);
      if (match?.[1]) return Number(match[1]);

      const match2 = bodyTxt.match(/snapshots?\s*[:(\[]\s*(\d+)/i);
      if (match2?.[1]) return Number(match2[1]);

      // If nothing parseable, return null (caller can still attempt interactions).
      return null;
    };

    const clickFirstSnapshotInList = async (): Promise<void> => {
      // Snapshot list item may be:
      // - a row/accordion header with accessible name
      // - a button labeled snapshot name
      // - a link in a grid
      // Best-effort: click first element that contains "snapshot" near snapshot section.

      // Prefer a dedicated snapshot list container.
      const snapshotSection = page
        .locator('section, [role="region"], [role="tabpanel"], div')
        .filter({ hasText: /snapshot/i })
        .first();

      // Candidate clickable entries.
      const candidate = snapshotSection
        .locator('[role="row"], [role="listitem"], a, button')
        .filter({ hasText: /snapshot/i })
        .first();

      if (await candidate.isVisible().catch(() => false)) {
        await candidate.click({ force: true });
        return;
      }

      // Fallback: search for any "snapshot" link/button globally.
      const globalCandidate = page
        .getByRole('button')
        .filter({ hasText: /snapshot/i })
        .first()
        .or(page.getByRole('link').filter({ hasText: /snapshot/i }).first())
        .first();

      await expect(globalCandidate).toBeVisible({ timeout: 30000 });
      await globalCandidate.click({ force: true });
    };

    const createSnapshotIfNeeded = async (snapshotCount: number | null): Promise<void> => {
      if (snapshotCount !== 0) return;

      const createSnapshotAction = page
        .getByRole('button', { name: /create\s+snapshot/i })
        .or(page.getByText(/create\s+snapshot/i).first());

      await expect(createSnapshotAction.first()).toBeVisible({ timeout: 30000 });
      await createSnapshotAction.first().click({ force: true });

      // Wait for operation completion.
      await expect
        .poll(async () => {
          const bodyTxt = (await page.locator('body').innerText()).toLowerCase();
          return bodyTxt.includes('completed') || bodyTxt.includes('complete');
        }, { timeout: 180000, message: 'Timed out waiting for snapshot creation completion.' })
        .toBeTruthy();

      await page.waitForTimeout(2000);
    };

    // Step 4: check snapshot exist or not.
    const snapshotCount = await extractFirstSnapshotCount();

    // Step 11 behavior: if snapshot count == 0, create snapshot then continue.
    await createSnapshotIfNeeded(snapshotCount);

    // If snapshotCount was null, still attempt to click first snapshot.
    // If it was 0, after creation we should have snapshots; click first.
    await clickFirstSnapshotInList();

    // Capture baseline comparison report items count (if present).
    const extractComparisonItemsCount = async (): Promise<number | null> => {
      const bodyTxt = await page.locator('body').innerText();

      // Common patterns: "X items", "items: X", etc.
      const m1 = bodyTxt.match(/(\d+)\s+items?/i);
      if (m1?.[1] && /comparison|report/i.test(bodyTxt)) {
        return Number(m1[1]);
      }

      const m2 = bodyTxt.match(/comparison\s+report[^\d]*(\d+)/i);
      if (m2?.[1]) return Number(m2[1]);

      return null;
    };

    const beforeComparisonCount = await extractComparisonItemsCount();

    // Step 6: click 'Create Comparison Report' a popup window opens to 'pick a snapshot'
    // Based on current UI snapshot, action is likely inside the selected snapshot row
    // via the "Comparison Reports" column.

    // Step 6: open comparison report creation.
    // Based on page snapshot, the action is most likely in the snapshots table row
    // under the "Comparison Reports" column.

    // In current UI, snapshot row shows a "Comparison Reports" column.
    // The per-snapshot action is usually a button under that column (could be icon-only).
    // So locate the snapshot table row and click the first control within it that looks like an action.

    // Locate first snapshot row and click the per-row action under "Comparison Reports".
    const snapshotTableRow = page
      .locator('table tbody tr, [role="row"][aria-rowindex]')
      .filter({ has: page.getByRole('link').filter({ hasText: /\d{4}-\d{2}-\d{2}/ }).first() })
      .first();

    // Prefer text-based "Create Comparison Report" if present.
    const explicitCreate = snapshotTableRow
      .locator('button, [role="button"], a')
      .filter({ hasText: /create\s+comparison\s+report|comparison\s+report/i })
      .first();

    if (await explicitCreate.isVisible().catch(() => false)) {
      await explicitCreate.click({ force: true });
    } else {
      // Icon-only: try clicking within the "Comparison Reports" column cell.
      const comparisonReportsCell = snapshotTableRow
        .locator('td, [role="cell"]')
        .filter({ hasText: /comparison reports/i })
        .first();

      const actionInCell = comparisonReportsCell
        .locator('button, [role="button"], a')
        .first();

      if (await actionInCell.isVisible().catch(() => false)) {
        await actionInCell.click({ force: true });
      } else {
        // Last resort: click the first actionable control in the snapshot row.
        await snapshotTableRow
          .locator('button, [role="button"], a')
          .first()
          .click({ force: true })
          .catch(() => null);
      }
    }

    const dialog = page.locator('[role="dialog"], .ux-react-popup__wrapper, .modal').first();
    const pickSnapshotText = page.getByText(/pick a snapshot/i).first();

    await expect(dialog).toBeVisible({ timeout: 60000 });
    await expect(pickSnapshotText).toBeVisible({ timeout: 60000 });

    // Step 7: click on the 'pcik a snapshot' (typo in instructions; implement as pick snapshot control)
    const pickSnapshotControl = dialog
      .getByRole('combobox', { name: /pick a snapshot|snapshot/i })
      .or(dialog.getByRole('button', { name: /pick a snapshot|snapshot/i }))
      .or(dialog.getByText(/pick a snapshot/i).first());

    await expect(pickSnapshotControl.first()).toBeVisible({ timeout: 30000 });
    await pickSnapshotControl.first().click({ force: true });

    // Step 8: dropdown select first snapshot name
    // Look for first option in the open dropdown.
    const firstSnapshotOption = page
      .getByRole('option')
      .first();

    await expect(firstSnapshotOption).toBeVisible({ timeout: 30000 });
    await firstSnapshotOption.click({ force: true });

    // Step 9: ensure Create button enabled and click Create button
    const createButton = dialog
      .getByRole('button', { name: /^create$/i })
      .or(dialog.getByRole('button', { name: /create/i }))
      .first();

    await expect(createButton).toBeVisible({ timeout: 30000 });
    await expect(createButton).toBeEnabled({ timeout: 30000 });

    await createButton.click({ force: true });

    // Step 10: ensure success notification OR increment in snapshot comparison report items count is Pass.
    const successToast = page
      .locator('[role="alert"], .pf-m-success, .pf-v5-c-alert--success')
      .filter({ hasText: /success|created|comparison|report/i })
      .first();

    const comparisonCountIncreased = async () => {
      if (beforeComparisonCount === null) return false;

      return await expect
        .poll(async () => {
          const after = await extractComparisonItemsCount();
          return after !== null && after > beforeComparisonCount;
        }, { timeout: 120000 })
        .toBeTruthy()
        .then(() => true)
        .catch(() => false);
    };

    const passed = await (async () => {
      // Prefer toast assertion.
      try {
        await expect(successToast).toBeVisible({ timeout: 60000 });
        return true;
      } catch {
        // Fallback to count increment.
        return comparisonCountIncreased();
      }
    })();

    expect(passed).toBe(true);

    if (process?.env?.CI) {
      await page.screenshot({
        path: `test-results/${testInfo.title.replace(/[^a-zA-Z0-9]/g, '_')}.png`,
        fullPage: true,
      });
    }
  });
});

