# TODO

## Proposed addition
- [x] Create new test spec: R10_D2C_DBLSettings_fallout-rules_view_download.spec.ts
  - [ ] Login to DMTT/D2C
  - [ ] Navigate to left-side Settings
  - [ ] In **DB Level Design Settings**, hover first option **fallout-rules.json**
  - [ ] Click kebab (3-dot) menu at end of first line
  - [ ] Click **View Content** and take screenshot of popup, then close
  - [ ] Click kebab again and click **Download**
  - [ ] Validate download completes (file exists + size > 0)

## Update to repo
- [ ] If DB table differs from MM, extend SettingsPage with helper for DB table row selection + kebab menu actions (View Content + Download) if needed.
- [ ] Run Playwright for the single new spec.

