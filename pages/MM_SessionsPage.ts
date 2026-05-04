import { Page, Locator, expect } from '@playwright/test';

export class MM_SessionsPage {

  readonly page: Page;
  readonly searchInput: Locator;
  readonly table: Locator;

  constructor(page: Page) {
    this.page = page;

    // Locators - try multiple strategies to find the search input
    this.searchInput = page.locator('input[type="text"], input[type="search"], input[placeholder*="Search"]').first();
    this.table = page.getByRole('table');
  }

  // Navigate to MM Sessions page
  async navigateToMMSession(url: string = '/fragment/migration-ui/sessions') {
    // Navigate directly to the sessions page
    await this.page.goto(url);

    // Wait for DOM to be loaded (more appropriate for SPAs)
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(3000);

    // Move mouse away to avoid tooltip overlay
    await this.page.mouse.move(0, 0);
  }

  // Search functionality
  async searchSession(text: string) {
    // Wait a bit for the page to load
    await this.page.waitForTimeout(2000);

    // Try to find and fill the search input
    // Use a more flexible approach - find any text input that might be the search
    const searchInput = this.page.locator('input').filter({ hasNot: this.page.locator('[type="hidden"]') }).first();

    await expect(searchInput).toBeVisible({ timeout: 15000 });
    await searchInput.fill(text);
  }

  get paginationInfo() {
    return this.page.locator('text=/\\d+ items/');
  }

  async setPageSize(size: number) {
    const pageSizeSelect = this.page.locator('.ant-select-selector').last();
    await expect(pageSizeSelect).toBeVisible();
    await pageSizeSelect.scrollIntoViewIfNeeded();
    await pageSizeSelect.click();

    const dropdown = this.page.locator('.ant-select-dropdown').last();
    await expect(dropdown).toBeVisible();

    const option = dropdown.locator('.ant-select-item-option', { hasText: `${size} per page` }).first();
    await option.click();
  }

  async getPaginationText(): Promise<string> {
    await expect(this.paginationInfo).toBeVisible({ timeout: 10000 });
    return await this.paginationInfo.textContent() || '';
  }

  async getTotalItems(): Promise<number> {
    const text = await this.getPaginationText();
    const match = text.match(/(\\d+) items/);
    return match ? Number(match[1]) : 0;
  }

  async getCurrentPageRange(): Promise<{ start: number; end: number }> {
    const text = await this.getPaginationText();
    // Handle both normal cases like "10 items, 1-10 shown" and edge case "0 items, 0-0 shown"
    const match = text.match(/(\\d+)-(\\d+) shown/);
    if (match) {
      return {
        start: Number(match[1]),
        end: Number(match[2])
      };
    }
    // If no match, return default values indicating invalid state
    return { start: 0, end: 0 };
  }

  get paginationContainer() {
    return this.page.locator('ul').filter({ hasText: /items,/ });
  }

  async goToPage(pageNumber: number): Promise<boolean> {
    // First try to find exact page button
    let pageButton = this.paginationContainer
      .locator('li')
      .filter({ hasText: new RegExp(`^${pageNumber}$`) })
      .first();

    let count = await pageButton.count();

    // If exact page button not found, try using role button
    if (count === 0) {
      pageButton = this.paginationContainer.getByRole('button', { name: String(pageNumber) });
      count = await pageButton.count();
    }

    // If still not found, return false
    if (count === 0) {
      console.log(`Page ${pageNumber} button not found`);
      return false;
    }

    await pageButton.scrollIntoViewIfNeeded();
    await pageButton.click();

    // Get current page size dynamically from the page size dropdown
    const pageSizeSelect = this.page.locator('.ant-select-selector').last();
    const pageSizeText = await pageSizeSelect.textContent();
    const pageSizeMatch = pageSizeText?.match(/(\\d+)/);
    const pageSize = pageSizeMatch ? Number(pageSizeMatch[1]) : 10;

    const expectedStart = (pageNumber - 1) * pageSize + 1;

    // Wait for pagination text to reflect new page
    await expect.poll(async () => {
      const { start } = await this.getCurrentPageRange();
      return start === expectedStart;
    }, { timeout: 10000 }).toBeTruthy();

    return true;
  }

  async clickPreviousArrow() {
    const prevArrow = this.paginationContainer.locator('li.ux-react-pagination-prev');

    await expect(prevArrow).toBeVisible();

    // Check if disabled
    const isDisabled = await prevArrow.getAttribute('aria-disabled');
    if (isDisabled === 'true') {
      return false;
    }
  }

  async getPageCount(): Promise<number> {
    const pageNumbers = this.paginationContainer.locator('li').filter({ hasText: /^\\d+$/ });
    return await pageNumbers.count();
  }

