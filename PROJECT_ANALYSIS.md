# D2C Automation Project Framework Analysis

## 1. Project Framework

This is a **Playwright-based Test Automation Framework** written in **TypeScript** for testing the "Migration Design2Code" (D2C) web application - a cloud migration tool from Netcracker.

**Technology Stack:**
- **Test Runner:** Playwright v1.58.2
- **Language:** TypeScript
- **CI/CD:** Jenkins
- **Browser:** Chromium (Chrome)

---

## 2. Project Tree Structure

```
D2C_Auto/
├── Jenkinsfile                     # Jenkins CI/CD pipeline
├── package.json                    # NPM dependencies
├── playwright.config.ts           # Playwright configuration
├── TODO.md                        # Task tracking
│
├── pages/                         # Page Object Model (POM) - 5 files
│   ├── LoginPage.ts              # Login page actions & locators
│   ├── DBLPage.ts                # DB Level Design page (~300+ lines)
│   ├── MMDesignPage.ts           # MM Design page
│   ├── SettingsPage.ts           # Settings page
│   └── TemplatesPage.ts          # Templates page
│
├── tests/                         # Test specifications - 15 files
│   ├── 01_D2C_login.spec.ts      # Login validation tests
│   ├── 02_D2C_mmFilter-id.spec.ts
│   ├── 03_D2C_mm-design.spec.ts
│   ├── 04_D2C_mmDesignUpload_val.spec.ts
│   ├── 05_D2C_mmDesignDownload_val.spec.ts
│   ├── 06_D2C_mmPagination.spec.ts
│   ├── 07_D2C_DBLdesign.spec.ts
│   ├── 08_D2C_DBL_Filter_val.spec.ts
│   ├── 09_D2C_DBL_DesignUpload_val.spec.ts
│   ├── 10_D2C_DBL_DesignDownload_val1.spec.ts
│   ├── 11_D2C_DBL_Pagination.spec.ts
│   ├── 12_D2C_Settings.spec.ts
│   ├── 13_D2C_Settings_File_ViewDownload.spec.ts
│   ├── 14_D2C_Templates.spec.ts
│   └── 15_D2C_Template_config_download.spec.ts
│
├── playwright-report/             # HTML test reports (timestamped)
├── test-results/                  # Test execution results
├── screenshots/                   # Failure screenshots
├── downloads/                     # Downloaded test files
│   ├── descriptor.yaml
│   ├── excel-migration-dictionary.json
│   └── fallout-rules.json
└── color-changer-app/            # Utility app
    └── index.html
```

---

## 3. Key Advantages

| Advantage | Description |
|-----------|-------------|
| **POM Pattern** | Clean separation between test logic and page interactions - reusable methods in pages/ directory |
| **Comprehensive Coverage** | 15 test scenarios covering login, upload/download, filters, pagination, settings, templates |
| **TypeScript Support** | Type safety and better IDE autocomplete with interfaces like FilterConfig, UploadOptions |
| **CI/CD Integration** | Jenkins pipeline with automated build, test, report generation, and email notifications |
| **Detailed Page Objects** | DBLPage.ts has ~300+ lines covering navigation, search, filters, upload/download, pagination |
| **Sequential Execution** | Tests run in order (01-15) for predictable results with workers: 1 |

---

## 4. Detailed Page Objects

### LoginPage.ts
- Methods: goto(), fillEmail(), fillPassword(), clickLogin(), login(), getErrorMessage(), isSuccessMessageVisible()

### DBLPage.ts (Most Comprehensive)
- Navigation: navigateToDBLDesign(), navigateViaText()
- Search & Refresh: searchFor(), clickRefresh()
- Table Operations: isTableVisible(), getRowCount(), getPaginationText(), getTotalItems()
- Filters: openFilterDialog(), selectFilterType(), selectOperator(), enterFilterValue(), applyFilter(), clearFilters()
- Upload: openUploadDialog(), uploadFile(), selectGenerateReports/Meta/Scripts(), clickProceed()
- Download: selectFileRow(), clickDownloadButton(), downloadFile()
- Pagination: goToPage(), clickNextArrow(), clickPreviousArrow(), getPageCount(), setPageSize()

