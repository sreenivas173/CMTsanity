/** @author Srinivasa Rao Allamsetti */

import { test, expect } from '@playwright/test';
import { MM_LoginPage } from '../../pages/MM_LoginPage';

test.describe('Login Page Validations', () => {
  let loginPage: MM_LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new MM_LoginPage(page);
    await loginPage.goto();
  });

  /** Tests that login fails when email is empty */
  test('should show error for empty email', async ({ page }, testInfo) => {
    await loginPage.fillPassword('password');
    await loginPage.clickLogin();
    const error = await loginPage.getErrorMessage();
    expect(error).toContain('Captcha is required');
    await page.screenshot({ path: `screenshots/${testInfo.title.replace(/[^a-zA-Z0-9]/g, '_')}.png` });
  });

  /** Tests that login fails when password is empty */
  test('should show error for empty password', async ({ page }, testInfo) => {
    await loginPage.fillEmail('email@example.com');
    await loginPage.clickLogin();
    const error = await loginPage.getErrorMessage();
    expect(error).toContain('Captcha is required');
    await page.screenshot({ path: `screenshots/${testInfo.title.replace(/[^a-zA-Z0-9]/g, '_')}.png` });
  });

  /** Tests that login fails for invalid credentials */
  test('should show error for invalid credentials', async ({ page }, testInfo) => {
    await loginPage.login('invalid@email.com', 'wrongpass');
    const error = await loginPage.getErrorMessage();
    expect(error).toContain('Captcha is required');
    await page.screenshot({ path: `screenshots/${testInfo.title.replace(/[^a-zA-Z0-9]/g, '_')}.png` });
  });

  /** Tests successful login and validates the success message */
  test('successful login and validate message', async ({ page }, testInfo) => {
    await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
    const isVisible = await loginPage.isSuccessMessageVisible();
    expect(isVisible).toBe(true);
    await page.screenshot({ path: `screenshots/${testInfo.title.replace(/[^a-zA-Z0-9]/g, '_')}.png` });
  });


});
