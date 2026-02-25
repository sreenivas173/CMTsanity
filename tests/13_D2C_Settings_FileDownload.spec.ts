/** 
 * @author Srinivasa Rao Allamsetti
 * 
 * D2C Settings Page Test Suite - Download Functionality
 * 
 * This test suite validates downloading settings files from the D2C Settings page.
 * Tests downloading configuration files from MM Design and DB Level Design sections.
 * 
 * Test Coverage:
 * - Download settings file: fallout-rules.json
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import path from 'path';
import fs from 'fs';

test.describe('D2C Settings page validations', () => {
    let loginPage: LoginPage;

    /**
     * beforeEach Hook - Runs before each test
     */
    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
        await expect(page).toHaveURL(/design2code\/migration-management-design/);
        
        // Skip test if page shows 404 error
        if (await page.locator('text=The page cannot be found').isVisible()) {
            test.skip(true, 'Page is showing 404 error');
        }
        
        // Navigate to the D2C Settings page
        await page.click('text=Settings');
        await page.waitForTimeout(2000);
    });

    /**
     * Test: Download settings file
     */
    const filesToDownload = [
        'fallout-rules.json'
    ];
    
    for (const fileName of filesToDownload) {
        test(`Download settings file: ${fileName}`, async ({ page }) => {
            // Step 1: Find the file by text and hover to make buttons visible
            const fileElement = page.getByRole('gridcell', { name: fileName }).first();
            await expect(fileElement).toBeVisible();
            await fileElement.hover();
            
            // Wait for the dropdown to become visible
            await page.waitForTimeout(500);
            
            // Step 2: Click the three-dot menu button (first one after hover)
            // Use force:true since element might be considered not visible by Playwright
            await page.locator('button.ux-react-dropdown__trigger').first().click({ force: true });
            
            // Step 3: Wait for dropdown menu and click Download
            await page.waitForTimeout(300);
            const [download] = await Promise.all([
                page.waitForEvent('download'),
                page.getByText('Download').click()
            ]);

            // Step 4: Save and validate the file
            const downloadsDir = path.join(process.cwd(), 'downloads');
            if (!fs.existsSync(downloadsDir)) {
                fs.mkdirSync(downloadsDir, { recursive: true });
            }
            
            const downloadPath = path.join(downloadsDir, await download.suggestedFilename());
            await download.saveAs(downloadPath);
            
            // Validate file exists
            expect(fs.existsSync(downloadPath)).toBeTruthy();
            
            // Validate file content
            const content = fs.readFileSync(downloadPath, 'utf-8');
            expect(content.length).toBeGreaterThan(0);
        });
    }
});
