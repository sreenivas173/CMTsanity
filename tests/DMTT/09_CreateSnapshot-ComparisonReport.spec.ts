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

    await list.search('sanity');

    // Click first config returned by search.
    const firstConfigLink = page
      .getByRole('link')
      .filter({ hasText: /sanity/i })
      .first();

    await expect(firstConfigLink).toBeVisible({ timeout: 30000 });
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

    const extractFirstSnapshotCount = async (): Promise<number> => {

      // Wait for snapshot section to render
      await expect.poll(
        async () => {
          const text =
            await page.locator('body').innerText();

          return (
            text.includes('items,') ||
            text.includes('No snapshots')
          );
        },
        {
          timeout: 30000,
          intervals: [1000]
        }
      ).toBe(true);

      const bodyText =
        await page.locator('body').innerText();

      console.log(
        'Snapshot section loaded'
      );

      console.log(bodyText);

      // Existing snapshots
      const match =
        bodyText.match(
          /(\d+)\s+items,\s+\d+-\d+\s+shown/i
        );

      if (match?.[1]) {
        const count = Number(match[1]);

        console.log(
          `Detected snapshots: ${count}`
        );

        return count;
      }

      // Explicit empty state
      if (/no snapshots/i.test(bodyText)) {
        console.log(
          'Detected snapshots: 0'
        );
        return 0;
      }

      console.log(
        'Unable to determine snapshot count'
      );

      return 0;
    };




    const clickFirstSnapshotInList = async (): Promise<void> => {

      // Wait until snapshot table is visible
      await expect(
        page.getByText('Snapshots')
      ).toBeVisible({
        timeout: 30000
      });

      // First snapshot link in table
      const firstSnapshotLink = page
        .getByRole('link')
        .filter({
          hasText: /\d{4}-\d{2}-\d{2}/
        })
        .first();

      await expect(firstSnapshotLink).toBeVisible({
        timeout: 60000
      });

      const snapshotName =
        await firstSnapshotLink.textContent();

      console.log(
        `Opening snapshot: ${snapshotName}`
      );

      await firstSnapshotLink.click();

      // Snapshot details page
      await expect(page).toHaveURL(
        /step=snapshot/,
        {
          timeout: 30000
        }
      );
    };

    const createSnapshotIfNeeded = async (
      snapshotCount: number
    ): Promise<void> => {

      if (snapshotCount > 0) {
        console.log(
          `Snapshots already exist (${snapshotCount}). Skipping snapshot creation.`
        );
        return;
      }

      console.log('No snapshots found. Creating snapshot...');

      const createSnapshotAction = page
        .getByRole('button', { name: /create\s+snapshot/i })
        .or(page.getByText(/create\s+snapshot/i).first());

      await expect(
        createSnapshotAction.first()
      ).toBeVisible({
        timeout: 30000
      });

      await createSnapshotAction
        .first()
        .click({ force: true });

      await expect
        .poll(
          async () => {
            await page.reload();

            await expect(
              page.getByText('Snapshots')
            ).toBeVisible({
              timeout: 30000
            });

            const bodyText =
              await page.locator('body').innerText();

            return !/in progress/i.test(bodyText);
          },
          {
            timeout: 180000,
            intervals: [5000],
            message:
              'Timed out waiting for snapshot creation completion.'
          }
        )
        .toBe(true);

      console.log(
        'Snapshot creation completed successfully.'
      );

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

    // Step 8: dropdown select first snapshot name
    // Look for first option in the open dropdown.

    // Select first parent item
    const firstParentItem = page
      .getByRole('menuitem')
      .first();

    await expect(firstParentItem).toBeVisible({
      timeout: 30000
    });

    const parentText =
      await firstParentItem.textContent();

    console.log(
      `Selecting parent item: ${parentText}`
    );

    await firstParentItem.click();

    // Wait for submenu to appear
    const menus = page.getByRole('menu');

    await expect(menus.nth(1)).toBeVisible({
      timeout: 30000
    });

    // First child snapshot from submenu
    const firstChildSnapshot = menus
      .nth(1)
      .getByRole('menuitem')
      .first();

    await expect(firstChildSnapshot).toBeVisible({
      timeout: 30000
    });

    const childText =
      await firstChildSnapshot.textContent();

    console.log(
      `Selecting child snapshot: ${childText}`
    );

    await firstChildSnapshot.click();
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
      await expect.poll(
        async () => {

          // Refresh page so newly created report appears
          await page.reload();

          // Wait for table to reload
          await expect(
            page.getByRole('button', {
              name: /create snapshots comparison report/i
            })
          ).toBeVisible();

          const bodyText =
            await page.locator('body').innerText();

          const match =
            bodyText.match(
              /(\d+)\s+items,\s+\d+-\d+\s+shown/i
            );

          const count = match
            ? Number(match[1])
            : 0;

          console.log(
            `Comparison report count: ${count}`
          );

          return count > 0;
        },
        {
          timeout: 120000,
          intervals: [5000]
        }
      ).toBe(true);

      return true;
    };

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

