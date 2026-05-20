
/**
 * @author Srinivasa Rao Allamsetti
 * @description E2E test for Delete existing config and Upload new config in Migration Manager
 */

import { test, expect } from '@playwright/test';

import { MM_LoginPage } from '../../pages/MM_LoginPage';
import { MM_ConfigPage } from '../../pages/MM_ConfigPage';

const testCases = [
  {
    name: 'Delete Config and Upload New',
    configToDelete: 'oss-lm-migMaySr-21011',
    uploadFile: 'test-data/oss-lm-mmip_d2c_may_OP.zip',
    configVersionToMatch: '1.0.1-1777625561',
    sessionSearchText: 'Srini_MM_AT'
  }
];

test.describe('@MMsanity MM Configuration Delete and Upload', () => {

  testCases.forEach(({
    name,
    configToDelete,
    uploadFile,
    configVersionToMatch,
    sessionSearchText
  }) => {

    test(
      `Delete: ${configToDelete} and Upload new config`,
      async ({ page }) => {

        test.setTimeout(180000);
        page.setDefaultTimeout(10000);
        page.setDefaultNavigationTimeout(30000);
        const mmLoginPage = new MM_LoginPage(page);
        const mmConfigPage = new MM_ConfigPage(page);

        // =========================================================
        // STEP 1: LOGIN
        // =========================================================

        console.log('Step 1: Logging in...');

        await mmLoginPage.goto();

        await mmLoginPage.login(
          'cpq-admin@netcracker.com',
          'MARket1234!'
        );

        // =========================================================
        // STEP 2: OPEN CONFIGURATIONS
        // =========================================================

        console.log(
          'Step 2: Navigating to Configurations...'
        );

        const configsTab = page.getByRole('tab', {
          name: 'Configurations'
        });

        await expect(configsTab).toBeVisible({
          timeout: 30000
        });

        await configsTab.click();

        await expect(
          page.getByRole('gridcell', {
            name: 'Configuration ID'
          })
        ).toBeVisible({
          timeout: 30000
        });

        console.log(
          'Configurations page loaded successfully'
        );

        // =========================================================
        // STEP 3: DELETE RELATED SESSIONS
        // =========================================================

        console.log(
          `Step 3: Deleting sessions matching configuration version: ${configVersionToMatch}`
        );

        const sessionsUrl =
          'https://cdn-edge-service-qa1.cloudmt.managed.netcracker.cloud/fragment/migration-ui/sessions';

        await page.goto(sessionsUrl);

        await expect(
          page.getByRole('table')
        ).toBeVisible({
          timeout: 30000
        });

        console.log(
          `Applying session filter: ${sessionSearchText}`
        );

        // Open filter menu
        const statusHeader = page
          .getByRole('gridcell', {
            name: 'Status'
          })
          .first();

        await expect(statusHeader).toBeVisible({
          timeout: 15000
        });

        await statusHeader.click();

        await page
          .getByRole('menuitem', {
            name: 'Add Filter'
          })
          .click();

        const popup = page.getByRole('dialog', {
          name: 'Filters'
        });

        await expect(popup).toBeVisible({
          timeout: 15000
        });

        const controls = popup.locator(
          '.ux-react-filters-item__control'
        );

        await expect(controls.first())
          .toBeVisible({
            timeout: 10000
          });

        // Field dropdown
        await controls.nth(0).click();

        const fieldOption = page
          .locator('[role="listbox"]:visible')
          .getByRole('option', {
            name: /name/i
          })
          .first();

        await expect(fieldOption).toBeVisible({
          timeout: 10000
        });

        await fieldOption.click();

        // Operator dropdown
        await controls.nth(1).click();

        await page
          .locator('[role="listbox"]:visible')
          .getByRole('option', {
            name: /contains/i
          })
          .first()
          .click();

        // Value input
        const valueInput = popup
          .locator(
            'input[type="text"], input[type="search"], textarea'
          )
          .first();

        await valueInput.fill(
          sessionSearchText
        );

        // Apply filter
        await popup
          .getByRole('button', {
            name: 'Apply'
          })
          .click();

        // Wait table refresh
        await expect(
          page.getByRole('table')
        ).toBeVisible({
          timeout: 30000
        });

        // Use search box instead of filter persistence
        const sessionSearchBox =
          page.getByRole(
            'textbox',
            {
              name: 'Search'
            }
          );

        await sessionSearchBox.clear();

        await sessionSearchBox.fill(
          sessionSearchText
        );

        await page.waitForTimeout(
          2000
        );

        const getMatchingSessionLinks =
          () =>
            page
              .getByRole(
                'link'
              )
              .filter({
                hasText:
                  sessionSearchText
              });

        let matchingCount =
          await getMatchingSessionLinks()
            .count();

        console.log(
          `Found ${matchingCount} matching session(s)`
        );

        console.log(
          `Found ${matchingCount} matching session(s)`
        );

        // Delete all matching sessions
        const maxDeletes =
          matchingCount > 0
            ? Math.min(matchingCount, 50)
            : 0;

        for (let i = 0; i < maxDeletes; i++) {

          const matchingSessionLinks =
            getMatchingSessionLinks();

          const currentCount =
            await matchingSessionLinks.count();

          if (currentCount === 0) {

            console.log(
              'No more matching sessions found'
            );

            break;
          }

          const link =
            matchingSessionLinks.first();

          const sessionName =
            (await link.textContent())?.trim();

          console.log(
            `Deleting session: ${sessionName}`
          );

          // Open session
          await link.click();

          await expect(
            page.getByText(
              'Configuration Version'
            )
          ).toBeVisible({
            timeout: 30000
          });

          console.log(
            'Session details page opened'
          );

          // // Delete session
          // const deleteButton = page
          //   .getByRole('button', {
          //     name: 'Delete',
          //     exact: true
          //   });

          // await expect(deleteButton)
          //   .toBeVisible({
          //     timeout: 20000
          //   });

          // await deleteButton.click();

          // Open 3-dot action menu
          // Session status
          const status = (
            await page
              .locator(
                '[class*="gray"], [class*="Status"]'
              )
              .first()
              .textContent()
              .catch(() => '')
          )?.trim();

          console.log(
            `Session status: ${status}`
          );

          console.log(`Deleting session with status: ${status}`);

          //--------------------------May 20 -------------------------
          console.log(
            `Deleting session: ${sessionName}`
          );

          // PRODUCTION STRATEGY:
          // Prefer visible Delete button.
          // Only use overflow path when Delete absent.

          console.log(
            `Deleting session:
   ${sessionName}`
          );

          console.log(
            `Deleting session:
   ${sessionName}`
          );

          // Completed page:
          const directDelete =
            page.getByRole(
              'button',
              {
                name: /^Delete$/i
              }
            ).first();

          // Not Started page:
          const editButton =
            page.getByRole(
              'button',
              {
                name: /^Edit$/i
              }
            );

          // CASE 1
          if (
            await directDelete
              .isVisible()
              .catch(() => false)
          ) {

            console.log(
              'Completed → direct delete'
            );

            await directDelete.click({
              force: true
            });

          }

          // CASE 2
          else if (
            await editButton
              .isVisible()
              .catch(() => false)
          ) {

            console.log(
              'Not Started → overflow delete'
            );

            const moreActions =
              editButton.locator(
                'xpath=following-sibling::button[1]'
              );

            await moreActions.click({
              force: true
            });

            const deleteMenu =
              page.getByText(
                'Delete',
                {
                  exact: true
                }
              );

            await deleteMenu.click();

          }

          // UNKNOWN
          else {

            console.log(
              'Buttons missing'
            );

            await page.screenshot({
              path:
                `unknown_ui_${Date.now()}.png`
            });

            throw new Error(
              'Delete UI not found'
            );
          }
          //------------------------------may 20---------------------
          // Confirm popup delete
          const confirmDialog =
            page.getByRole(
              'dialog'
            );

          await expect(
            confirmDialog
          ).toBeVisible({
            timeout: 10000
          });

          // Actual popup Delete button
          const confirmDeleteButton =
            confirmDialog
              .getByRole(
                'button',
                {
                  name: /^Delete$/i
                }
              );

          await expect(
            confirmDeleteButton
          ).toBeVisible({
            timeout: 10000
          });

          console.log(
            'Confirming popup delete'
          );

          await confirmDeleteButton.click({
            force: true
          });

          // Wait dialog closed
          await expect(
            confirmDialog
          ).toBeHidden({
            timeout: 15000
          });

          console.log(
            'Delete popup closed'
          );
          ///--------------------------------------

          console.log(
            'Re-validating sessions'
          );

          await page.goto(
            sessionsUrl,
            {
              waitUntil:
                'domcontentloaded'
            }
          );

          const remaining =
            await page
              .getByRole('row')
              .filter({
                hasText:
                  sessionSearchText
              })
              .count();

          console.log(
            `Remaining sessions:
   ${remaining}`
          );
          //==================may20-1==s========================

          await page.goto(
            sessionsUrl
          );

          await page.waitForLoadState(
            'domcontentloaded'
          );

          await expect.poll(
            async () => {

              const rows =
                page
                  .getByRole('row')
                  .filter({
                    hasText:
                      sessionSearchText
                  });

              return await rows.count();

            },
            {
              timeout: 20000,
              intervals: [1000]
            }
          ).toBeLessThan(
            matchingCount
          );

          console.log(
            'Session deletion verified'
          );
          // Refresh count after delete
          matchingCount =
            await getMatchingSessionLinks()
              .count();

          console.log(
            `Remaining sessions:
   ${matchingCount}`
          );

          // Continue deleting
          if (
            matchingCount > 0
          ) {

            console.log(
              'More sessions remain'
            );

            continue;
          }

          console.log(
            'All sessions deleted'
          );
          //==================may20-1=e=========================


          console.log(
            `Remaining sessions:
   ${matchingCount}`
          );

          // STOP config cleanup
          if (
            matchingCount > 0
          ) {

            console.log(
              'More sessions remain'
            );

            continue;
          }

          console.log(
            'All sessions deleted'
          );


        }

        // FINAL SESSION VALIDATION

        await page.goto(
          sessionsUrl
        );

        await expect(
          page.getByRole('table')
        ).toBeVisible({
          timeout: 15000
        });

        await sessionSearchBox.clear();

        await sessionSearchBox.fill(
          sessionSearchText
        );

        await page.waitForTimeout(
          2000
        );

        const finalSessionCount =
          await getMatchingSessionLinks()
            .count();

        console.log(
          `Final remaining sessions:
   ${finalSessionCount}`
        );

        // BLOCK CONFIG DELETE
        expect(
          finalSessionCount
        ).toBe(0);

        console.log(
          'All sessions removed successfully'
        );





        // =========================================================
        // STEP 4: RETURN TO CONFIGURATIONS
        // =========================================================

        console.log(
          'Returning to Configurations...'
        );

        await page
          .getByRole('tab', {
            name: 'Configurations'
          })
          .click();

        await expect(
          page.getByRole('gridcell', {
            name: 'Configuration ID'
          })
        ).toBeVisible({
          timeout: 30000
        });

        console.log(
          'Configurations page loaded successfully'
        );




        // =========================================================
        // STEP 5: SEARCH / CLEAN CONFIGURATION
        // =========================================================

        console.log(
          `Searching configuration: ${configToDelete}`
        );

        // Search config
        const searchBox = page.getByRole(
          'textbox',
          { name: 'Search' }
        );

        await expect(searchBox)
          .toBeVisible({
            timeout: 30000
          });

        await searchBox.clear();

        await searchBox.fill(
          configToDelete
        );

        await page.waitForTimeout(3000);

        // Locate row
        const configRow = page
          .getByRole('row')
          .filter({
            hasText: configToDelete
          })
          .first();

        const configFound =
          await configRow
            .isVisible()
            .catch(() => false);

        console.log(
          `Config found after search: ${configFound}`
        );

        let configCleanupCompleted = false;

        if (configFound) {

          console.log(
            `Configuration found: ${configToDelete}`
          );

          // Open config details
          const configLink = configRow
            .getByRole('link')
            .first();

          await expect(configLink)
            .toBeVisible({
              timeout: 30000
            });

          console.log(
            'Opening configuration details'
          );

          await configLink.click({
            force: true
          });

          await expect(
            page.getByText(
              'Configuration Version'
            )
          ).toBeVisible({
            timeout: 30000
          });

          console.log(
            'Configuration details page loaded'
          );

          // Deactivate only if config is Active
          const deactivateButton = page
            .getByRole('button', {
              name: /deactivate/i
            });

          const hasDeactivate =
            await deactivateButton
              .isVisible()
              .catch(() => false);

          if (hasDeactivate) {

            console.log(
              'Active configuration found → deactivating'
            );

            await deactivateButton.click({
              force: true
            });

            const confirmDeactivate =
              page
                .getByRole('dialog')
                .getByRole('button', {
                  name: /deactivate/i
                });

            await expect(
              confirmDeactivate
            ).toBeVisible({
              timeout: 15000
            });

            await confirmDeactivate.click();

            await expect(
              page.locator(
                '.ux-react-notification__heading'
              )
            ).toContainText(
              'Success',
              {
                timeout: 30000
              }
            );

            console.log(
              'Configuration deactivated'
            );

          } else {

            console.log(
              'Configuration already Not Active → proceeding to delete'
            );
          }

          // Back to grid
          await page
            .getByRole('tab', {
              name: 'Configurations'
            })
            .click();

          await expect(
            page.getByRole('gridcell', {
              name: 'Configuration ID'
            })
          ).toBeVisible({
            timeout: 30000
          });

          // SEARCH AGAIN AFTER DEACTIVATE
          console.log(
            'Re-search config after deactivate'
          );

          await searchBox.clear();

          await searchBox.fill(
            configToDelete
          );

          await page.waitForTimeout(
            3000
          );

          const reopenRow = page
            .getByRole('row')
            .filter({
              hasText: configToDelete
            })
            .first();

          await expect(
            reopenRow
          ).toBeVisible({
            timeout: 30000
          });

          const reopenLink =
            reopenRow
              .getByRole('link')
              .first();

          await expect(
            reopenLink
          ).toBeVisible({
            timeout: 30000
          });

          console.log(
            'Opening config again for delete'
          );

          await reopenLink.click({
            force: true
          });

          await expect(
            page.getByText(
              'Configuration Version'
            )
          ).toBeVisible({
            timeout: 30000
          });

          // DELETE CONFIG
          const deleteButton = page
            .getByRole('button', {
              name: /^delete$/i
            });

          await expect(
            deleteButton
          ).toBeVisible({
            timeout: 30000
          });

          await deleteButton.click();

          const confirmDelete =
            page
              .getByRole('dialog')
              .getByRole('button', {
                name: /^delete$/i
              });

          await expect(
            confirmDelete
          ).toBeVisible({
            timeout: 15000
          });

          await confirmDelete.click();

          console.log(
            'Delete clicked - validating deletion'
          );

          // Return to grid
          await page
            .getByRole('tab', {
              name: 'Configurations'
            })
            .click();

          await expect(
            page.getByRole('gridcell', {
              name: 'Configuration ID'
            })
          ).toBeVisible({
            timeout: 30000
          });

          // Search deleted config again
          await searchBox.clear();

          await searchBox.fill(
            configToDelete
          );

          await page.waitForTimeout(3000);

          // HARD validation: config removed
          const deletedCount =
            await page
              .locator(
                `a:text-is("${configToDelete}")`
              )
              .count();

          expect(
            deletedCount
          ).toBe(0);

          console.log(
            'Configuration deletion verified'
          );

          configCleanupCompleted = true;

        } else {

          console.log(
            'No configuration found → proceeding to upload'
          );

          configCleanupCompleted = true;

        } // END configFound

        // Upload blocker
        expect(
          configCleanupCompleted
        ).toBeTruthy();

        const remainingConfigs =
          await page
            .locator(
              `a:text-is("${configToDelete}")`
            )
            .count();

        expect(
          remainingConfigs
        ).toBe(0);

        console.log(
          'No active config remaining → upload allowed'
        );
        // =========================================================
        // STEP 6: UPLOAD NEW CONFIG (ALWAYS RUN)
        // =========================================================

        console.log(`Uploading new config: ${uploadFile}`);

        // Use the page-object helper to ensure we upload within the correct dialog
        // and deterministically wait for success.
        const uploadedFileName =
          await mmConfigPage.uploadAndWaitSuccess(uploadFile);
        console.log(`Upload success for file: ${uploadedFileName}`);

        // Navigate b kions (hard navigation inside page-object)
        await mmConfigPage.navigateToMMConfig();

        await expect(
          page.getByRole('gridcell', {
            name: 'Configuration ID'
          })
        ).toBeVisible({
          timeout: 30000
        });

        // =========================================================
        // STEP 7: VALIDATE UPLOAD
        // =========================================================

        console.log('Validating uploaded configuration...');

        // Deterministic validation: verify the uploaded config by Configuration Version.
        // This avoids relying on the exact configuration link text which can vary.
        await mmConfigPage.verifyUpload(configVersionToMatch);

        // Additional assertion using the known expected version from the test case.
        await expect
          .poll(async () => {
            return await page
              .getByRole('row')
              .filter({ hasText: configVersionToMatch })
              .count();
          }, { timeout: 180000, intervals: [2000] })
          .toBeGreaterThan(0);

        const afterCount =
          await mmConfigPage.getTotalItems();

        console.log(`Upload validation completed. Total count: ${afterCount}`);

        // Screenshot
        await page.screenshot({
          path:
            `screenshots/delete-upload-complete-${Date.now()}.png`,
          fullPage: true
        });

        console.log(`✅ Test PASS: ${name}`);
      } // END TEST
    ); // END test()
  }); // END forEach()
}); // END describe()


