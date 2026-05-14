import { Page, expect } from '@playwright/test';

export class SettingsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ========================================
  // LOCATORS - Getter Methods
  // ========================================

  get settingsContainer() {
    return this.page.locator('div.sc-cmEail.eFiMdx:visible');
  }

  get exportButton() {
    return this.page.locator(':text("Export")');
  }

  get importButton() {
    return this.page.locator(':text("Import")');
  }

  get revertAllButton() {
    return this.page.locator('button:has-text("Revert All")');
  }

  get confirmationPopup() {
    return this.page.locator('.ux-react-popup__header-content.taTitle');
  }

  get yesButton() {
    return this.page.locator('button:has-text("Yes")');
  }

  get statusCells() {
    return this.page.locator('.ux-react-chip__text');
  }

  get uploadDialog() {
    return this.page.getByRole('dialog');
  }

  get uploadButton() {
    return this.uploadDialog.getByRole('button', { name: 'Upload' });
  }

  get editButton() {
    return this.page.getByRole('button', { name: /edit/i });
  }

  get saveButton() {
    return this.uploadDialog.getByRole('button', { name: 'Save' });
  }

  // get tables() {
  //   return this.page.getByRole('table');
  // }

  // get mmTable() {
  //   return this.tables.nth(0);
  // }

  // get dbTable() {
  //   return this.tables.nth(1);
  // }


  get mmSection() {
    return this.page.getByText('MM Design Settings')
      .locator('xpath=ancestor::div[contains(@class,"card") or contains(@class,"section")]')
      .first();
  }

  get dbSection() {
    return this.page.getByText('DB Level Design Settings')
      .locator('xpath=ancestor::div[contains(@class,"card") or contains(@class,"section")]')
      .first();
  }

  get mmTable() {
    return this.page
      .getByText('MM Design Settings')
      .locator('xpath=ancestor::div[contains(@class,"generic")]')
      .locator('table')
      .first();
  }

  get dbTable() {
    return this.page
      .getByText('DB Level Design Settings')
      .locator('xpath=ancestor::div[contains(@class,"generic")]')
      .locator('table')
      .first();
  }
  //✅ Now Keep Your File Extraction Method Simple


  async expectMMSectionVisible() {
    await expect(
      this.page.getByText('MM Design Settings')
    ).toBeVisible();
  }

  async expectDBLevelSectionVisible() {
    await expect(
      this.page.getByText('DB Level Design Settings')
    ).toBeVisible();
  }

  // ========================================
  // Factory Methods - Section Locators
  // ========================================

  mmDesignSection() {
    return this.page.getByText('MM Design Settings');
  }

  dbLevelDesignSection() {
    return this.page.getByText('DB Level Design Settings', { exact: true });
  }

  uploadSettingsButton(section: 'MM' | 'DB') {
    if (section === 'MM') {
      return this.page.getByRole('button', { name: 'Upload Settings' }).first();
    }
    // For DB Level, scope to the specific section
    const dbHeading = this.dbLevelDesignSection();
    return dbHeading
      .locator('xpath=ancestor::div[contains(@class,"card") or contains(@class,"section")]')
      .first()
      .getByRole('button', { name: 'Upload Settings' });
  }

  // ========================================
  // Navigation Methods
  // ========================================

  async navigateToSettings() {
    await this.page.getByRole('menuitem', { name: 'Settings' }).click();
    await expect(
      this.page.getByRole('button', { name: 'Export' })
    ).toBeVisible();
  }

  async isPage404() {
    return await this.page.locator('text=The page cannot be found').isVisible();
  }

  // ========================================
  // Validation Methods
  // ========================================

  async expectSettingsVisible() {
    await expect(
      this.page.getByRole('button', { name: 'Export' })
    ).toBeVisible();
  }

  // async isSettingsVisible(): Promise<boolean> {
  //   try {
  //     await expect(this.page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  //     return true;
  //   } catch {
  //     return false;
  //   }
  // }

  async isExportButtonVisible(): Promise<boolean> {
    try {
      await expect(this.exportButton).toBeVisible();
      return true;
    } catch {
      return false;
    }
  }

  async isImportButtonVisible(): Promise<boolean> {
    try {
      await expect(this.importButton).toBeVisible();
      return true;
    } catch {
      return false;
    }
  }

  async isMMSectionVisible(): Promise<boolean> {
    try {
      await expect(this.page.getByText('MM Design Settings')).toBeVisible();
      return true;
    } catch {
      return false;
    }
  }

  async isDBLevelSectionVisible(): Promise<boolean> {
    try {
      await expect(this.page.getByText('DB Level Design Settings')).toBeVisible();
      return true;
    } catch {
      return false;
    }
  }

  // ========================================
  // Action Methods - Export
  // ========================================

  async clickExport() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.exportButton.click();
    return await downloadPromise;
  }

  // ========================================
  // Action Methods - Import
  // ========================================

  async clickImport(): Promise<void> {
    await this.importButton.click();
  }

  // ========================================
  // Action Methods - Revert All
  // ========================================

  async clickRevertAll(): Promise<void> {
    await this.revertAllButton.click();
  }

  async confirmRevert(): Promise<void> {
    await expect(this.confirmationPopup).toHaveText(
      'Are you sure you want to revert all settings to the default?'
    );
    await this.yesButton.click();
    // Wait for the revert action to complete and status to update
    await this.page.waitForTimeout(2000);
  }

  async getAllStatusTexts(): Promise<string[]> {
    const count = await this.statusCells.count();
    const statuses: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await this.statusCells.nth(i).textContent();
      if (text) {
        statuses.push(text.trim());
      }
    }
    return statuses;
  }

  async areAllStatusDefault(): Promise<boolean> {
    const statuses = await this.getAllStatusTexts();
    return statuses.every(status => status === 'Default');
  }

  // ========================================
  // Upload Methods
  // ========================================

  async uploadSettings(section: 'MM' | 'DB', filePath: string): Promise<void> {
    const uploadBtn = this.uploadSettingsButton(section);
    await uploadBtn.click();

    await expect(this.uploadDialog).toBeVisible();
    await this.uploadDialog.locator('input[type="file"]').setInputFiles(filePath);
    await expect(this.uploadButton).toBeEnabled();
    await this.uploadButton.click();
  }

  async uploadMMSettings(filePath: string): Promise<void> {
    await this.uploadSettings('MM', filePath);
  }

  async uploadDBLevelSettings(filePath: string): Promise<void> {
    await this.uploadSettings('DB', filePath);
  }

  async isUploadSuccessMessageVisible(): Promise<boolean> {
    try {
      await expect(this.page.getByText(/uploaded/i)).toBeVisible();
      return true;
    } catch {
      return false;
    }
  }

  // ========================================
  // Edit Common Parameters Methods
  // ========================================

  async clickEditCommonParams(): Promise<void> {
    await this.editButton.click();
    await expect(this.uploadDialog).toBeVisible();
  }

  async fillDivider(value: string): Promise<void> {
    const dividerInput = this.uploadDialog.getByLabel('DIVIDER');
    await dividerInput.fill(value);
  }

  async fillDatabaseType(value: string): Promise<void> {
    const dbTypeInput = this.uploadDialog.getByLabel('DATABASE_TYPE');
    await dbTypeInput.fill(value);
  }

  async togglePrefixForOutput(enable: boolean): Promise<void> {
    const prefixSwitch = this.uploadDialog.getByRole('switch').nth(0);
    const currentState = await prefixSwitch.getAttribute('aria-checked');
    if ((currentState === 'false' && enable) || (currentState === 'true' && !enable)) {
      await prefixSwitch.click();
    }
  }

  async toggleExtraOutputFiles(enable: boolean): Promise<void> {
    const extraSwitch = this.uploadDialog.getByRole('switch').nth(1);
    const currentState = await extraSwitch.getAttribute('aria-checked');
    if ((currentState === 'false' && enable) || (currentState === 'true' && !enable)) {
      await extraSwitch.click();
    }
  }

  async saveCommonParams(): Promise<void> {
    await this.saveButton.click();
    await expect(this.uploadDialog).toBeHidden();
  }

  async editAndSaveCommonParams(params: {
    divider?: string;
    databaseType?: string;
    prefixForOutput?: boolean;
    extraOutputFiles?: boolean;
  }): Promise<void> {
    await this.clickEditCommonParams();

    if (params.divider !== undefined) {
      await this.fillDivider(params.divider);
    }
    if (params.databaseType !== undefined) {
      await this.fillDatabaseType(params.databaseType);
    }
    if (params.prefixForOutput !== undefined) {
      await this.togglePrefixForOutput(params.prefixForOutput);
    }
    if (params.extraOutputFiles !== undefined) {
      await this.toggleExtraOutputFiles(params.extraOutputFiles);
    }

    await this.saveCommonParams();
  }

  // ========================================
  // File Table Validation Methods
  // ========================================

  // async getTableFileNames(table: 'MM' | 'DB'): Promise<string[]> {
  //   const tableElement = table === 'MM' ? this.mmTable : this.dbTable;
  //   const rows = tableElement.getByRole('row');

  //   const fileNames: string[] = [];
  //   const count = await rows.count();

  //   // Start from index 1 to skip header row
  //   for (let i = 1; i < count; i++) {
  //     const cells = rows.nth(i).getByRole('gridcell');
  //     const cellCount = await cells.count();

  //     if (cellCount >= 2) {
  //       try {
  //         const text = await cells.nth(1).innerText();
  //         if (text && text.trim()) {
  //           fileNames.push(text.trim());
  //         }
  //       } catch (e) {
  //         console.log(`Skipping row ${i}: ${e}`);
  //       }
  //     }
  //   }

  // ========================================
  // Download Methods - Using JS click for visibility issues
  // ========================================

  // async downloadFile(fileName: string, table: 'MM' | 'DB' = 'MM') {
  //   // Scope to specific table
  //   const tableElement = table === 'MM' ? this.mmTable : this.dbTable;

  //   // Use full row filter
  //   const fileRow = tableElement.getByRole('row')
  //     .filter({ has: this.page.getByText(fileName, { exact: true }) });

  //   // Scroll into view and hover
  //   await fileRow.scrollIntoViewIfNeeded();
  //   await fileRow.hover();

  //   // Wait for dropdown trigger to appear after hover
  //   await this.page.waitForTimeout(1500);

  //   // Find dropdown trigger
  //   const dropdownTrigger = tableElement.locator('button.ux-react-dropdown__trigger').first();

  //   // Use JavaScript click to bypass visibility check issues
  //   await dropdownTrigger.evaluate((node: any) => (node as HTMLButtonElement).click());

  //   // Wait for dropdown animation
  //   await this.page.waitForTimeout(500);

  //   const [download] = await Promise.all([
  //     this.page.waitForEvent('download'),
  //     this.page.getByText('Download').click()
  //   ]);

  //   return download;
  // }

 async downloadFile(fileName: string, table: 'MM' | 'DB' = 'MM') {

  const tableElement = table === 'MM'
    ? this.page.getByRole('table').nth(0)
    : this.page.getByRole('table').nth(1);

  await expect(tableElement).toBeVisible();

  // Find row that contains the file
  const fileRow = tableElement
    .getByRole('row')
    .filter({ has: this.page.getByText(fileName, { exact: true }) });

  await expect(fileRow).toBeVisible();

  // Go to the parent wrapper that also contains the dropdown button
  const rowWrapper = fileRow.locator('xpath=..');

  // Hover wrapper (not just row) with retry
  await rowWrapper.hover();
  await this.page.waitForTimeout(1000); // Wait for dropdown to appear

  const dropdownTrigger = rowWrapper.locator('button').first();

  // Retry clicking dropdown trigger if not visible
  let attempts = 0;
  while (attempts < 3) {
    try {
      await expect(dropdownTrigger).toBeVisible({ timeout: 2000 });
      await dropdownTrigger.click({ force: true });
      break;
    } catch {
      attempts++;
      await rowWrapper.hover();
      await this.page.waitForTimeout(500);
    }
  }

  const downloadMenuItem = this.page.getByRole('menuitem', { name: 'Download' });
  await expect(downloadMenuItem).toBeVisible({ timeout: 5000 });

  const [download] = await Promise.all([
    this.page.waitForEvent('download'),
    downloadMenuItem.click()
  ]);

  return download;
}
  // ========================================
  // View Content Methods
  // ========================================

  async viewFileContent(fileName: string, table: 'MM' | 'DB' = 'MM') {
    const tableElement = table === 'MM'
      ? this.page.getByRole('table').nth(0)
      : this.page.getByRole('table').nth(1);

    await expect(tableElement).toBeVisible();

    // Find row that contains the file
    const fileRow = tableElement
      .getByRole('row')
      .filter({ has: this.page.getByText(fileName, { exact: true }) });

    await expect(fileRow).toBeVisible();

    // Go to the parent wrapper that also contains the dropdown button
    const rowWrapper = fileRow.locator('xpath=..');

    // Hover wrapper (not just row) with retry
    await rowWrapper.hover();
    await this.page.waitForTimeout(1000); // Wait for dropdown to appear

    const dropdownTrigger = rowWrapper.locator('button').first();

    // Retry clicking dropdown trigger if not visible
    let attempts = 0;
    while (attempts < 3) {
      try {
        await expect(dropdownTrigger).toBeVisible({ timeout: 2000 });
        await dropdownTrigger.click({ force: true });
        break;
      } catch {
        attempts++;
        await rowWrapper.hover();
        await this.page.waitForTimeout(500);
      }
    }

    const viewContentMenuItem = this.page.getByRole('menuitem', { name: 'View Content' });
    await expect(viewContentMenuItem).toBeVisible({ timeout: 5000 });
    await viewContentMenuItem.click();

    // Wait for the content dialog to appear
    await this.page.waitForTimeout(1000);

    // Return the dialog for validation
    return this.uploadDialog;
  }

  async isContentDialogVisible(): Promise<boolean> {
    try {
      await expect(this.uploadDialog).toBeVisible();
      return true;
    } catch {
      return false;
    }
  }

  async getContentDialogText(): Promise<string> {
    const dialogText = await this.uploadDialog.textContent();
    return dialogText || '';
  }

  // ========================================
// MM / DB File Validation Methods
// ========================================
// ========================================
// MM / DB File Validation Methods
// ========================================

async getTableFileNames(tableIndex: number): Promise<string[]> {
  const table = this.page.getByRole('table').nth(tableIndex);

  await expect(table).toBeVisible();

  // Wait for the table to load
  await this.page.waitForTimeout(1000);

  const rows = table.getByRole('row');
  const rowCount = await rows.count();

  const fileNames: string[] = [];

  // Start from index 1 to skip header row
  for (let i = 1; i < rowCount; i++) {
    const row = rows.nth(i);
    const cells = row.getByRole('gridcell');
    const cellCount = await cells.count();

    if (cellCount >= 2) {
      const text = await cells.nth(1).textContent();
      if (text && text.trim()) {
        fileNames.push(text.trim());
      }
    }
  }

  return fileNames;
}

async validateMMFiles(expectedFiles: string[]) {
  const actualFiles = await this.getTableFileNames(0);
  expect(actualFiles.sort()).toEqual(expectedFiles.sort());
}

async validateDBFiles(expectedFiles: string[]) {
  const actualFiles = await this.getTableFileNames(1);
  expect(actualFiles.sort()).toEqual(expectedFiles.sort());
}

}
