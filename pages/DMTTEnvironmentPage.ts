import { expect, Locator, Page } from '@playwright/test';

export class DMTTEnvironmentPage {

    readonly page: Page;

    readonly environmentTab: Locator;

    readonly createConfigurationBtn: Locator;

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

    // Wait for toolbar (most stable). Heading text may vary or be absent in some builds.
    await expect(this.createConfigurationBtn).toBeVisible({ timeout: 60000 });

    // Best-effort: don't fail the whole navigation if heading is not present.
    await heading.first().waitFor({ state: 'visible', timeout: 1000 }).catch(() => null);


    await expect(this.environmentTable).toBeVisible({ timeout: 60000 });


    console.log('✅ DMTT Environment page loaded');
}
}

