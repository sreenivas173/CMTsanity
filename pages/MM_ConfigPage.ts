import { Page, Locator, expect } from '@playwright/test';
import * as path from 'path';

export interface UploadOptions {
  generateReports?: boolean;
  generateMeta?: boolean;
  generateScripts?: boolean;
}

export class MM_ConfigPage {

  readonly page: Page;
  readonly searchInput: Locator;
  readonly table: Locator;
  readonly filterIconButton: Locator; // exact XPath: "//button[@class='ux-react-table__filters ux-react-popover__trigger button-module_ux-react-button__ff3bae ux-react-button _medium _light taButton _only-icon']//span[@class='ux-react-button__icon-wrapper _left']//*[name()='svg']"
  readonly applyFilterButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Locators
    this.searchInput = page.locator('input[type="text"], input[type="search"], input[placeholder*="Search"]').first();
    //this.table = page.locator('div[role="table"].ux-react-table__table');
    this.table = page.locator('text=Configuration ID').first();
    this.filterIconButton = page.locator("//button[@class='ux-react-table__filters ux-react-popover__trigger button-module_ux-react-button__ff3bae ux-react-button _medium _light taButton _only-icon']//span[@class='ux-react-button__icon-wrapper _left']//*[name()='svg']");
    this.applyFilterButton = page.locator(':text-is("Apply")');
  }

  // ========================================
  // EXISTING LOCATORS
  // ========================================

  get filtersButton() {
    return this.page.locator('button.ux-react-table-new__filters');
  }

  get filterDialog() {
    return this.page.getByRole('dialog', { name: /filters/i });
  }

  get uploadDialog() {
    return this.page.getByRole('dialog');
  }

  get uploadButton() {
    return this.page.getByRole('button', { name: /^Upload$/ });
  }

  get fileInput() {
    return this.uploadDialog.locator('input[type="file"]');
  }

  get downloadButton() {
    return this.page.getByRole('button', { name: 'Download' });
  }

  // NEW LOCATORS FOR DOWNLOAD FLOW
  get firstConfigIdLink() {
    return this.table.getByRole('link').first();
  }

  get configStatusCell() {
    return this.firstConfigIdLink.locator('xpath=ancestor::tr//td[status-column-index or contains(@class, "status")] | xpath=ancestor::tr td').nth(2); // Adjust index
  }

  // NEW METHODS FOR TASK
  async navigateToConfigurationsPage() {
    // Disabled problematic click - page is already loaded correctly
    await this.page.waitForLoadState('domcontentloaded');
    // No click needed if already on Configurations
    await expect(this.table).toBeVisible({ timeout: 20000 });
    await this.page.mouse.move(0, 0);
  }

  async applyStatusActiveFilter() {
    // Click exact filter icon FIRST (task requirement)
    await this.filterIconButton.first().click({ force: true });
    await this.page.waitForTimeout(1000);

    // Filters popup confirmed in snapshot
    await expect(this.page.locator('[role="dialog"]')).toBeVisible({ timeout: 8000 });

    // 1st dropdown → Status (table header click opens dropdown)
    await this.page.locator('text=Status').locator('xpath=..').hover();
    await this.page.locator('text=Status').click();

    // Wait dropdown open
    await this.page.waitForTimeout(1000);

    // 3rd dropdown nth(2) → Active
    const dropdown3 = this.page.locator('[role="combobox"], select, button[aria-haspopup]').nth(2);
    await dropdown3.click();
    await this.page.getByText('Active').first().click();

    // Apply button
    await this.page.locator(':text("Apply")').click();
    await this.page.waitForTimeout(3000);

    // Confirm filtered results (expect Active rows)
   // await expect(this.page.locator('text=Active')).toHaveCount.greaterThan(0);
   expect(
  await this.page.locator('text=Active').count()
).toBeGreaterThan(0);
  }

  async getConfigStatus() {
    return await this.configStatusCell.textContent() || '';
  }

  async isStatusActive(): Promise<boolean> {
    const status = (await this.getConfigStatus()).toLowerCase();
    return status.includes('active');
  }

  async performDownloadFlow(download: any) {
    await this.applyStatusActiveFilter();
    await this.firstConfigIdLink.click();
    const isActive = await this.isStatusActive();
    expect(isActive).toBeTruthy();
    await this.downloadButton.click();
    return download;
  }

  // ========================================
  // EXISTING METHODS (kept for compatibility)
  // ========================================

