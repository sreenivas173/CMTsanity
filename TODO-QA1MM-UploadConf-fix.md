# TODO - Fix “Upload new config” not working in `02-MM_Session_Conf_delete-confg_UploadConf.spec.ts`

- [ ] Update `pages/MM_ConfigPage.ts` `uploadAndWaitSuccess()` to deterministically wait:
  - [ ] wait for upload dialog primary action (`Upload`/`Proceed`) to be **enabled**
  - [ ] remove/avoid the current notification `.catch(...waitForTimeout...)` behavior
  - [ ] wait for uploaded config to appear in the configurations table before returning
- [ ] Run targeted Playwright test(s) for QA1_MM (UploadConf spec)
- [ ] Validate that upload actually happened (table shows uploaded config)

