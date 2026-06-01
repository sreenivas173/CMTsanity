import { Page } from '@playwright/test';

export class DMTT_LoginPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {

  await this.page.goto(
    'https://cdn-edge-service-qa1.cloudmt.managed.netcracker.cloud/fragment/migration-testing-ui/configurations/',
    {
      waitUntil: 'domcontentloaded',
      timeout: 120000
    }
  );

  await this.page.waitForTimeout(5000);

}
  async fillEmail(email: string) {
    await this.page.waitForSelector('#username', { timeout: 10000 });
    await this.page.fill('#username', email);
  }


  async fillPassword(password: string) {
    await this.page.fill('#password', password);
  }

  async clickLogin() {
    await this.page.click('#kc-login');
  }

async login(
  email: string,
  password: string
) {

  await this.fillEmail(email);

  await this.fillPassword(password);

  await this.clickLogin();

  // Wait initial redirect
  await this.page.waitForTimeout(10000);

  // Detect DMTT UI load
  const loaded =
    await this.page.locator(
      'text=Environment Configurations'
    ).first().isVisible()
    .catch(() => false);

  // If UI not loaded, refresh once
  if (!loaded) {

    console.log(
      '⚠️ DMTT UI not loaded after login. Refreshing page...'
    );

    await this.page.reload({
      waitUntil: 'domcontentloaded'
    });

    await this.page.waitForTimeout(10000);

  }

}

  async getErrorMessage() {
    // Wait for error message to appear - robust approach.
    // Some builds only show the text under kc validation, so broaden wait slightly.
    try {
      await this.page.waitForSelector(
        '#error-message, .error-message, [class*="error"], [id*="error"], .pf-v5-c-form__helper-text',
        { state: 'visible', timeout: 8000 } 
      );

      const errorLocator = this.page.locator(
        'text=/Please specify|Invalid username or password|invalid|captcha is required|Captcha is required/i'
      );

      if (await errorLocator.first().isVisible({ timeout: 3000 })) {
        return (await errorLocator.first().textContent()) || '';
      }

      const errorContainer = this.page.locator(
        '#error-message, .error-message, [class*="error"], [id*="error"]'
      ).first();

      if (await errorContainer.isVisible()) {
        return (await errorContainer.textContent()) || '';
      }
    } catch (e) {
      console.log('Error message not found:', e);
    }

    return '';
  }

  /**
   * DMTT success indicator is not consistent across builds.
   * Use "Environment Configurations" heading/text as the stable signal.
   */
  async isSuccessMessageVisible(): Promise<boolean> {
    // Give the UI time to fully load after redirect.
    await this.page.waitForTimeout(8000);

    const envHeading = this.page.locator('text=Environment Configurations').first();
    if (await envHeading.isVisible().catch(() => false)) return true;

    // Fallback: verify we are no longer on login form.
    const usernameStillVisible = await this.page.locator('#username').isVisible().catch(() => false);
    return !usernameStillVisible;
  }

}

