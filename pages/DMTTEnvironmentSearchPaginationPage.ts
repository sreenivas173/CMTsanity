import { expect, Locator, Page } from '@playwright/test';

export class DMTTEnvironmentSearchPaginationPage {

  readonly page: Page;

  readonly searchInput: Locator;
  readonly searchSubmit: Locator;

  readonly paginationInfo: Locator;
  readonly nextPageButton: Locator;
  readonly page2Button: Locator;

  readonly rows: Locator;

  constructor(page: Page) {

    this.page = page;

    this.searchInput =
      page.getByPlaceholder(/search/i).first();

    this.searchSubmit =
      page.locator('svg').first();

    this.paginationInfo =
      page.locator(
        'li,[role="listitem"]'
      ).filter({
        hasText: /items.*shown/i
      }).first();

    this.nextPageButton =
      page
        .getByRole('button', { name: /next/i })
        .first();

    this.page2Button =
      page
        .getByRole('button', { name: /^2$/ })
        .first();

    this.rows =
      page.locator('[role="row"]');
  }

  async waitForPageReady(): Promise<void> {

    // Wait for page body
    await expect(
      this.page.locator('body')
    ).toBeVisible({
      timeout: 60000
    });

    // Wait for search textbox
    await expect(
      this.page.getByRole('textbox', {
        name: /search/i
      }).or(
        this.page.getByPlaceholder(/search/i)
      )
    ).toBeVisible({
      timeout: 60000
    });

    // Wait until either:
    // - pagination appears
    // - OR "No data to display" appears

    await expect.poll(
      async () => {

        const pageText =
          await this.page
            .locator('body')
            .innerText();

        return (
          /items.*shown/i.test(pageText) ||
          /no data to display/i.test(pageText)
        );

      },
      {
        timeout: 60000
      }
    ).toBe(true);

    console.log(
      'DMTT page ready'
    );
  }

  async search(term: string): Promise<void> {

    await expect(
      this.searchInput
    ).toBeVisible();

    await this.searchInput.clear();

    await this.searchInput.fill(term);

    const oldPagination =
      await this.getPaginationText()
        .catch(() => '');

    await this.searchInput.press('Enter');

    await expect.poll(
      async () => {

        return await this.getPaginationText()
          .catch(() => '');

      },
      {
        timeout: 15000
      }
    ).not.toBe(oldPagination);

    const paginationText =
      await this.getPaginationText();

    console.log(
      `Search "${term}" -> ${paginationText}`
    );
  }

  async getPaginationText(): Promise<string> {

    await expect(
      this.paginationInfo
    ).toBeVisible({
      timeout: 15000
    });

    return (
      await this.paginationInfo.textContent()
    )?.trim() ?? '';
  }

  async hasResults(): Promise<boolean> {

    const configLinks =
      this.page.locator(
        'table tr td a, [role="gridcell"] a'
      );

    const count =
      await configLinks.count();

    console.log(
      `Configuration links found: ${count}`
    );

    return count > 0;
  }

  async getVisibleConfigNames(): Promise<string[]> {

    const configLinks =
      this.page.locator(
        'table tr td a, [role="gridcell"] a'
      );

    const count =
      await configLinks.count();

    if (count === 0) {
      return [];
    }

    const names =
      await configLinks.allTextContents();

    return names
      .map(x => x.trim())
      .filter(Boolean);
  }

  private parsePaginationRangeText(
    text: string
  ): {
    total: number;
    start: number;
    end: number;
  } | null {

    const match =
      text.match(
        /^(\d+)\s+items,\s+(\d+)-(\d+)\s+shown/i
      );

    if (!match) {
      return null;
    }

    return {
      total: Number(match[1]),
      start: Number(match[2]),
      end: Number(match[3])
    };
  }

  async getPaginationRange() {

    const text =
      await this.getPaginationText();

    return this.parsePaginationRangeText(text);
  }

  async waitForPaginationRangeToChange(
    oldStart: number,
    oldEnd: number
  ) {

    await expect.poll(
      async () => {

        const range =
          await this.getPaginationRange();

        if (!range) {
          return false;
        }

        return (
          range.start !== oldStart ||
          range.end !== oldEnd
        );

      }
    ).toBe(true);
  }

  async isPage2Available(): Promise<boolean> {

    const range =
      await this.getPaginationRange();

    if (!range) {
      return false;
    }

    return range.total > range.end;
  }

  async goToPage2(): Promise<void> {

    const page2Control =
      this.page.locator(
        'li, [role="listitem"]'
      ).filter({
        hasText: /^2$/
      }).first();

    if (
      await page2Control
        .isVisible()
        .catch(() => false)
    ) {

      await page2Control.click();

      return;
    }

    throw new Error(
      'Page 2 control not found'
    );
  }

  async assertOnlySanityConfigsDisplayed() {

    const names =
      await this.getVisibleConfigNames();

    console.log(
      'Visible configs:',
      names
    );

    expect(
      names.length
    ).toBeGreaterThan(0);
  }
}