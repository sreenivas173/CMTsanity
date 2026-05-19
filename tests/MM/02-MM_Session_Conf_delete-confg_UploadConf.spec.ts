
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

        test.setTimeout(300000);

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

        // Matching session rows
        const getMatchingSessionRows = () =>
          page
            .getByRole('row')
            .filter({
              hasText: sessionSearchText
            });

        const getMatchingSessionLinks = () =>
          getMatchingSessionRows()
            .locator('a');

        let matchingCount =
          await getMatchingSessionLinks().count();

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

          // Completed / Cancelled
          const directDelete =
            page.getByRole(
              'button',
              {
                name: /^Delete$/i
              }
            );

          if (
            await directDelete
              .isVisible()
              .catch(() => false)
          ) {

            console.log(
              'Direct delete found'
            );

            await directDelete.click();

          } else {

            // Not Started → use 3 dots
            console.log(
              'Using 3-dot delete'
            );

            
          // Find Edit button first
const editButton = page
  .getByRole(
    'button',
    {
      name: 'Edit'
    }
  );

await expect(
  editButton
).toBeVisible({
  timeout: 10000
});

// 3-dots button = next sibling after Edit
const moreActions =
  editButton
    .locator(
      'xpath=following-sibling::button[1]'
    );

await expect(
  moreActions
).toBeVisible({
  timeout: 5000
});

console.log(
  'Opening 3-dot menu'
);

await moreActions.click({
  force: true
});

await page.waitForTimeout(
  1000
);

            // Reduce wait
            await page.waitForTimeout(
              1000
            );

            const deleteMenu =
              page
                .getByText(
                  'Delete',
                  {
                    exact: true
                  }
                );

            await expect(
              deleteMenu
            ).toBeVisible({
              timeout: 5000
            });

            await deleteMenu.click();
          }

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


          console.log(
            'Delete confirmed'
          );

          console.log(
            'Validating session deletion'
          );

          // Return to sessions page
          await page.goto(
            sessionsUrl
          );

          await expect(
            page.getByRole('table')
          ).toBeVisible({
            timeout: 15000
          });

          // Reapply search filter
          const searchBox = page
            .getByRole(
              'textbox',
              {
                name: 'Search'
              }
            );

          await searchBox.clear();

          await searchBox.fill(
            sessionSearchText
          );

       // Wait search refresh
await expect.poll(
  async () => {

    const tableText =
      await page
        .locator('table')
        .textContent();

    return tableText;

  },
  {
    timeout: 15000,
    intervals: [1000]
  }
).toContain(
  'No data to display'
);
          // Verify deleted session removed
          await expect.poll(
            async () => {

              return await page
                .getByRole('link', {
                  name:
                    sessionName || ''
                })
                .count();

            },
            {
              timeout: 60000,
              intervals: [2000]
            }
          ).toBe(0);

          console.log(
            'Session deletion verified'
          );

          // Refresh matching count
          matchingCount =
            await page
              .getByRole('row')
              .filter({
                hasText:
                  sessionSearchText
              })
              .count();

          console.log(
            `Remaining sessions:
   ${matchingCount}`
          );

          // HARD BLOCK
          if (
            matchingCount > 0
          ) {

            console.log(
              'More sessions exist'
            );

            continue;
          }

          // Refresh count
          matchingCount =
            await getMatchingSessionLinks()
              .count();

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

const finalSessionCount =
  await page
    .getByRole('row')
    .filter({
      hasText:
        sessionSearchText
    })
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


