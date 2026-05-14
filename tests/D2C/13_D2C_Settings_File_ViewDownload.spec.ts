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
 * - View Content validation
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { SettingsPage } from '../../pages/SettingsPage';
import path from 'path';
import fs from 'fs';

test.describe('D2C Settings page validations', () => {
    let loginPage: LoginPage;
    let settingsPage: SettingsPage;

    /**
     * beforeEach Hook - Runs before each test
     */
    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        settingsPage = new SettingsPage(page);
        
        await loginPage.goto();
        await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
        await expect(page).toHaveURL(/design2code\/migration-management-design/);
        
        // Skip test if page shows 404 error
        if (await settingsPage.isPage404()) {
            test.skip(true, 'Page is showing 404 error');
        }
        
        // Navigate to the Settings page using POM
        await settingsPage.navigateToSettings();
    });

    /**
     * Test: Download settings file
     */
    const filesToDownload = [
        'fallout-rules.json'
    ];
    
    for (const fileName of filesToDownload) {
        test(`Download settings file: ${fileName}`, async ({ page }) => {
            // Download file using POM method
            const download = await settingsPage.downloadFile(fileName);

            // Save and validate the file
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

    /**
     * Test: View Content validation
     */
    for (const fileName of filesToDownload) {
        test(`View Content: ${fileName}`, async ({ page }) => {
            // View content using POM method
            const contentDialog = await settingsPage.viewFileContent(fileName);
            
            // Validate dialog is visible
            expect(await settingsPage.isContentDialogVisible()).toBeTruthy();
            
            // Get and validate content
            const dialogContent = await settingsPage.getContentDialogText();
            expect(dialogContent).toBeTruthy();
            expect(dialogContent.length).toBeGreaterThan(0);
        });
    }
});
