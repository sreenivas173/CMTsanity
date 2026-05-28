import { Page } from '@playwright/test';

export class DMTT_LoginPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {

  await this.page.goto(
    'https://cdn-edge-service-qa1.cloudmt.managed.netcracker.cloud/fragment/migration-testing-ui/configurations/environments',
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

  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickLogin();
  }

  async getErrorMessage() {
    // Wait for error message to appear - robust approach
    try {
      await this.page.waitForSelector(
        '#error-message, .error-message, [class*="error"], [id*="error"]',
        { state: 'visible', timeout: 5000 }
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

  async isSuccessMessageVisible() {
    // DMTT post-login may take longer than MM and label might differ.
    await this.page.waitForTimeout(8000);

    const dashboardLocators = [
      'text=MIGRATION HUB',
      'text=Migration Hub',
      'text=MIGRATION',
      'text=HUB',
      'text=Configurations',
      'text=Sessions',
      'text=Environment'
    ];

    for (const loc of dashboardLocators) {
      if (await this.page.locator(loc).first().isVisible({ timeout: 8000 }).catch(() => false)) {
        return true;
      }
    }

    // Last resort: ensure page is no longer on login form.
    // (kc-login stays on auth page; if we navigate away, success is likely.)
    const usernameStillVisible = await this.page.locator('#username').isVisible().catch(() => false);
    if (!usernameStillVisible) return true;

    return false;
  }


}

