/**
 * Author: Srinivasa Rao Allamsetti
 *
 * This test validates MM Design "Input" download flow for D2C regression.
 * Steps:
 * - Login to D2C
 * - Go to MM Design search
 * - Search for 'oss'
 * - Hover first result row to reveal 3-dots (kebab) menu
 * - Click the menu and select 'Download'
 * - Verify download succeeds and file is saved to Resources
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import 'dotenv/config';

import { LoginPage } from '../../../pages/LoginPage';
import { MMDesignPage } from '../../../pages/MMDesignPage';
import { clearPotFolder, capturePotStep } from '../../../utils/PotHelper';
import { generatePotDocument } from '../../../utils/WordGenerator';

test.describe('@D2CRegression MM Design Input Download Validation', () => {
    test('R03_D2C_mmDesignInputDownload - Download via 3-dots menu', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const mmDesignPage = new MMDesignPage(page);

        clearPotFolder('D2C', 'R03_D2C_mmDesignInputDownload');

        await loginPage.goto();
        await loginPage.login(
            process.env.D2C_USERNAME!,
            process.env.D2C_PASSWORD!
        );

        await capturePotStep(
            page,
            'D2C',
            'R03_D2C_mmDesignInputDownload',
            1,
            'Login Page'
        );

        await expect(page).toHaveURL(/design2code\/migration-management-design/);

        if (await mmDesignPage.isPage404()) {
            test.skip(true, 'Page is showing 404 error');
        }

        // Navigate to the MM Design page
        await mmDesignPage.navigateToMMDesign();

        // Search for designs
        await page.getByPlaceholder('Search').fill('oss');

        // Wait until search completes
        await expect(page.getByRole('table')).toBeVisible();

        // First data row (0 = header row)
        const firstRow = page.getByRole('row').nth(1);

        await expect(firstRow).toBeVisible({
            timeout: 15000
        });

        console.log(await firstRow.textContent());

        await capturePotStep(
            page,
            'D2C',
            'R03_D2C_mmDesignInputDownload',
            2,
            'Search for oss and find first result'
        );

        // Hover over first row to reveal the action menu
        await firstRow.hover();
        await page.waitForTimeout(1000);

        console.log(await page.locator('button').count());
        // Locate the three-dot menu button inside the row
        // Hover first row
        await firstRow.hover();
        await page.waitForTimeout(1000);

        // The kebab button appears outside the row
        const menuButton = page.getByRole('button').nth(5);

        await expect(menuButton).toBeVisible({
            timeout: 10000
        });

        //await menuButton.click();
        await menuButton.click();

        // Verify popup menu appears
        await expect(page.getByText('Download', { exact: true })).toBeVisible();

        await capturePotStep(
            page,
            'D2C',
            'R03_D2C_mmDesignInputDownload',
            3,
            'Open 3-dots menu and click Download'
        );

        // Download file
        const [download] = await Promise.all([
            page.waitForEvent('download'),
            page.getByText('Download', { exact: true }).click()
        ]);

        const filename = download.suggestedFilename();
        expect(filename).toBeTruthy();

        console.log(`📥 Downloaded file: ${filename}`);

        const savePath = `Resources/${filename}`;
        await download.saveAs(savePath);

        // Ensure download saved successfully
        expect(fs.existsSync(savePath)).toBeTruthy();
        console.log(
            `💾 File saved successfully: ${savePath} (size: ${fs.statSync(savePath).size} bytes)`
        );

        await capturePotStep(
            page,
            'D2C',
            'R03_D2C_mmDesignInputDownload',
            4,
            'Download success and file saved'
        );

        await generatePotDocument('D2C', 'R03_D2C_mmDesignInputDownload');
    });
});

