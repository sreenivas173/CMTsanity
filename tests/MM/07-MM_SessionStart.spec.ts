/**
 * Author: Srinivasa Rao Allamsetti 
 * This test file validates the MM Session Start functionality.
 * It verifies finding a newly created session, starting it, and status change.
 * 
 */

import { test, expect } from '@playwright/test';
import { MM_LoginPage } from '../../pages/MM_LoginPage';
import { MM_SessionsPage } from '../../pages/MM_SessionsPage';
import 'dotenv/config';

test.describe('MM Session Start Validations', () => {
  let loginPage: MM_LoginPage;
  let mmSessionsPage: MM_SessionsPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new MM_LoginPage(page);
    mmSessionsPage = new MM_SessionsPage(page);

    await loginPage.goto();
    // Login with credentials (matching 05-MM_SessionCreate.spec.ts)
    await loginPage.login(process.env.MM_USERNAME!, process.env.MM_PASSWORD!);
    // Wait for login to complete
    await page.waitForTimeout(3000);
  });

  test('MM Session Start - Verify Status Changes From Not Started to Started', async ({ page }) => {
    // Full URL as specified
    const fullUrl = 'https://cdn-edge-service-qa1.cloudmt.managed.netcracker.cloud/fragment/migration-ui/sessions';
    
    // Navigate to sessions page
    await mmSessionsPage.navigateToMMSession(fullUrl);
    await expect(page).toHaveURL(/sessions$/);

    // Compute session name matching 05-MM_SessionCreate.spec.ts
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const sessionName = `Srini_MM_AT_Newsession_${today}`;

    console.log(`Looking for session: ${sessionName}`);

    // Search for the session
    await mmSessionsPage.searchSession(sessionName);

    // Wait for session to appear in table (adjust selector if needed based on table structure)
    const sessionLink = page.getByRole('link', { name: sessionName, exact: true });
    await expect(sessionLink).toBeVisible({ timeout: 15000 });

    // Click the session link to go to detail page
    await sessionLink.click();

    // Wait for detail page load and verify status is 'Not Started'
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Allow animations

    // On detail page, verify status is 'Not Started'
    // Use getByText first for simple text match
    const notStartedLocator = page.getByText('Not Started');
    await expect(notStartedLocator).toBeVisible({ timeout: 10000 });
    
    // Also check in status containers
    const statusContainers = page.locator('.ux-react-chip__text, [class*="status"], .status-text');
    await expect(statusContainers.filter({ hasText: 'Not Started' })).toBeVisible({ timeout: 5000 });

    // Find and click Start button using EXACT locator provided
    const startButton = page.locator('span').filter({ hasText: 'Start' }).last();
    await expect(startButton).toBeVisible({ timeout: 10000 });
    await expect(startButton).toBeEnabled();
    await startButton.click();

    // Wait for action to complete
    await page.waitForTimeout(5000);

    // Verify status has changed (no longer 'Not Started')
    await expect(page.getByText('Not Started')).not.toBeVisible({ timeout: 5000 });

    // Get new status from first container
    const newStatusContainers = page.locator('.ux-react-chip__text, [class*="status"], .status-text');
    const newStatusText = await newStatusContainers.first().textContent() || '';
    const trimmedStatus = newStatusText.trim();
    expect(trimmedStatus.length > 0).toBeTruthy();
    expect(trimmedStatus).not.toContain('Not Started');
    console.log(`Status changed from 'Not Started' to: "${trimmedStatus}"`);

    // Optional: expect specific new status
    // expect(trimmedStatus).toMatch(/Running|Started|In Progress/i);
  });
});