  async clickNextArrow() {
    const nextArrow = this.paginationContainer.locator('li.ux-react-pagination-next');

    await expect(nextArrow).toBeVisible();

    // Check if disabled
    const isDisabled = await nextArrow.getAttribute('aria-disabled');
    if (isDisabled === 'true') {
      return false;
    }

    await nextArrow.click({ force: true });
    return true;
  }

  async createNewSession(
    name: string,
    config: string,
    description: string,
    sourceProfile: string
  ) {
    console.log('🆕 Creating session:', name);
    
    // Click Create Session
    await this.page.getByText('Create Session').click();

    const dialog = this.page.getByRole('dialog');

    // Wait for dialog
    await expect(dialog).toBeVisible();

    // Fill Name
    await dialog.getByRole('textbox', { name: 'Name *' }).fill(name);

    // Configuration Dropdown
    const configDropdown = dialog.getByRole('combobox', { name: 'Configuration *' });
    await configDropdown.click();

    const configList = this.page.locator('[role="listbox"]');
    await configList.waitFor({ state: 'visible' });

    await configList.getByRole('option', { name: config }).click();

    // Description
    await dialog.getByRole('textbox', { name: 'Description' }).fill(description);

    // Collapse interfering accordions first
    await this.collapseInterferingAccordions(dialog);

    // Source Profile tab first - ensure expanded
    const sourceProfileTab = dialog.getByRole('tab', { name: 'Source Profile' });
    await sourceProfileTab.click({ force: true });
    await this.page.waitForTimeout(1000);

    // Source Profile combobox under tabpanel (exact from snapshot)
    // Direct Source Profile combobox (snapshot shows "oracle *" label, element hidden by CSS)
    console.log('🔍 Source Profile - oracle combobox with viewport handling');
    const sourceCombobox = dialog.getByRole('combobox', { name: /oracle/i }).first();
    await sourceCombobox.scrollIntoViewIfNeeded({ timeout: 5000 });
    await this.page.waitForTimeout(1000);
    await sourceCombobox.click({ 
      force: true, 
      position: { x: 5, y: 5 },
      timeout: 10000 
    });
    console.log('✅ Source combobox clicked');

    // Make listbox wait optional - if not visible, skip selection (already selected default?)
    const sourceList = this.page.locator('[role="listbox"]:visible').first();
    const listboxVisible = await sourceList.isVisible({ timeout: 3000 }).catch(() => false);
    if (listboxVisible) {
      await sourceList.waitFor({ state: 'visible', timeout: 3000 });
      // Select 'cbt' or first
      const cbtOption = sourceList.getByRole('option', { name: 'cbt', exact: true });
      if (await cbtOption.count() > 0) {
        await cbtOption.click();
        console.log('✅ Selected "cbt"');
      } else {
        const firstOption = sourceList.getByRole('option').first();
        await firstOption.click();
        console.log('✅ Selected first SourceProfile (cbt not available)');
      }
    } else {
      console.log('⚠️ Listbox not visible - assuming default selection');
    }

    // Source option selection already done above, remove duplicate

// Wait for Create processing (longer timeout for backend validation)
    await this.page.waitForTimeout(3000);

    // Click Create - single click, then verify success by table row count increase
    const createButton = dialog.getByRole('button', { name: 'Create' });
    await expect(createButton).toBeEnabled({ timeout: 5000 });
    await createButton.click({ force: true });
    console.log('✅ Create button clicked');

    // Poll for session creation success: new row appears in table
    await expect.poll(async () => {
      const initialRowCount = await this.table.locator('tbody tr').count();
      await this.page.waitForTimeout(2000);
      const newRowCount = await this.table.locator('tbody tr').count();
      return newRowCount > initialRowCount;
    }, { timeout: 60000 }).toBeTruthy();
    console.log('✅ New session row appeared in table');
  }

  /**
   * Collapse accordion tabs that might intercept clicks on dropdowns in dialog
   * Targets expanded sections from page snapshot to prevent pointer-events blocking
   */
  public async collapseInterferingAccordions(dialog: Locator): Promise<void> {
    console.log('🔄 Collapsing interfering accordions...');
    const accordionTabs = [
      { name: 'Pre-Post Actions Activations' },
      { name: 'Session Mode' },
      { name: 'Parameters' }
    ];

    // First expand Source Profile tab if collapsed
    const sourceProfileTab = dialog.getByRole('tab', { name: 'Source Profile' });
    await sourceProfileTab.click({ force: true });
    await this.page.waitForTimeout(500);

    for (const tabInfo of accordionTabs) {
      const tab = dialog.getByRole('tab', { name: tabInfo.name });
      if (await tab.isVisible()) {
        const ariaExpanded = await tab.getAttribute('aria-expanded');
        if (ariaExpanded === 'true') {
          await tab.scrollIntoViewIfNeeded();
          await tab.click({ force: true });
          await this.page.waitForTimeout(300);
        }
      }
    }
  }
}

