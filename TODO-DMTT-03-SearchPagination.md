# TODO - DMTT 03 Search + Pagination Validations

## Plan
1. Inspect existing DMTT 03 test + POM to understand current pagination checks.
2. Split into 2 tests inside `tests/DMTT/03-DMTT_Search-Pagination.spec.ts`:
   - **Test 1:** Search "sanity" and validate only sanity-related configs are displayed.
   - **Test 2:** After the same search, validate pagination using a range-based method (start/end) and verify page-2 results differ while still being sanity-only.
3. Update `pages/DMTTEnvironmentSearchPaginationPage.ts` with helper(s):
   - parse pagination text into `{ total, start, end }`
   - wait until pagination range changes
4. Implement the new pagination assertions in Test 2.
5. Run Playwright for this spec and adjust selectors/timeouts if needed.

## Progress
- [x] Step 1: Inspect existing files
- [x] Step 2: Split tests (planned)
- [ ] Step 3: Add POM helpers
- [ ] Step 4: Update assertions
- [ ] Step 5: Run playwright

