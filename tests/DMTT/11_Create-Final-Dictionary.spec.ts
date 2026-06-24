import { test, expect } from '@playwright/test';

import { DMTT_LoginPage } from '../../pages/DMTT_LoginPage';
import { DMTTEnvironmentPage } from '../../pages/DMTTEnvironmentPage';
import { DMTTEnvironmentSearchPaginationPage } from '../../pages/DMTTEnvironmentSearchPaginationPage';
import { DMTTEnvironmentConfigValidatePage } from '../../pages/DMTTEnvironmentConfigValidatePage';

/**
 * DMTT Environment - Create Final Dictionary (sanity).
 *
 * Why this spec exists:
 * - Ensures the end-to-end flow from an Environment "sanity" config snapshot
 *   → intermediate dictionary selection
 *   → final dictionary creation works.
 *
 * High-level flow (keep in sync with step comments below):
 *  1) Search "sanity" in Environment list
 *  2) Open first matching config
 *  3) Determine whether snapshots exist (0 vs >0)
 *  4) If snapshot count is 0, click Create snapshot and wait completion
 *  5) Open first snapshot
 *  6) Open "POC RTC Dictionaries"
 *  7) Search by source name = "code"
 *  8) Open first source link
 *  9) Capture first intermediate dictionary name → IntDitName
 * 10) Go back to "POC RTC Dictionaries" view
 * 11) Select "Final Dictionaries" tab/radio
 * 12) Click "Create Dictionary"
 * 13) Set dictionary name = Srini_Finaldit_<timestamp>
 * 14) Set SQL = select * from IntDitName
 * 15) Submit (create)
 * 16) Verify the created dictionary is visible in the list
 *
 * Notes / assumptions:
 * - This test intentionally does not reuse the validate page instance (kept for consistency with other specs).
 * - Many selectors use text/roles because the UI can shift slightly across builds.
 * - If the UI changes text labels (e.g., "Final Dictionaries"), adjust the corresponding locators.
 */



