/** @author Srinivasa Rao Allamsetti */

import { test, expect } from '@playwright/test';
import { DMTT_LoginPage } from '../../pages/DMTT_LoginPage';

/**
 * DMTT Login validations.
 *
 * Purpose:
 * - Validate client-side / early server-side error messaging for invalid or incomplete inputs.
 * - Validate successful login flow using credentials from environment variables.
 *
 * Notes:
 * - These tests intentionally trigger the login error state (including CAPTCHA-required messaging).
 * - Screenshots are captured per test case for easier debugging in CI.
 */
test.describe('Login Page Validations', () => {
  let loginPage: DMTT_LoginPage;

  // Ensure every test starts from the login page.
  test.beforeEach(async ({ page }) => {
    loginPage = new DMTT_LoginPage(page);
    await loginPage.goto();
  });

  /**
   * Verifies login form validation when email is missing.
   * Expected behavior: error message is shown (CAPTCHA-required in this environment).
   */
  test('should show error for empty email', async ({ page }, testInfo) => {
    await loginPage.fillPassword('password');
    await loginPage.clickLogin();

    const error = await loginPage.getErrorMessage();
    expect(error).toContain('Captcha is required');

    // Artifact for trace/debug.
    await page.screenshot({
      path: `screenshots/${testInfo.title.replace(/[^a-zA-Z0-9]/g, '_')}.png`
    });
  });

  /**
   * Verifies login form validation when password is missing.
   * Expected behavior: error message is shown (CAPTCHA-required in this environment).
   */
  test('should show error for empty password', async ({ page }, testInfo) => {
    await loginPage.fillEmail('email@example.com');
    await loginPage.clickLogin();

    const error = await loginPage.getErrorMessage();
    expect(error).toContain('Captcha is required');

    // Artifact for trace/debug.
    await page.screenshot({
      path: `screenshots/${testInfo.title.replace(/[^a-zA-Z0-9]/g, '_')}.png`
    });
  });

  /**
   * Verifies login fails with invalid credentials.
   * Expected behavior: error message is shown (CAPTCHA-required in this environment).
   */
  test('should show error for invalid credentials', async ({ page }, testInfo) => {
    await loginPage.login('invalid@email.com', 'wrongpass');

    const error = await loginPage.getErrorMessage();
    expect(error).toContain('Captcha is required');

    // Artifact for trace/debug.
    await page.screenshot({
      path: `screenshots/${testInfo.title.replace(/[^a-zA-Z0-9]/g, '_')}.png`
    });
  });

  /**
   * Sanity: successful login using environment credentials.
   * Expected behavior: post-login success message is visible.
   */
  test('@DMTTsanity successful login and validate message', async ({ page }, testInfo) => {
    await loginPage.login(process.env.DMTT_USERNAME!, process.env.DMTT_PASSWORD!);

    const isVisible = await loginPage.isSuccessMessageVisible();
    expect(isVisible).toBe(true);

    // Artifact for trace/debug.
    await page.screenshot({
      path: `screenshots/${testInfo.title.replace(/[^a-zA-Z0-9]/g, '_')}.png`
    });
  });
});