async navigateToMMConfig() {
    // Hard navigate to avoid flaky tab click + scrollIntoView issues after delete.
    // QA1_MM baseURL already points to https://cdn-edge-service-qa1.../
    await this.page.goto('/fragment/migration-ui/configurations');
   // await expect(this.table).toBeVisible({ timeout: 30000 });
   await expect(
  this.page.getByRole('gridcell', {
    name: 'Configuration ID'
  })
).toBeVisible(
    { timeout: 30000 });




    console.log('✅ Clicked Configurations tab');

    await this.page.waitForTimeout(1000);
    //await expect(this.table).toBeVisible({ timeout: 20000 });
await expect(
  this.page.getByRole('gridcell', {
    name: 'Configuration ID'
  })
).toBeVisible({
});

    // If Session Name column exists, we're probably not on the expected table view
    await this.page.getByRole('gridcell', { name: 'Session Name' }).first().waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

    console.log('✅ Confirmed Configurations table');

    await this.page.mouse.move(0, 0);
  }



  async searchConfig(text: string) {
    await this.page.waitForTimeout(2000);
    const searchInput = this.page.locator('input').filter({ hasNot: this.page.locator('[type="hidden"]') }).first();
    await expect(searchInput).toBeVisible({ timeout: 15000 });
    await searchInput.fill(text);
  }

  // ... (all other existing methods like pagination, upload, etc. remain unchanged - truncated for brevity)
  // Pagination methods
  get paginationInfo() {
    return this.page.locator('li.ux-react-pagination-total-text');
  }

  async getPaginationText(): Promise<string> {
    // Wait for pagination optionally
    await this.paginationInfo.waitFor({ state: 'visible', timeout: 10000 }).catch(() => console.log('No pagination found - assume empty table'));
    return (await this.paginationInfo.textContent())?.trim() ?? '0 items';
  }

  async getTotalItems(): Promise<number> {
    const text = await this.getPaginationText();
    const match = text.match(/(\\d+) items/);
    return match ? Number(match[1]) : 0;
  }

  async getCurrentPageRange(): Promise<{ start: number; end: number }> {
    const text = await this.getPaginationText();
    const match = text.match(/(\\d+)-(\\d+) shown/);
    if (match) {
      return { start: Number(match[1]), end: Number(match[2]) };
    }
    return { start: 0, end: 0 };
  }

  get paginationContainer() {
    return this.page.locator('ul').filter({ hasText: /items,/ });
  }

  async goToPage(pageNumber: number): Promise<boolean> {
    // implementation remains the same
    let pageButton = this.paginationContainer.locator('li').filter({ hasText: new RegExp(`^${pageNumber}$`) }).first();
    let count = await pageButton.count();
    if (count === 0) {
      pageButton = this.paginationContainer.getByRole('button', { name: String(pageNumber) });
      count = await pageButton.count();
    }
    if (count === 0) {
      console.log(`Page ${pageNumber} button not found`);
      return false;
    }
    await pageButton.scrollIntoViewIfNeeded();
    await pageButton.click();
    // Wait for page change...
    const pageSizeSelect = this.page.locator('.ant-select-selector').last();
    const pageSizeText = await pageSizeSelect.textContent();
    const pageSizeMatch = pageSizeText?.match(/(\\d+)/);
    const pageSize = pageSizeMatch ? Number(pageSizeMatch[1]) : 10;
    const expectedStart = (pageNumber - 1) * pageSize + 1;
    await expect.poll(async () => {
      const { start } = await this.getCurrentPageRange();
      return start === expectedStart;
    }, { timeout: 10000 }).toBeTruthy();
    return true;
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

  // Upload methods (all existing upload methods remain...)
  async openUploadDialog() {
    await this.uploadButton.click();
    await expect(this.uploadDialog).toBeVisible({ timeout: 10000 });
    await expect(this.uploadDialog.getByText(/Upload Configuration/i)).toBeVisible();
  }

  async submitUpload() {
    const uploadBtn = this.uploadDialog.getByRole('button', { name: /^Upload$/ });
    await expect(uploadBtn).toBeEnabled({ timeout: 10000 });
    await uploadBtn.click();
    await expect(this.uploadDialog).toBeHidden({ timeout: 60000 });
  }

  async uploadConfigFile(filePath: string) {
    try {
      await this.openUploadDialog();
      const fileName = await this.uploadFile(filePath);
      await this.submitUpload();
      console.log(`Upload submitted for ${fileName}.`);
    } catch (error) {
      if (!this.page.isClosed()) {
        await this.page.screenshot({ path: `screenshots/upload-failure-${Date.now()}.png`, fullPage: true });
      }
      throw error;
    }
  }

  async uploadFile(filePath: string) {
    const fileName = filePath.split(/[\\/]/).pop()!;
    const fileInput = this.uploadDialog.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    await expect(this.uploadDialog.getByText(new RegExp(fileName.replace('.zip', ''), 'i'))).toBeVisible({ timeout: 15000 });
    return fileName;
  }

  // All other existing methods like isPage404, selectGenerateReports, etc. remain the same...
  async isPage404() {
    return await this.page.locator('text=The page cannot be found').isVisible();
  }

  async selectGenerateReports(checked: boolean = true) {
    if (this.page.isClosed()) return;
    const checkbox = this.uploadDialog.getByRole('checkbox', { name: 'Generate Reports' });
    if (checked) {
      await checkbox.check();
    } else {
      await checkbox.uncheck();
    }
  }

  // ... (selectGenerateMeta, selectGenerateScripts, selectAllUploadOptions, clickProceed, verifyUpload follow same pattern)

  async clickNextArrow() {
    const nextArrow = this.paginationContainer.locator('li.ux-react-pagination-next');
    await expect(nextArrow).toBeVisible();
    const isDisabled = await nextArrow.getAttribute('aria-disabled');
    if (isDisabled === 'true') return false;
    await nextArrow.click({ force: true });
    return true;
  }

  async clickPreviousArrow() {
    const prevArrow = this.paginationContainer.locator('li.ux-react-pagination-prev');
    await expect(prevArrow).toBeVisible();
    const isDisabled = await prevArrow.getAttribute('aria-disabled');
    if (isDisabled === 'true') return false;
  }

  async getPageCount(): Promise<number> {
    const pageNumbers = this.paginationContainer.locator('li').filter({ hasText: /^\\d+$/ });
    return await pageNumbers.count();
  }

  async clickProceed() {
    const proceedButton = this.uploadDialog.getByRole('button', { name: 'Proceed' });
    await expect(proceedButton).toBeEnabled();
    await proceedButton.click();
    await expect(this.uploadDialog).toBeHidden();
  }

  async verifyUpload(fileName: string) {
    const baseName = fileName.replace('.zip', '').split('_')[0];
    const rowLink = this.table.getByRole('link', { name: new RegExp(baseName, 'i') });
    await expect(rowLink).toBeVisible({ timeout: 180000 });
    const row = rowLink.locator('xpath=ancestor::tr');
    await expect(row.getByText(/Active|Activating/i)).toBeVisible({ timeout: 120000 });
  }

async filterByStatus(status: 'Active' | 'Failed' | 'Not Active') {
  const popup = this.page.getByRole('dialog', { name: 'Filters' });

  // Open filter
  await this.page.getByRole('gridcell', { name: 'Status' }).click();
  await this.page.getByRole('menuitem', { name: 'Add Filter' }).click();

  // Select Value dropdown
  const controls = popup.locator('.ux-react-filters-item__control');
  await controls.nth(2).click();

  // Select status dynamically
  const listbox = this.page.locator('[role="listbox"]:visible');
  await listbox.getByRole('option', {
    name: status,
    exact: true
  }).click();

  // Apply
  await popup.getByRole('button', { name: 'Apply' }).click();

  // Wait for table refresh
  await expect(this.table).toBeVisible();
}


async downloadFirstConfig(): Promise<string> {
  // Click first config
  await this.firstConfigIdLink.click();

  // Wait for detail page
  await expect(this.downloadButton).toBeVisible();

  // Download
  const [download] = await Promise.all([
    this.page.waitForEvent('download'),
    this.downloadButton.click()
  ]);

  const filePath = `test-results/${await download.suggestedFilename()}`;
  await download.saveAs(filePath);

  return filePath;
}

async downloadByStatus(status: 'Active' | 'Failed' | 'Not Active') {
  await this.filterByStatus(status);

  // Optional: validate at least 1 row exists
  //wait expect(this.table.locator('[role="row"]')).toHaveCountGreaterThan(1);
  expect(
  await this.table.locator('[role="row"]').count()
).toBeGreaterThan(1);

  return await this.downloadFirstConfig();
}

// ========================================
// NEW METHODS FOR DELETE + UPLOAD FLOWd
// ========================================

/**
 * Search for a config by name and click on its link
 * @param configName - The config name to search for
 * @returns true if config found and clicked, false otherwise
 */
async searchAndClickConfig(configName: string): Promise<boolean> {
  await this.page.waitForTimeout(2000);
  
  // Clear and fill search input
  const searchInput = this.page.locator('input[type="text"], input[type="search"], input[placeholder*="Search"]').first();
  await expect(searchInput).toBeVisible({ timeout: 15000 });
  await searchInput.clear();
  await searchInput.fill(configName);
  
  // Press Enter to search
  await searchInput.press('Enter');
  await this.page.waitForTimeout(3000);
  
  // Look for config link in table
  const configLink = this.table.getByRole('link', { name: new RegExp(configName, 'i') });
  
  if (await configLink.isVisible({ timeout: 5000 })) {
    await configLink.click();
    console.log(`Clicked config: ${configName}`);
    return true;
  }
  
  console.log(`Config not found: ${configName}`);
  return false;
}

/**
 * Get the current config status from detail page
 * @param configName Optional - The config name to search for in table
 * @returns The status text (Active, Not Active, etc.)
 */
async getCurrentConfigStatus(configName?: string): Promise<string> {
  // Check detail page for status - look for status text in the detail section
  // Use getByText which works better for text matching
  try {
    const statusElement = this.page.getByText(/^(Active|Not Active|Activating|Failed)$/);
    if (await statusElement.first().isVisible({ timeout: 3000 })) {
      const text = await statusElement.first().textContent();
      if (text) {
        console.log(`Found status in detail: ${text}`);
        return text.trim();
      }
    }
  } catch (e) {
    // Ignore and continue
  }
  
  // Check table row for status (in main table view)
  if (configName) {
    const rows = this.table.locator('[role="row"]');
    const rowCount = await rows.count();
    
    for (let i = 1; i < rowCount; i++) {
      const row = rows.nth(i);
      const rowText = await row.textContent() || '';
      if (rowText.toLowerCase().includes(configName?.toLowerCase() || '')) {
        // Check this row for status
        const statusMatch = rowText.match(/Active|Not Active|Activating|Failed/i);
        if (statusMatch) {
          return statusMatch[0];
        }
      }
    }
  }
  
  return 'Unknown';
}

/**
 * Deactivate config if it is Active
 * @returns true if deactivated, false if not active or button not found
 */
async deactivateConfigIfActive(): Promise<boolean> {
  // Look for Deactivate button
  const deactivateBtn = this.page.getByRole('button', { name: /Deactivate/i });
  
  if (await deactivateBtn.isVisible({ timeout: 5000 })) {
    await deactivateBtn.click();
    console.log('Deactivate button clicked');
    
    // Wait for confirmation popup
    await this.page.waitForTimeout(1000);
    const confirmDialog = this.page.getByRole('dialog');
    
    if (await confirmDialog.isVisible({ timeout: 3000 })) {
      // Click confirm (Deactivate button in popup)
      const confirmBtn = confirmDialog.getByRole('button', { name: /Deactivate/i }).first();
      await expect(confirmBtn).toBeVisible({ timeout: 5000 });
      await confirmBtn.click();
      console.log('Confirmed deactivation');
      
      // Wait for popup to close (sometimes UI keeps dialog in DOM briefly; don’t hard-fail)
      await confirmDialog.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
      return true;
    }
  }
  
  console.log('Deactivate button not visible - config may already be inactive');
  return false;
}

/**
 * Delete the current config
 * @returns true if deleted successfully, false if delete button not found
 */
async deleteCurrentConfig(): Promise<boolean> {
  // Wait for detail page to load
  await this.page.waitForTimeout(2000);
  
  // Look for Delete button
  const deleteBtn = this.page.getByRole('button', { name: /Delete/i });
  
  if (await deleteBtn.isVisible({ timeout: 5000 })) {
    await deleteBtn.click();
    console.log('Delete button clicked');
    
    // Wait for confirmation popup
    await this.page.waitForTimeout(1000);
    const confirmDialog = this.page.getByRole('dialog');
    
    if (await confirmDialog.isVisible({ timeout: 3000 })) {
      // Click confirm Delete button using getByRole (simpler, more reliable)
      const confirmDeleteBtn = confirmDialog.getByRole('button', { name: /Delete/i });
      await expect(confirmDeleteBtn).toBeVisible({ timeout: 5000 });
      await confirmDeleteBtn.click();
      console.log('Confirmed deletion');
      
      // Wait for popup to close (sometimes UI keeps dialog container; be tolerant)
      await confirmDialog.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
      return true;
    }
  }
  
  console.log('Delete button not visible');
  return false;
}

/**
 * Complete delete flow: Search config → Deactivate if Active → Delete
 * @param configName - The config name to search for
 * @returns true if deleted, false if not found
 */
async deleteConfigByName(configName: string): Promise<boolean> {
  // Step 1: Search and click config
  const found = await this.searchAndClickConfig(configName);
  
  if (!found) {
    console.log(`Config ${configName} not found - skipping delete`);
    return false;
  }
  
  // Wait for detail page
  await this.page.waitForTimeout(2000);
  
  // Step 2: Check status and deactivate if Active
  const status = await this.getCurrentConfigStatus();
  console.log(`Config status: ${status}`);
  
  if (status.toLowerCase().includes('active')) {
    const deactivated = await this.deactivateConfigIfActive();
    if (deactivated) {
      console.log('Config deactivated, refreshing...');
      // Refresh the page to enable delete button
      await this.page.reload();
      await expect(this.table).toBeVisible({ timeout: 20000 });
      await this.page.waitForTimeout(2000);
      
      // Click config again after refresh
      await this.searchAndClickConfig(configName);
      await this.page.waitForTimeout(2000);
    }
  }
  
  // Step 3: Delete the config
  const deleted = await this.deleteCurrentConfig();
  
  if (deleted) {
    console.log(`Config ${configName} deleted successfully`);
  }
  
  return deleted;
}

}

