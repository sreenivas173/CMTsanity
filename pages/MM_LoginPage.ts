import { Page } from '@playwright/test';

export class MM_LoginPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('https://cdn-edge-service-qa1.cloudmt.managed.netcracker.cloud/fragment/migration-ui');
    await this.page.waitForLoadState('networkidle');
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
    // Wait for error message to appear - more robust approach
    try {
      // Wait for either error message selector to be visible
      await this.page.waitForSelector('#error-message, .error-message, [class*="error"], [id*="error"]', { state: 'visible', timeout: 5000 });
      
      // Also try the text-based locator
      const errorLocator = this.page.locator('text=/Please specify|Invalid username or password|invalid/i');
      
      // Check if the error is visible
      if (await errorLocator.first().isVisible({ timeout: 3000 })) {
        return await errorLocator.first().textContent() || '';
      }
      
      // Fallback: get text from error container
      const errorContainer = this.page.locator('#error-message, .error-message, [class*="error"], [id*="error"]').first();
      if (await errorContainer.isVisible()) {
        return await errorContainer.textContent() || '';
      }
    } catch (e) {
      console.log('Error message not found:', e);
    }
    return '';
  }

  async isSuccessMessageVisible() {
    await this.page.waitForTimeout(5000);
    return await this.page.locator('text=MIGRATION HUB').isVisible();
      }


 async navigateToMMSession() {
    await this.page.getByText('Sessions').click();
    await this.page.waitForTimeout(2000);
    // Move mouse away to avoid tooltip overlay
    await this.page.mouse.move(0, 0);
  }

}
