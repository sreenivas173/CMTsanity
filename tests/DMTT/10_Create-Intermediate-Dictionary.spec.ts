import { test, expect } from '@playwright/test';

import { DMTT_LoginPage } from '../../pages/DMTT_LoginPage';
import { DMTTEnvironmentPage } from '../../pages/DMTTEnvironmentPage';
import { DMTTEnvironmentSearchPaginationPage } from '../../pages/DMTTEnvironmentSearchPaginationPage';
import { DMTTEnvironmentConfigValidatePage } from '../../pages/DMTTEnvironmentConfigValidatePage';

/**
 * DMTT Environment - Create Intermediate Dictionary (sanity).
 * Required flow (as provided):
 * 1) Search with "sanity"
 * 2) Click first config link
 * 3) Check snapshot exist or not
 * 4) If snapshot count > 0 -> click first snapshot
 * 5) If snapshot count == 0 -> click "Create snapshot" and wait until completed, then click first snapshot
 * 6) Find 'POC RTC Dictionaries' and click
 * 7) In the first search box type 'code'
 * 8) Click on the first source name link
 * 9) provide the dictionary name as 'Srini_intm_<date,time>'
 * 10) Click create button - status as draft
 * 11) Click on Persist button
 * 12) refresh the page and check the dictionary status 'Persist Success' to pass the test
 */

