/** @author Srinivasa Rao Allamsetti */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

test.describe('Login Page Validations', () => {
  //test.use({ video: 'on' });

  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
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
  test('Show error for empty password', async ({ page }, testInfo) => {
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
  test('@Sanity successful login and validate message', async ({ page }, testInfo) => {
    await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
    const isVisible = await loginPage.isSuccessMessageVisible();
    expect(isVisible).toBe(true);
    await page.screenshot({ path: `screenshots/${testInfo.title.replace(/[^a-zA-Z0-9]/g, '_')}.png` });
  });


});
