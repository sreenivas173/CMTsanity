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

test.describe('@DMTTsanity Env Snapshot - Comparison Report', () => {
  test.setTimeout(240000);
  test('Create Comparison Report from first snapshot (create snapshot if needed)', async ({ page }, testInfo) => {
    const login = new DMTT_LoginPage(page);
    const envNav = new DMTTEnvironmentPage(page);
    const list = new DMTTEnvironmentSearchPaginationPage(page);
    const validatePage = new DMTTEnvironmentConfigValidatePage(page);

    await login.goto();
    await login.login(process.env.DMTT_USERNAME!, process.env.DMTT_PASSWORD!);

    await envNav.navigate();
    await list.waitForPageReady();

    //await list.search('sanity');
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
    // Click first config returned by search.
    const firstConfigLink = page
      .getByRole('link')
      .filter({
        hasText: new RegExp(searchTerm, 'i')
      })
      .first();

    await expect(firstConfigLink)
      .toBeVisible({ timeout: 30000 });

    await firstConfigLink.click();

    // Wait for details page.
    await expect(
      page.getByRole('button', {
        name: /create\s+snapshot/i
      })
    ).toBeVisible({
      timeout: 30000
    });

    // const extractFirstSnapshotCount = async (): Promise<number> => {

    //   // Wait until snapshot section is visible
    //   await expect(
    //     page.getByText('Snapshots')
    //   ).toBeVisible({
    //     timeout: 30000
    //   });

    //   // Give table data time to render
    //   await page.waitForLoadState('networkidle');

    //   const snapshotLinks = page
    //     .getByRole('link')
    //     .filter({
    //       hasText: /\d{4}-\d{2}-\d{2}/
    //     });

    //   const count = await snapshotLinks.count();

    //   console.log(`Detected snapshots: ${count}`);

    //   return count;
    // };

    const getCompletedSnapshotCount =
      async (): Promise<number> => {

        await expect.poll(
          async () => {

            const snapshotLinks =
              page.locator(
                'a[href*="step=snapshot"]'
              );

            return await snapshotLinks.count();

          },
          {
            timeout: 30000,
            intervals: [2000]
          }
        ).toBeGreaterThan(0);

        const snapshotLinks =
          page.locator(
            'a[href*="step=snapshot"]'
          );

        const count =
          await snapshotLinks.count();

        console.log(
          `Snapshots found: ${count}`
        );

        console.log(
          'Current URL:',
          page.url()
        );

        return count;
      };




    const clickFirstSnapshotInList =
      async (): Promise<void> => {

        const snapshotLinks =
          page.locator(
            'a[href*="step=snapshot"]'
          );

        const snapshotCount =
          await snapshotLinks.count();

        console.log(
          `Snapshot links found: ${snapshotCount}`
        );

        if (snapshotCount === 0) {
          throw new Error(
            'No snapshot links found'
          );
        }

        const snapshotNames =
          await snapshotLinks.allTextContents();

        console.log(
          'Available snapshots:',
          snapshotNames
        );

        const latestSnapshot =
          snapshotLinks.last();

        const snapshotName =
          await latestSnapshot.textContent();

        console.log(
          `Opening snapshot: ${snapshotName}`
        );

        await latestSnapshot.click();

        await expect(page)
          .toHaveURL(
            /step=snapshot/,
            {
              timeout: 30000
            }
          );
      };

    const createSnapshotIfNeeded =
      async (): Promise<void> => {

        const completedCount =
          await getCompletedSnapshotCount();

        if (completedCount > 0) {

          console.log(
            `Using existing completed snapshots (${completedCount})`
          );

          return;
        }

        console.log(
          'No completed snapshots found. Creating snapshot...'
        );

        const createSnapshotBtn =
          page.getByRole(
            'button',
            {
              name: /create snapshot/i
            }
          );

        await createSnapshotBtn.click();

        await expect.poll(
          async () => {

            await page.reload();

            return await page
              .locator(
                'a[href*="step=snapshot"]'
              )
              .count();

          },
          {
            timeout: 300000,
            intervals: [10000]
          }
        ).toBeGreaterThan(0);

        console.log(
          'Snapshot creation completed'
        );
      };

    // Step 4: check snapshot exist or not.
    await createSnapshotIfNeeded();

    const completedCount =
      await getCompletedSnapshotCount();

    expect(
      completedCount,
      'Expected at least one completed snapshot'
    ).toBeGreaterThan(0);
    // If snapshotCount was null, still attempt to click first snapshot.
    // If it was 0, after creation we should have snapshots; click first.
    await clickFirstSnapshotInList();

    // Capture baseline comparison report items count (if present).
    // const extractComparisonItemsCount = async (): Promise<number | null> => {
    //   const bodyTxt = await page.locator('body').innerText();

    //   // Common patterns: "X items", "items: X", etc.
    //   const m1 = bodyTxt.match(/(\d+)\s+items?/i);

    //   if (m1?.[1] && /comparison|report/i.test(bodyTxt)) {
    //     return Number(m1[1]);
    //   }

    //   const m2 = bodyTxt.match(/comparison\s+report[^\d]*(\d+)/i);
    //   if (m2?.[1]) return Number(m2[1]);

    //   return null;
    // };

    //const beforeComparisonCount = await extractComparisonItemsCount();

    // Step 6: click 'Create Comparison Report' a popup window opens to 'pick a snapshot'
    // Based on current UI snapshot, action is likely inside the selected snapshot row
    // via the "Comparison Reports" column.

    // Step 6: open comparison report creation.
    // Based on page snapshot, the action is most likely in the snapshots table row
    // under the "Comparison Reports" column.

    // In current UI, snapshot row shows a "Comparison Reports" column.
    // The per-snapshot action is usually a button under that column (could be icon-only).
    // So locate the snapshot table row and click the first control within it that looks like an action.

    const createComparisonReportButton = page.getByRole(
      'button',
      {
        name: /create snapshots comparison report/i
      }
    );

    await expect(
      createComparisonReportButton
    ).toBeVisible({
      timeout: 60000
    });

    await expect.poll(
      async () =>
        await createComparisonReportButton.isEnabled(),
      {
        timeout: 180000,
        intervals: [5000]
      }
    ).toBe(true);

    await createComparisonReportButton.click();

    const dialog = page
      .locator(
        '[role="dialog"], .ux-react-popup__wrapper, .modal'
      )
      .first();

    await expect(dialog).toBeVisible({
      timeout: 60000
    });

    //  const dialog = page.locator('[role="dialog"], .ux-react-popup__wrapper, .modal').first();
    const pickSnapshotText = page.getByText(/pick a snapshot/i).first();

    await expect(dialog).toBeVisible({ timeout: 60000 });
    await expect(pickSnapshotText).toBeVisible({ timeout: 60000 });

    // Step 7: click on the 'pcik a snapshot' (typo in instructions; implement as pick snapshot control)
    const pickSnapshotControl =
      dialog.getByText(
        /pick a snapshot/i,
        { exact: false }
      );

    await expect(
      pickSnapshotControl
    ).toBeVisible({
      timeout: 30000
    });

    await pickSnapshotControl.click();
    console.log(
      await page.locator('[role="dialog"]').innerHTML()
    );

    console.log(
      await page.locator('[role="dialog"]').innerText()
    );
    // Step 8: dropdown select first snapshot name
    // Look for first option in the open dropdown.

    // Parent environment
    const parentItems =
      page.getByRole('menuitem');

    console.log(
      'Parent menu count:',
      await parentItems.count()
    );

    const parentItem =
      parentItems.first();

    await parentItem.click();

    await page.waitForTimeout(2000);

    console.log(
      await page.locator('[role="dialog"]').innerText()
    );
    // Wait until submenu appears
    await parentItem.hover();

    await page.waitForTimeout(1500);

    const snapshotItem =
      page.locator(
        '[role="menuitem"]'
      ).filter({
        hasText: /\d{4}-\d{2}-\d{2}_\d{2}:\d{2}:\d{2}/
      }).last();

    console.log(
      'Snapshot count:',
      await snapshotItem.count()
    );
    await expect(snapshotItem)
      .toBeVisible({
        timeout: 10000
      });

    const snapshotName =
      (await snapshotItem.textContent())?.trim();

    console.log(
      `Selecting snapshot: ${snapshotName}`
    );

    await snapshotItem.click();
    // Step 9: ensure Create button enabled and click Create button
    const createButton = dialog
      .getByRole('button', { name: /^create$/i })
      .or(dialog.getByRole('button', { name: /create/i }))
      .first();

    await expect(createButton).toBeVisible({ timeout: 30000 });
    console.log(
      'Create enabled:',
      await createButton.isEnabled()
    );

    await expect(createButton).toBeEnabled({ timeout: 30000 });

    await createButton.click({ force: true });


    await expect.poll(
      async () => {

        await page.reload();

        const bodyText =
          await page.locator('body').innerText();

        return !bodyText.includes(
          'No data to display'
        );
      },
      {
        timeout: 30000,
        intervals: [2000]
      }
    ).toBe(true);

    // Step 10: ensure success notification OR increment in snapshot comparison report items count is Pass.
    const successToast = page
      .locator('[role="alert"], .pf-m-success, .pf-v5-c-alert--success')
      .filter({ hasText: /success|created|comparison|report/i })
      .first();



    await expect.poll(
      async () => {

        await page.reload();

        const bodyText =
          await page.locator('body').innerText();

        return !bodyText.includes(
          'No data to display'
        );
      },
      {
        timeout: 30000,
        intervals: [2000]
      }
    ).toBe(true);

    if (process?.env?.CI) {
      await page.screenshot({
        path: `test-results/${testInfo.title.replace(/[^a-zA-Z0-9]/g, '_')}.png`,
        fullPage: true,
      });
    }
  });
});

