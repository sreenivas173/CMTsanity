/**
 * @author Srinivasa Rao Allamsetti
 * 
 * D2C Templates Page Test Suite - DBL (Database Level) Templates Validation
 * 
 * This test suite validates the Templates functionality in the D2C application.
 * The Templates page displays configuration templates used for design-to-code migrations.
 * 
 * Test Coverage:
 * - Validates presence of all main subfolders under Templates node
 * - Validates contents of each subfolder (configuration, mistral, nifi, python, queries)
 * - Validates the complete hierarchical structure of the queries folder
 * 
 * Prerequisites:
 * - User must have valid credentials (cpq-admin@netcracker.com / MARket1234!)
 * - Application must be accessible at the QA1 environment URL
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { TemplatesPage } from '../../pages/TemplatesPage';

/**
 * Test Suite: D2C Templates Page Validations
 * 
 * This suite validates the Templates page functionality in the D2C application.
 * The Templates page contains configuration templates organized in a hierarchical folder structure.
 * These templates are used during the design-to-code migration process.
 */
test.describe('D2C Templates page validations', () => {

    // Page Objects - Used for Page Object Model pattern
    let loginPage: LoginPage;
    let templatesPage: TemplatesPage;

    /**
     * beforeEach Hook - Runs before each test case
     * 
     * Purpose:
     * - Initializes page objects
     * - Performs login with valid credentials
     * - Navigates to the Templates page
     * 
     * Validation:
     * - Ensures login is successful by checking URL contains 'design2code'
     * - Skips test if page shows 404 error (application unavailable)
     */
    test.beforeEach(async ({ page }) => {
        // Initialize page objects
        loginPage = new LoginPage(page);
        templatesPage = new TemplatesPage(page);

        // Navigate to login page and perform login
        await loginPage.goto();
        await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
        
        // Validate successful login by checking URL contains 'design2code'
        // This ensures we are redirected to the main application page
        await expect(page).toHaveURL(/design2code\/migration-management-design/);

        // Navigate to the Templates page
        await templatesPage.navigateToTemplates();
    });

    //==========================================================================
    // TEST 1: Validate Templates Subfolders
    //==========================================================================
    
    /**
     * Test: Validate Templates subfolders strictly under Templates node
     * 
     * Purpose:
     * To verify that all expected top-level subfolders exist under the Templates folder.
     * 
     * What it validates:
     * - Presence of 5 main subfolders: configuration, mistral, nifi, python, queries
     * 
     * How it validates:
     * 1. Clicks the 'Expand' button on the Templates row to reveal subfolders
     * 2. Iterates through each expected folder name
     * 3. Uses regex case-insensitive matching to find row elements containing folder names
     * 4. Asserts each folder row is visible on the page
     * 
     * Expected folders:
     * - configuration: Contains configuration YAML files
     * - mistral: Contains Mistral workflow YAML files
     * - nifi: Contains NiFi processor JSON templates
     * - python: Contains Python scripts
     * - queries: Contains SQL query files
     */
    test('@Sanity Validate Templates subfolders strictly under Templates node', async ({ page }) => {

        // Step 1: Click Expand button in templates row to reveal subfolders
        // The Templates folder is collapsed by default, need to expand it
        await page.getByRole('button', { name: 'Expand' }).click();

        // Step 2: Define expected subfolders under Templates
        const expectedFolders = [
            'configuration',
            'mistral',
            'nifi',
            'python',
            'queries'
        ];

        // Step 3: Validate each folder is visible
        // Using case-insensitive regex to match folder names in the table rows
        for (const folder of expectedFolders) {
            await expect(
                page.getByRole('row', { name: new RegExp(folder, 'i') })
            ).toBeVisible();
        }
    });

    //==========================================================================
    // TEST 2: Validate Configuration Folder Contents
    //==========================================================================
    
    /**
     * Test: Validate configuration folder contents
     * 
     * Purpose:
     * To verify that the 'configuration' subfolder contains all expected configuration files.
     * 
     * What it validates:
     * - 4 configuration files are present in the configuration folder
     * 
     * How it validates:
     * 1. Expands the Templates folder (root)
     * 2. Expands the 'configuration' subfolder
     * 3. Checks each expected file is visible in the table
     * 
     * Expected files:
     * - descriptor.yaml: Template descriptor configuration
     * - runtime-parameters.yaml: Runtime parameters for execution
     * - configuration.yaml: Main configuration file
     * - macrones.json: JSON macroses/definitions file
     */
    test('Validate configuration folder contents', async () => {
        // Use TemplatesPage helper method to validate folder contents
        // This method handles expansion and visibility checks automatically
        await templatesPage.validateFolderContents('configuration', [
            'descriptor.yaml',
            'runtime-parameters.yaml',
            'configuration.yaml',
            'macroses.json'
        ]);
    });

    //==========================================================================
    // TEST 3: Validate Mistral Folder Contents
    //==========================================================================
    
    /**
     * Test: Validate mistral folder contents
     * 
     * Purpose:
     * To verify that the 'mistral' subfolder contains all expected Mistral workflow templates.
     * 
     * What it validates:
     * - 5 Mistral workflow YAML files are present
     * 
     * How it validates:
     * 1. Expands the Templates folder (root)
     * 2. Expands the 'mistral' subfolder
     * 3. Checks each expected file is visible in the table
     * 
     * Expected files:
     * - define_variable.yaml: Variable definition workflow
     * - estimation.yaml: Estimation workflow
     * - migration.yaml: Migration workflow
     * - validation_source.yaml: Source validation workflow
     * - batching.yaml: Batching workflow
     */
    test('Validate mistral folder contents', async () => {
        await templatesPage.validateFolderContents('mistral', [
            'define_variable.yaml',
            'estimation.yaml',
            'migration.yaml',
            'validation_source.yaml',
            'batching.yaml'
        ]);
    });

    //==========================================================================
    // TEST 4: Validate NiFi Folder Contents
    //==========================================================================
    
    /**
     * Test: Validate nifi folder contents
     * 
     * Purpose:
     * To verify that the 'nifi' subfolder contains all expected NiFi processor templates.
     * 
     * What it validates:
     * - 7 NiFi JSON template files are present
     * 
     * How it validates:
     * 1. Expands the Templates folder (root)
     * 2. Expands the 'nifi' subfolder
     * 3. Checks each expected file is visible in the table
     * 
     * Expected files:
     * - funnel.json: NiFi Funnel processor template
     * - port.json: NiFi Port processor template
     * - root.json: NiFi Root template
     * - connection.json: NiFi Connection template
     * - merge_content_processor.json: Merge Content processor template
     * - flow_contents.json: Flow Contents template
     * - process_group.json: Process Group template
     */
    test('Validate nifi folder contents', async () => {
        await templatesPage.validateFolderContents('nifi', [
            'funnel.json',
            'port.json',
            'root.json',
            'connection.json',
            'merge_content_processor.json',
            'flow_contents.json',
            'process_group.json'
        ]);
    });

    //==========================================================================
    // TEST 5: Validate Python Folder Contents
    //==========================================================================
    
    /**
     * Test: Validate PYTHON folder contents
     * 
     * Purpose:
     * To verify that the 'python' subfolder contains all expected Python script files.
     * 
     * What it validates:
     * - 2 Python files are present
     * 
     * How it validates:
     * 1. Expands the Templates folder (root)
     * 2. Expands the 'python' subfolder
     * 3. Checks each expected file is visible in the table
     * 
     * Expected files:
     * - requirements.txt: Python dependencies list
     * - cleanup.py: Cleanup script
     */
    test('Validate PYTHON folder contents', async () => {
        await templatesPage.validateFolderContents('python', [
            'requirements.txt',
            'cleanup.py'
        ]);
    });

    //==========================================================================
    // TEST 6: Validate Queries Full Structure
    //==========================================================================
    
    /**
     * Test: Validate queries full structure
     * 
     * Purpose:
     * To verify the complete hierarchical structure of the 'queries' folder,
     * including nested subfolders and all SQL query files.
     * 
     * What it validates:
     * - Complete folder hierarchy: templates > queries > oracle > core
     * - 17 SQL query files are present in the core subfolder
     * 
     * How it validates:
     * 1. Uses recursive tree validation via TemplatesPage.validateTree() method
     * 2. Expands 'templates' folder
     * 3. Expands 'queries' subfolder
     * 4. Expands 'oracle' subfolder
     * 5. Expands 'core' subfolder
     * 6. Validates each SQL file is visible in the table
     * 
     * Expected structure:
     * templates/
     * └── queries/
     *     └── oracle/
     *         └── core/
     *             ├── create_table_transformation.sql
     *             ├── drop_object.sql
     *             ├── exec_immediate.sql
     *             ├── insert.sql
     *             ├── union.sql
     *             ├── create_table.sql
     *             ├── create_table_as.sql
     *             ├── echo_terminator.sql
     *             ├── job_use.sql
     *             ├── prompt.sql
     *             ├── synonym.sql
     *             ├── d2c_flt_entity_keys.sql
     *             ├── d2c_flt_entity_update.sql
     *             ├── d2c_flt_entity_update2.sql
     *             ├── d2c_fallout_report.sql
     *             └── d2c_fallout_report_detail.sql
     * 
     * Note: This is the most comprehensive test as it validates the entire
     * nested folder structure rather than just one level of content.
     */

    // Define the complete queries folder structure for validation
    const queriesStructure = [
        'create_table_transformation.sql',
        'drop_object.sql',
        'exec_immediate.sql',
        'insert.sql',
        'union.sql',
        'create_table.sql',
        'create_table_as.sql',
        'echo_terminator.sql',
        'job_use.sql',
        'prompt.sql',
        'synonym.sql',
        'd2c_flt_entity_keys.sql',
        'd2c_flt_entity_update.sql',
        'd2c_flt_entity_update2.sql',
        'd2c_fallout_report.sql',
        'd2c_fallout_report_detail.sql'
    ];

    test('Validate queries full structure', async () => {

  await templatesPage.expandFolder('templates');
  await templatesPage.expandFolder('queries');
  await templatesPage.expandFolder('postgres');

  const expectedFiles = [
    'd2c_entity_key.sql',
    'd2c_fallout_report_detail.sql',
    'd2c_flt_entity.sql',
    'd2c_flt_entity_keys.sql',
    'd2c_flt_entity_keys_v.sql',
    'd2c_fallout_report.sql',
    'd2c_flt_entity_update.sql',
    'd2c_migration_execution.sql',
    'd2c_migration_initialization.sql',
    'd2c_user_tables.sql',
    'd2c_flt_report_by_table.sql'
  ];

  for (const file of expectedFiles) {
    await expect(
      templatesPage.table.getByRole('row').filter({
        has: templatesPage.page.getByText(file)
      })
    ).toBeVisible({ timeout: 10000 });
  }
});
});
