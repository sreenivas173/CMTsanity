import { Page, expect } from '@playwright/test';

export interface FilterConfig {
  type: string;
  value: string;
  operator: string;
  column?: string;
}

export interface UploadOptions {
  generateReports?: boolean;
  generateMeta?: boolean;
  generateScripts?: boolean;
}

export class DBLPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ========================================
  // LOCATORS - Getter Methods
  // ========================================

  get table() {
    return this.page.getByRole('table');
  }

  get searchInput() {
    return this.page.getByRole('textbox', { name: 'Search' });
  }

  get filtersButton() {
    return this.page.locator('button.ux-react-table-new__filters');
  }

  get filterDialog() {
    return this.page.getByRole('dialog', { name: /filters/i });
  }

  get paginationInfo() {
    return this.page.locator('text=/\\d+ items, \\d+-\\d+ shown/');
  }

  get uploadButton() {
    return this.page.getByRole('button', { name: 'Upload File' });
  }

  get uploadDialog() {
    return this.page.getByRole('dialog');
  }

  get downloadButton() {
    return this.page.getByRole('button', { name: 'Download ZIP' });
  }

  get paginationContainer() {
    return this.page.locator('ul').filter({ hasText: /items,/ });
  }

  // ========================================
  // Navigation Methods
  // ========================================

  async navigateToDBLDesign() {
    await this.page.getByRole('menuitem', { name: 'DB Level Design' }).click();
    await this.page.waitForTimeout(2000);
    // Move mouse away to avoid tooltip overlay
    await this.page.mouse.move(0, 0);
  }

  async navigateViaText() {
    await this.page.click('text=DB Level Design');
    await this.page.waitForTimeout(2000);
  }

  async isPage404() {
    return await this.page.locator('text=The page cannot be found').isVisible();
  }

  // ========================================
  // Search & Refresh Methods
  // ========================================

  async getRefreshButton() {
    return this.searchInput.locator('..').getByRole('button');
  }

  async searchFor(text: string) {
    await expect(this.searchInput).toBeVisible();
    await this.searchInput.fill(text);
    await this.page.waitForTimeout(3000);
  }

  async clickRefresh() {
    const refreshButton = await this.getRefreshButton();
    await refreshButton.click();
    // Wait for table to reload
    await expect(this.table).toBeVisible();
  }

  // ========================================
  // Table Operations
  // ========================================

  async isTableVisible(): Promise<boolean> {
    try {
      await expect(this.table).toBeVisible();
      return true;
    } catch {
      return false;
    }
  }

  async getRowCount(): Promise<number> {
    const rows = this.table.getByRole('row');
    return await rows.count();
  }

  async getPaginationText(): Promise<string> {
    await expect(this.paginationInfo).toBeVisible();
    return await this.paginationInfo.textContent() || '';
  }

  async getTotalItems(): Promise<number> {
    const text = await this.getPaginationText();
    const match = text.match(/(\d+) items/);
    return match ? Number(match[1]) : 0;
  }

  // ========================================
  // Filter Methods
  // ========================================

  async openFilterDialog() {
    // Ensure no dialog is open
    await expect(this.page.getByRole('dialog')).toHaveCount(0);
    
    await expect(this.filtersButton).toBeVisible();
    await expect(this.filtersButton).toBeEnabled();
    await this.filtersButton.click();
    
    await expect(this.filterDialog).toBeVisible();
  }

  async selectFilterType(type: string) {
    const dialog = this.filterDialog;
    
    const labelSelect = dialog
      .locator('div:has(> div > div > [role="combobox"])')
      .first();
    
    await expect(labelSelect).toBeVisible();
    await labelSelect.click();
    await this.page.getByRole('option', { name: type }).click();
  }

  async selectOperator(operator: string) {
    const dialog = this.filterDialog;
    
    const operatorSelect = dialog
      .locator('div:has(> div > div > [role="combobox"])')
      .nth(1);
    
    await expect(operatorSelect).toBeVisible();
    await operatorSelect.click();
    await this.page.getByRole('option', { name: operator }).click();
  }

  async enterFilterValue(value: string) {
    const dialog = this.filterDialog;
    const filterInput = dialog.getByRole('textbox').last();
    await expect(filterInput).toBeVisible();
    await filterInput.fill(value);
  }

  async applyFilter() {
    const dialog = this.filterDialog;
    await dialog.getByRole('button', { name: 'Apply' }).click();
    await this.page.waitForTimeout(1000);
  }

  async applyFilterWithConfig(config: FilterConfig) {
    await this.openFilterDialog();
    await this.selectFilterType(config.type);
    await this.selectOperator(config.operator);
    await this.enterFilterValue(config.value);
    
    const oldPaginationText = await this.getPaginationText();
    await this.applyFilter();
    
    // Wait for pagination to update
    await expect(this.paginationInfo).not.toHaveText(oldPaginationText);
  }

  async clearFilters() {
    await this.openFilterDialog();
    await this.filterDialog.getByRole('button', { name: 'Clear All' }).click();
    await this.filterDialog.getByRole('button', { name: 'Apply' }).click();
    
    // Wait for reset
    await expect(this.paginationInfo).toHaveText(/^\d+ items, 1-\d+ shown$/);
  }

  async getFilteredColumnCells(columnId: string) {
    return this.page.locator(
      `.ux-react-table-new__cell[data-column-id="${columnId}"]`
    );
  }

  // ========================================
  // Upload Methods
  // ========================================

  async openUploadDialog() {
    await expect(this.uploadButton).toBeVisible();
    await expect(this.uploadButton).toBeEnabled();
    await this.uploadButton.click();
    await expect(this.uploadDialog).toBeVisible();
    await expect(this.uploadDialog).toContainText('Upload Design File');
  }

  async uploadFile(filePath: string) {
    const fileInput = this.uploadDialog.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    // Wait for file to be uploaded
    await this.page.waitForTimeout(1500);
  }

  async selectGenerateReports(checked: boolean = true) {
    const checkbox = this.uploadDialog.getByRole('checkbox', { name: 'Generate Reports' });
    if (checked) {
      await checkbox.check();
    } else {
      await checkbox.uncheck();
    }
  }

  async selectGenerateMeta(checked: boolean = true) {
    const checkbox = this.uploadDialog.getByRole('checkbox', { name: 'Generate Meta' });
    if (checked) {
      await checkbox.check();
    } else {
      await checkbox.uncheck();
    }
  }

  async selectGenerateScripts(checked: boolean = true) {
    const radio = this.uploadDialog.getByRole('radio', { name: 'Generate Scripts', exact: true });
    if (checked) {
      await radio.check();
    }
  }

  async selectAllUploadOptions(options: UploadOptions) {
    if (options.generateReports !== undefined) {
      await this.selectGenerateReports(options.generateReports);
    }
    if (options.generateMeta !== undefined) {
      await this.selectGenerateMeta(options.generateMeta);
    }
    if (options.generateScripts !== undefined) {
      await this.selectGenerateScripts(options.generateScripts);
    }
  }

  async clickProceed() {
    const proceedButton = this.uploadDialog.getByRole('button', { name: 'Proceed' });
    await expect(proceedButton).toBeEnabled();
    await proceedButton.click();
    await expect(this.uploadDialog).toBeHidden();
  }

  async uploadDesignFile(filePath: string, options?: UploadOptions) {
    await this.openUploadDialog();
    await this.uploadFile(filePath);
    
    if (options) {
      await this.selectAllUploadOptions(options);
    }
    
    await this.clickProceed();
    
    // Validate table refresh
    await expect(this.paginationInfo).toBeVisible();
  }

  // ========================================
  // Download Methods
  // ========================================

  async selectFileRow(fileExtension: string) {
    const fileRow = this.table
      .getByRole('row')
      .filter({
        has: this.page.getByRole('gridcell', { name: new RegExp(fileExtension) })
      })
      .first();

    await expect(fileRow).toBeVisible();
    await fileRow.click();
  }

  async clickDownloadButton() {
    await expect(this.downloadButton).toBeVisible();
    await expect(this.downloadButton).toBeEnabled();
    
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.downloadButton.click()
    ]);
    
    return download;
  }

  async downloadFile(fileExtension: string = '\\.xlsx$') {
    await this.selectFileRow(fileExtension);
    await expect(this.downloadButton).toBeVisible({ timeout: 10000 });
    return await this.clickDownloadButton();
  }

  // ========================================
  // Pagination Methods
  // ========================================

  // async goToPage(pageNumber: number) {
  //   const pageButton = this.paginationContainer.getByRole('listitem', { name: String(pageNumber) });
    
  //   // Check if page button exists
  //   const count = await pageButton.count();
  //   if (count === 0) {
  //     return false;
  //   }
    
  //   await pageButton.click({ force: true });
  //   return true;
  // }

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
    const pageSizeMatch = pageSizeText?.match(/(\d+)/);
    const pageSize = pageSizeMatch ? Number(pageSizeMatch[1]) : 10;

    const expectedStart = (pageNumber - 1) * pageSize + 1;

    // Wait for pagination text to reflect new page
    await expect.poll(async () => {
      const { start } = await this.getCurrentPageRange();
      return start === expectedStart;
    }, { timeout: 10000 }).toBeTruthy();
    
    return true;
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

  async clickPreviousArrow() {
    const prevArrow = this.paginationContainer.locator('li.ux-react-pagination-prev');
    
    await expect(prevArrow).toBeVisible();
    
    // Check if disabled
    const isDisabled = await prevArrow.getAttribute('aria-disabled');
    if (isDisabled === 'true') {
      return false;
    }
    
    // Click and wait for table to reload first
    await prevArrow.click({ force: true });
    
    // Wait for valid pagination data to appear (not 0 items)
    await expect.poll(async () => {
      const text = await this.getPaginationText();
      const match = text.match(/(\d+) items/);
      const totalItems = match ? Number(match[1]) : 0;
      return totalItems > 0;
    }, { timeout: 10000 }).toBeTruthy();
    
    // Additional wait for pagination to stabilize
    await this.page.waitForTimeout(500);
    
    return true;
  }

  async getPageCount(): Promise<number> {
    const pageNumbers = this.paginationContainer.locator('li').filter({ hasText: /^\d+$/ });
    return await pageNumbers.count();
  }

  async isNextArrowDisabled(): Promise<boolean> {
    const nextArrow = this.paginationContainer.locator('li.ux-react-pagination-next');
    const isDisabled = await nextArrow.getAttribute('aria-disabled');
    return isDisabled === 'true';
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

  async getCurrentPageRange(): Promise<{ start: number; end: number }> {
    const text = await this.getPaginationText();
    // Handle both normal cases like "10 items, 1-10 shown" and edge case "0 items, 0-0 shown"
    const match = text.match(/(\d+)-(\d+) shown/);
    if (match) {
      return {
        start: Number(match[1]),
        end: Number(match[2])
      };
    }
    // If no match, return default values indicating invalid state
    return { start: 0, end: 0 };
  }

  // ========================================
  // Filter by ID (specific method from 07 test)
  // ========================================

  async filterByIdContains(idText: string) {
    const table = this.table;
    await expect(table).toBeVisible();

    // Locate toolbar container that has Search textbox
    const searchInput = this.page.getByRole('textbox', { name: 'Search' });
    const toolbar = this.page.locator('div').filter({
      has: searchInput
    });

    // Find filter button (exclude Upload File)
    const filterButton = toolbar
      .getByRole('button')
      .filter({ hasNotText: 'Upload File' })
      .last();

    await expect(filterButton).toBeVisible();
    await expect(filterButton).toBeEnabled();
    await filterButton.click();

    // Select filter field - Design File
    const firstSelect = this.page.locator('.ux-react-select__control').first();
    await expect(firstSelect).toBeVisible();
    await firstSelect.click();
    await this.page.locator('.ux-react-select__option', { hasText: 'Design File' }).click();

    // Select operator - contains
    const secondSelect = this.page.locator('.ux-react-select__control').nth(1);
    await secondSelect.click();
    await this.page.locator('.ux-react-select__option', { hasText: 'contains' }).click();

    // Enter filter value
    await this.page.getByRole('textbox', { name: 'Value' }).fill(idText);
    await this.page.getByRole('button', { name: 'Apply' }).click();

    // Validate filtered results
    await expect(table.getByRole('row').nth(1)).toBeVisible();
  }

  async validateFilteredColumnContains(columnCell: any, value: string) {
    const count = await columnCell.count();
    for (let i = 0; i < count; i++) {
      const text = await columnCell.nth(i).textContent();
      expect(text?.toLowerCase()).toContain(value.toLowerCase());
    }
  }

  async validateFilteredColumnIs(columnCell: any, value: string) {
    const count = await columnCell.count();
    for (let i = 0; i < count; i++) {
      const text = await columnCell.nth(i).textContent();
      expect(text?.trim()).toBe(value);
    }
  }
}
