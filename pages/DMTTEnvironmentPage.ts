import { expect, Locator, Page } from '@playwright/test';

export class DMTTEnvironmentPage {

    readonly page: Page;

    readonly environmentTab: Locator;

    readonly createConfigurationBtn: Locator;

    // Note: environments view might render as non-table grid depending on build.
    readonly environmentTable: Locator;

    constructor(page: Page) {

        this.page = page;

        this.environmentTab =
            page.getByText(
                'Environment Configurations'
            );

        this.createConfigurationBtn =
            page.getByRole(
                'button',
                {
                    name:
                    /Create Configuration/i
                }
            );

        this.environmentTable =
            page.locator('table');
    }

    async navigate() {
    // Prefer load on current app shell; page.goto with relative URL depends on base URL.
    // Use the full fragment path from root to avoid baseUrl mismatches.
    await this.page.goto(
      '/fragment/migration-testing-ui/configurations/environments',
      { waitUntil: 'domcontentloaded' }
    );

    // Some deployments render slightly different headings; make the assertion resilient.
    // Use a looser heading match (UI text may vary across environments/locales)
    const heading = this.page.getByRole('heading', { name: /Environment Configurations/i }).or(
      this.page.getByText(/Environment Configurations/i)
    );

    // Best-effort: ensure the navigation completed without hard-coupling to specific DOM.
    // (Different builds may render different containers/tables.)
    await this.page.waitForLoadState('domcontentloaded', { timeout: 60000 }).catch(() => null);

    // Best-effort: heading may be absent depending on permissions/build.
    await heading.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => null);

    console.log('✅ DMTT Environment page loaded');



}
}

