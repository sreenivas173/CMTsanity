import { Page, expect } from '@playwright/test';

export interface FilterConfig {
  type: string;
  value: string;
  operator: string;
  column?: string;
}

export class MMDesignPage {
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

  async navigateToMMDesign() {
    await this.page.getByText('MM Design').click();
    await this.page.waitForTimeout(2000);
    // Move mouse away to avoid tooltip overlay
    await this.page.mouse.move(0, 0);
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
//-------------------------------------------------------
// Note: The "Proceed" button becomes enabled only after the file is fully processed by the server.
// This method waits for the button to be enabled, clicks it, and then waits for the table to refresh by checking that the first row's content has changed.
//------------------------------------------------------- 
  async clickProceed() {
    const proceedButton = this.uploadDialog.getByRole('button', { name: 'Proceed' });

  await expect(proceedButton).toBeEnabled();

  await proceedButton.click();

  // ✅ Wait for dialog to disappear
  await expect(this.uploadDialog).toBeHidden({ timeout: 15000 });

  // Capture current state and poll for new row after upload
  const rows = this.table.getByRole('row');
  await expect.poll(async () => await rows.count()).toBeGreaterThan(1);

  const firstRow = rows.nth(1);
  await expect(firstRow).toBeVisible();

  const oldFirstRow = await firstRow.innerText();
  
  // Additional wait for table refresh if needed
  await this.page.waitForTimeout(3000);

  // ✅ Wait for table refresh (REAL validation)
  await expect(this.table.getByRole('row').nth(1))
    .not.toHaveText(oldFirstRow!, { timeout: 20000 });

  // ✅ Wait for dialog to disappear (optional but useful)
  await expect(this.uploadDialog).toBeHidden({ timeout: 15000 });

  // ✅ Wait for table refresh (REAL validation)
  await expect(this.table.getByRole('row').nth(1))
    .not.toHaveText(oldFirstRow!, { timeout: 20000 });
}
  

  async uploadDesignFile(filePath: string) {
    await this.openUploadDialog();
    await this.uploadFile(filePath);
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

  async selectFirstRow() {
    const firstDataRow = this.table.getByRole('row').nth(1);
    await expect(firstDataRow).toBeVisible();
    await firstDataRow.click();
  }

  // ========================================
  // Pagination Methods
  // ========================================

  async goToPage(pageNumber: number) {
    const pageButton = this.paginationContainer.locator('li.ux-react-pagination-item').filter({ hasText: new RegExp(`^${pageNumber}$`) });

    // Check if page button exists
    const count = await pageButton.count();
    if (count === 0) {
      return false;
    }

    await pageButton.scrollIntoViewIfNeeded();
    await pageButton.click();
    await this.page.waitForTimeout(2000); // Wait for navigation
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
    const items = this.paginationContainer.locator('li');
    const prevArrow = items.nth(1);
    
    await expect(prevArrow).toBeVisible();
    await expect(prevArrow).toBeEnabled();
    
    await prevArrow.click({ force: true });
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
    const match = text.match(/(\d+)-(\d+) shown/);
    return {
      start: match ? Number(match[1]) : 0,
      end: match ? Number(match[2]) : 0
    };
  }

  // ========================================
  // Filter by ID (alternative method)
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

    // Validate table refresh
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
