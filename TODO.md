# Playwright Test Fix Tracker: 06-MM_SessionCreate.spec.ts

## Current Status
**Target:** Fix QA1_MM failure - "Unable to select the SourceProfile from dropdown select 'cbt'"

## Step-by-Step Plan ✅ Approved

### 1. Analyze & Update MM_SessionsPage.ts ✅ COMPLETED
- Read current createNewSession method
- Add accordion collapse before SourceProfile selection  
- Implement SourceProfile combobox selection for 'cbt'
- Remove skip logic, ensure Create button enables after selection
- Add robust waits and error handling

### 2. Test Execution ❌ FAILED - Source combobox locator issue detected
```
npx playwright test tests/MM/06-MM_SessionCreate.spec.ts --project=QA1_MM
```

### 3. Validation [PENDING]
- ✅ Dialog closes successfully
- ✅ Pagination count increases  
- ✅ New session appears in table

### 4. Final Verification [PENDING]
```
npx playwright show-report
```

---

**Next Action:** Applied more flexible combobox locator. Re-running test.