test.describe('@DMTTsanity Create Intermediate Dictionary (Persist Success)', () => {
  test.setTimeout(240000);

  test('Create Intermediate Dictionary from first snapshot (create snapshot if needed)', async ({ page }, testInfo) => {
    const login = new DMTT_LoginPage(page);
    const envNav = new DMTTEnvironmentPage(page);
    const list = new DMTTEnvironmentSearchPaginationPage(page);
    // validatePage is not used directly in this spec, but kept consistent with other DMTT tests
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const validatePage = new DMTTEnvironmentConfigValidatePage(page);

    await login.goto();
    const username = (globalThis as any)?.process?.env?.DMTT_USERNAME;
    const password = (globalThis as any)?.process?.env?.DMTT_PASSWORD;
    await login.login(username!, password!);

    await envNav.navigate();
    await list.waitForPageReady();

    await list.search('sanity');

    // Step 2: Click first config link
    const firstConfigLink = page
      .getByRole('link')
      .filter({ hasText: /sanity/i })
      .first();

    await expect(firstConfigLink).toBeVisible({ timeout: 30000 });
    await firstConfigLink.click();

    // Step 3/4/5: snapshot count logic + create snapshot if needed
    // Wait for snapshot section to appear (use “Snapshots” header OR “No snapshots”).
    await expect.poll(
      async () => {
        const body = await page.locator('body').innerText();
        return /snapshots/i.test(body) || /no snapshots/i.test(body);
      },
      { timeout: 30000, intervals: [1000] }
    ).toBe(true);

    const extractFirstSnapshotCount = async (): Promise<number> => {
      await page.waitForTimeout(1000);
      const bodyText = await page.locator('body').innerText();

      // Explicit empty state
      if (/no snapshots/i.test(bodyText)) return 0;

      // Common patterns like: "X items, Y-Z shown" near snapshot table
      const match = bodyText.match(/(\d+)\s+items,\s+\d+-\d+\s+shown/i);
      if (match?.[1]) return Number(match[1]);

      // Fallback: try to detect date-like snapshot links count (may be unreliable but safer than failing)
      const snapshotLinks = page
        .getByRole('link')
        .filter({ hasText: /\d{4}-\d{2}-\d{2}/ });
      const count = await snapshotLinks.count();
      return count;
    };

    const clickFirstSnapshotInList = async (): Promise<void> => {
      // Ensure snapshots table/list visible
      await expect(page.getByText('Snapshots')).toBeVisible({ timeout: 30000 });

      const firstSnapshotLink = page
        .getByRole('link')
        .filter({ hasText: /\d{4}-\d{2}-\d{2}/ })
        .first();

      await expect(firstSnapshotLink).toBeVisible({ timeout: 60000 });
      await firstSnapshotLink.click();

      // Optional: wait for URL change or snapshot details to mount
      await expect(page).toHaveURL(/snapshot/i, { timeout: 60000 });
    };

    const createSnapshotIfNeeded = async (snapshotCount: number): Promise<void> => {
      if (snapshotCount > 0) return;

      // Step 5: click Create snapshot and wait until completed
      const createSnapshotBtn = page
        .getByRole('button', { name: /create\s+snapshot/i })
        .or(page.getByText(/create\s+snapshot/i).first());

      await expect(createSnapshotBtn.first()).toBeVisible({ timeout: 30000 });
      await createSnapshotBtn.first().click({ force: true });

      await expect.poll(
        async () => {
          await page.reload();
          const body = await page.locator('body').innerText();
          return !/in progress/i.test(body) && !/creating/i.test(body);
        },
        {
          timeout: 180000,
          intervals: [5000],
          message: 'Timed out waiting for snapshot creation completion.'
        }
      ).toBe(true);

      await page.waitForTimeout(2000);
    };

    const snapshotCount = await extractFirstSnapshotCount();
    await createSnapshotIfNeeded(snapshotCount);
    await clickFirstSnapshotInList();

    // Step 6: Find 'POC RTC Dictionaries' and click
    // Use a unified approach: try link first; if not present, try button/tab.
    // Step 6: Wait until snapshot page loads and POC RTC Dictionaries appears

    await expect.poll(
      async () => {
        const body = await page.locator('body').innerText();
        return /poc rtc dictionaries/i.test(body);
      },
      {
        timeout: 60000,
        intervals: [2000]
      }
    ).toBe(true);

    const pocRtc = page
      .getByText(/poc rtc dictionaries/i)
      .first();

    await expect(pocRtc).toBeVisible({
      timeout: 30000
    });

    console.log('Opening POC RTC Dictionaries');

    await pocRtc.click();

    // Step 7: In the first search box type 'code'
    // const searchBox = page
    //   .getByRole('textbox')
    //   .filter({ has: page.getByText(/search/i).first() })
    //   .first();

    // // If above is not found reliably, fallback to first textbox after dictionaries click
    // const searchBoxFallback = await page.locator('input[type="search"], input[placeholder*="Search" i], textarea').first().isVisible().catch(() => false);

    // if (!searchBoxFallback) {
    //   // Use first textbox if search-specific isn't available
    //   await page.getByRole('textbox').first().fill('code');
    // } else {
    //   await page.locator('input[type="search"], input[placeholder*="Search" i], textarea').first().fill('code');
    // }

    // // Wait for results to filter
    // //    await page.waitForTimeout(1500);
    // await expect(firstSourceLink).toBeVisible({
    //   timeout: 30000
    // });

    //const searchBox = page.getByPlaceholder(/search/i);
    const searchBox = page.getByRole('textbox', {name: /search by source name/i});

    await expect(searchBox)
      .toBeVisible({
        timeout: 30000
      });

    await searchBox.fill('code');

    // Step 8: Click on the first source name link
    await expect.poll(
      async () =>
        await page
          .getByRole('link')
          .filter({ hasText: /code/i })
          .count(),
      {
        timeout: 30000
      }
    ).toBeGreaterThan(0);

    const firstSourceLink =
      page
        .getByRole('link')
        .filter({ hasText: /code/i })
        .first();

    await firstSourceLink.click();

    // Open Create Dictionary popup
    const createDictionaryBtn =
      page.getByRole('button', {
        name: /create dictionary/i
      });

    await expect(createDictionaryBtn).toBeVisible({
      timeout: 30000
    });

    await createDictionaryBtn.click();

    // Step 9: dictionary name as 'Srini_intm_<date,time>'
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');

    const dictName = `Srini_intm_${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}`;

    // Wait for Create Dictionary dialog
    const dialog = page.getByRole('dialog');

    await expect(dialog).toBeVisible({
      timeout: 30000
    });

    // Dictionary Name textbox inside popup
    const dictNameInput =
      dialog.getByRole('textbox', {
        name: /dictionary name/i
      });

    await expect(dictNameInput).toBeVisible();

    await dictNameInput.fill(dictName);

    // Step 10: Click create button - status as draft
    //const createBtn = page.getByRole('button', { name: /^create$/i }).or(page.getByRole('button', { name: /create/i }).first());
    // await expect(createBtn.first()).toBeEnabled({ timeout: 30000 });

    const createBtn =
      dialog.getByRole('button', {
        name: /^create$/i
      });

    await expect(createBtn).toBeEnabled({ timeout: 30000 });

    await createBtn.click();

    await expect(dialog).toBeHidden({ timeout: 30000 });

    //    await createBtn.first().click({ force: true });

    await expect.poll(
      async () => {
        const body = await page.locator('body').innerText();
        return /draft/i.test(body);
      },
      {
        timeout: 60000,
        intervals: [2000]
      }
    ).toBe(true);

    // Status after create should become "draft" (as per required flow)
    // Some builds may not contain the literal word "draft"; treat any non-error state as best-effort.
    // If your UI renders a dedicated status element, replace this with a targeted locator.
    // Required flow says: status as draft after Create.
    // However, QA builds may not render the word "draft" in a way that's easy to assert.
    // Don't block the rest of the flow; we validate the final step via "Persist Success".
    // (Intentionally non-fatal.)
    // await expect.poll(...)





    // Step 11: Click on Persist button
    // UI may render Persist as a button or link.
    const persistBtn = page.getByRole('button', { name: /persist/i }).first();
    const persistLink = page.getByRole('link', { name: /persist/i }).first();
    const persistTab = page
      .locator('[role="tab"], [role="menuitem"], [role="option"], a, div')
      .filter({ hasText: /persist/i })
      .first();

    // Persist control might appear only after Create completes; don't fail early if it's not found.
    // We'll try multiple strategies and then proceed to final assertion.
    if (await persistBtn.isVisible().catch(() => false)) {
      await persistBtn.click({ force: true });
    } else if (await persistLink.isVisible().catch(() => false)) {
      await persistLink.click({ force: true });
    } else if (await persistTab.isVisible().catch(() => false)) {
      await persistTab.click({ force: true });
    } else {
      // Best-effort: try to click any element that contains the word Persist
      const persistFallback = page.locator('text=/persist/i').first();
      if (await persistFallback.isVisible().catch(() => false)) {
        await persistFallback.click({ force: true });
      }
    }


    // Wait briefly for persist action to be processed (some UIs show immediate status change).

    // Step 12: refresh the page and check dictionary status 'Persist Success'
    await page.waitForTimeout(2000);
    await page.reload();

    await expect.poll(
      async () => {
        const body = await page.locator('body').innerText();
        return /persist success/i.test(body);
      },
      {
        timeout: 120000,
        intervals: [3000],
        message: 'Timed out waiting for Persist Success status after refresh.'
      }
    ).toBe(true);

    // Avoid relying on Node.js "process" typing in this repo
    const ci = (globalThis as any)?.process?.env?.CI;
    if (ci) {
      await page.screenshot({
        path: `test-results/${testInfo.title.replace(/[^a-zA-Z0-9]/g, '_')}.png`,
        fullPage: true
      });
    }
  });
});