### MMDesignPage.ts
- MM Design page operations

### SettingsPage.ts
- Settings page operations

### TemplatesPage.ts
- Template management operations

---

## 5. Improvements Recommendations

| Area | Current | Recommended |
|------|---------|-------------|
| **Test Data** | Hardcoded credentials in tests (e.g., 'cpq-admin@netcracker.com', 'MARket1234!') | Use environment variables or secrets manager |
| **Wait Strategies** | Excessive `waitForTimeout()` (e.g., 2000ms, 3000ms) | Use explicit waits with `expect()` polling |
| **Test Tags** | None | Add `@smoke`, `@regression` tags for selective execution |
| **Reporting** | Basic HTML reporter | Integrate Allure for advanced dashboards |
| **Parallelization** | `workers: 1` (slow sequential) | Enable parallel execution when tests are stable |
| **Base Page** | Code duplication across pages | Extract common methods to `BasePage` class |
| **Retry Logic** | No automatic retries | Configure `retries` in playwright.config.ts |
| **Test Isolation** | No cleanup between tests | Add `test.afterEach` hooks |

---

## 6. Configuration Details

### playwright.config.ts
```
typescript
- Test directory: ./tests
- Sequential execution: workers: 1
- Reporter: HTML with timestamped folders
- Screenshots: On failure
- Trace: On first retry
- Base URL: QA1 environment (https://migration-design2code-ui-qa1.cloudmt.managed.netcracker.cloud/)
- Video: Off
```

### Jenkins Pipeline Stages
1. **Checkout** - Clone from Git repository
2. **Install Dependencies** - npm ci
3. **Install Playwright Browsers** - npx playwright install --with-deps chromium
4. **Run Playwright Tests** - npx playwright test --project=QA1
5. **Archive Reports** - Save HTML reports and test results
6. **Send Email** - Notification with test results

---

## 7. Test Execution Flow

1. Tests are named sequentially (01_ to 15_) for ordered execution
2. Each test file uses Playwright's test.describe() for grouping
3. Page Object Model is used for all page interactions
4. Screenshots are captured on test failures
5. HTML reports are generated with timestamps

---

## 8. CI/CD Pipelines

### A. Jenkins Pipeline (Jenkinsfile)
- **Location:** `Jenkinsfile` in project root
- **Stages:** Checkout → Install Dependencies → Install Browsers → Run Tests → Archive Reports → Send Email
- **Features:** Automated email notifications, HTML report archival, sequential execution

### B. GitHub Actions Workflow (.github/workflows/playwright-tests.yml)
- **Location:** `.github/workflows/playwright-tests.yml`
- **Triggers:** Push to main/develop, Pull requests, Manual dispatch
- **Features:**
  - Environment selection (QA1, QA2, QA3)
  - Test tag support (@smoke, @regression)
  - Matrix sharding for parallel execution (3 shards)
  - Artifact uploads (screenshots, test results, reports)
  - Summary report generation
  - Secret management for credentials
  - Node.js 18 with npm caching

---

## 9. Summary

This is a **well-structured Playwright automation project** following industry best practices with the **Page Object Model pattern**. It provides:

- ✅ Comprehensive end-to-end testing of the D2C application
- ✅ 15+ test scenarios covering all major features
- ✅ Dual CI/CD support (Jenkins + GitHub Actions)
- ✅ Detailed page objects for maintainability
- ✅ HTML reporting and screenshot capture

**Main Areas for Future Improvement:**
- Environment-based configuration
- Parallel test execution
- Advanced reporting (Allure)
- Base page class for code reuse
- Test tags for selective execution