test.describe('@DMTTsanity Create Final Dictionary', () => {
    test.setTimeout(240000);

    test('Create Final Dictionary from first snapshot', async ({ page }, testInfo) => {
        const login = new DMTT_LoginPage(page);
        const envNav = new DMTTEnvironmentPage(page);
        const list = new DMTTEnvironmentSearchPaginationPage(page);

        // validatePage is not used directly in this spec, but kept consistent with other DMTT tests.
        // If later we add validations on environment/config correctness, this instance can be used.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const validatePage = new DMTTEnvironmentConfigValidatePage(page);


        await login.goto();
        const username = (globalThis as any)?.process?.env?.DMTT_USERNAME;
        const password = (globalThis as any)?.process?.env?.DMTT_PASSWORD;
        await login.login(username!, password!);

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
            // await page.waitForTimeout(1000);
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
                    const body =
                        await page.locator('body').innerText();

                    return !/in progress/i.test(body)
                        && !/creating/i.test(body);
                },
                {
                    timeout: 180000,
                    intervals: [5000]
                }
            ).toBe(true);

            //            await page.waitForTimeout(2000);
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

        //const searchBox = page.getByPlaceholder(/search/i);
        const searchBox = page.getByRole('textbox', { name: /search by source name/i });

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


        // Step 9 – Capture Intermediate Dictionary Name

        await expect.poll(
            async () =>
                await page
                    .getByRole('row')
                    .count(),
            {
                timeout: 30000
            }
        ).toBeGreaterThan(1);

        // Skip header row
        const firstIntDictionary =
            page
                .getByRole('row')
                .nth(1);

        await expect(firstIntDictionary).toBeVisible({
            timeout: 30000
        });

        // const IntDitName =
        //     (
        //         await firstIntDictionary
        //             .locator('td')
        //             .nth(1)
        //             .innerText()
        //     ).trim();

        // console.log(`Intermediate dictionary: ${IntDitName}`);

        const IntDitName =
            (
                await firstIntDictionary
                    .getByRole('link')
                    .first()
                    .innerText()
            ).trim();

        console.log(
            `Intermediate dictionary: ${IntDitName}`
        );

        //Step 10 – Return to POC RTC Dictionaries page

        // await page
        //     .getByRole('link', {
        //         name: /2026-/i
        //     })
        //     .click();

        await page.goBack();

        await expect.poll(
            async () => {
                const body =
                    await page.locator('body').innerText();

                return /poc rtc dictionaries/i.test(body);
            },
            {
                timeout: 60000
            }
        ).toBe(true);
        // await page.goBack();

        await page
            .getByRole('tab', {
                name: /POC RTC Dictionaries/i
            })
            .click();
        //Step11. Select Final Dictionaries button

        console.log('Opening Final Dictionaries');

        const finalTab = page
            .getByText(/^Final Dictionaries$/i)
            .first();

        await expect(finalTab).toBeVisible({
            timeout: 30000
        });

        await finalTab.click();

        await expect(
            page.getByRole('button', {
                name: /create dictionary/i
            })
        ).toBeVisible({
            timeout: 30000
        });

        const beforeCount =
            Math.max(
                (await page.getByRole('row').count()) - 1,
                0
            );

        console.log(
            `Final dictionary count before create: ${beforeCount}`
        );


        //console.log(`Final dictionary count before create: ${beforeCount}`);

        //Step 12 – Click Create Dictionary
        const finalCreateDictionaryBtn = page
            .getByRole('button', {
                name: /create dictionary/i
            });

        await expect(finalCreateDictionaryBtn)
            .toBeVisible({
                timeout: 30000
            });

        await expect(finalCreateDictionaryBtn)
            .toBeEnabled({
                timeout: 30000
            });

        await finalCreateDictionaryBtn.click();

        // Step 13/14: Fill in dictionary name + SQL, then submit

        const now = new Date();

        const finalDictName =
            `Srini_Finaldit_${now.getFullYear()
            }-${String(now.getMonth() + 1).padStart(2, '0')
            }-${String(now.getDate()).padStart(2, '0')
            }_${String(now.getHours()).padStart(2, '0')
            }-${String(now.getMinutes()).padStart(2, '0')
            }-${String(now.getSeconds()).padStart(2, '0')
            }`;

        //Dictionary name 
        const dialog = page.getByRole('dialog');

        await expect(dialog).toBeVisible({
            timeout: 30000
        });

        await dialog
            .getByRole('textbox', {
                name: /dictionary name/i
            })
            .fill(finalDictName);

        // SQL textbox

        await dialog
            .getByRole('textbox')
            .nth(1)
            .fill(`select * from ${IntDitName}`);

        //STEP 14: Click Create/Submit in dialog

        const createBtn =
            dialog.getByRole('button', {
                name: /^create$/i
            });

        await expect(createBtn)
            .toBeEnabled({
                timeout: 30000
            });

        await createBtn.click();

        await expect(dialog)
            .toBeHidden({
                timeout: 30000
            });

        console.log(
            'Created Final Dictionary:',
            finalDictName
        );
        const expectedFinalName =
            finalDictName
                .replace(/-/g, '_')
                .toUpperCase();

        //Step 15 – Verify final dictionary creation success by checking count increased or new dictionary appears in list (refresh if needed)

        await expect.poll(
            async () =>
                await page
                    .getByRole('link')
                    .filter({
                        hasText: expectedFinalName
                    })
                    .count(),
            {
                timeout: 120000,
                intervals: [5000]
            }
        ).toBeGreaterThan(0);


        //==================================
        /*await expect.poll(
        async () => {
        const body =
            (
                await page.locator('body')
                    .innerText()
            ).toUpperCase();

        return body.includes(
            expectedFinalName
        );
        },
        {
        timeout: 120000,
        intervals: [5000]
        }
        ).toBe(true);*/

    });
});
