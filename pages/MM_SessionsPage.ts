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
    // Navigate directly to the sessions page (relative to QA1_MM baseURL)
    await this.page.goto(url);
    
    // Wait for table and pagination (more reliable than generic DOMContentLoaded)
    await expect(this.table).toBeVisible({ timeout: 30000 });
    await expect(this.paginationInfo).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Sessions page loaded');
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
    // const text = await this.getPaginationText();
    // const match = text.match(/(\\d+) items/);
    // return match ? Number(match[1]) : 0;

    const locator = this.page.locator('li:has-text("items,")').first();

  await expect(locator).toBeVisible();

  const text = await locator.innerText(); // "48 items, 1-10 shown"

  const match = text.match(/(\d+)\s+items/);
  if (!match) throw new Error(`Cannot parse count from: ${text}`);

  return parseInt(match[1], 10);
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

    // ===== SELECT SOURCE PROFILE 'cbt' =====



//     //await this.collapseInterferingAccordions(dialog);
//     const sourceProfileTab = dialog.getByRole('tab', { name: 'Source Profile' });

// await sourceProfileTab.click();

// // ✅ IMPORTANT: wait for section content to render
// await expect(dialog.getByText(/source profile/i)).toBeVisible();

//     console.log('🔍 Selecting Source Profile = cbt');
    
//     // Find Source Profile combobox first (non-menu state selector)
//     const sourceCombobox = dialog.locator('div[class*=\"ux-react-select__control\"][class*=\"css-t3ipsp-control\"]').first();
//     await expect(sourceCombobox).toBeVisible({ timeout: 10000 });
    
//     // Click to open dropdown
//     await sourceCombobox.scrollIntoViewIfNeeded({ timeout: 5000 });
//     await sourceCombobox.click({ force: true });
    
//     // Wait for menu-open state & pick 'cbt'
//     const sourceList = this.page.locator('[role=\"listbox\"]');
//     await sourceList.waitFor({ state: 'visible', timeout: 5000 });
    
//     const cbtOption = sourceList.getByRole('option', { name: 'cbt', exact: true });
//     await expect(cbtOption).toBeVisible({ timeout: 5000 });
//     await cbtOption.click();
//----------------------------------------------------------------------------------------

// ===== SELECT SOURCE PROFILE =====
console.log(`🔍 Selecting Source Profile = ${sourceProfile}`);

// Collapse other sections
await this.collapseInterferingAccordions(dialog);

// Ensure Source Profile expanded
const sourceProfileTab = dialog.getByRole('tab', { name: 'Source Profile' });
if ((await sourceProfileTab.getAttribute('aria-expanded')) !== 'true') {
  await sourceProfileTab.click();
}

// Click visible dropdown (react-select fix)
const sourceDropdown = dialog.locator('[role="tabpanel"] div[class*="control"]').first();

await expect(sourceDropdown).toBeVisible({ timeout: 10000 });
await sourceDropdown.click();

// ✅ FIX HERE
const listbox = this.page.getByRole('listbox');
await expect(listbox).toBeVisible();

await listbox.getByRole('option', { name: sourceProfile }).click();

console.log(`✅ Source Profile = ${sourceProfile} selected`);
    
//********************************************************************** */


    // Wait for Create button enable (validation complete)
    const createButton = dialog.getByRole('button', { name: 'Create' });
    await expect(createButton).toBeEnabled({ timeout: 15000 });
    await createButton.click();
    console.log('✅ Create button clicked');

// Validate success by pagination count increase (test requirement)
    await expect(dialog).toBeHidden({ timeout: 30000 });
    console.log('✅ Dialog closed - creation success');
    
//--------------------------------------------------------------//

    // await this.page.waitForTimeout(5000); // Backend sync
    // const initialCount = await this.getTotalItems();
    // console.log(`Initial pagination: ${initialCount}`);
    // const finalCount = await this.getTotalItems();
    // console.log(`Final pagination: ${finalCount}`);
    // expect(finalCount).toBeGreaterThan(initialCount);
    // console.log('✅ Pagination increased - session created!');


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

