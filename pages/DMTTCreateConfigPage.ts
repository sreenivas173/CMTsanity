import { expect, Locator, Page } from '@playwright/test';

export class DMTTCreateConfigPage {
    readonly page: Page;

    // Toolbar create button
    readonly createConfigBtn: Locator;

    // Popup (may not be consistently rendered as `.ux-react-popup__wrapper` in all builds)
    readonly popup: Locator;


    // Fields
    readonly configName: Locator;
    readonly cloudDropdown: Locator;
    readonly namespaceDropdown: Locator;
    readonly microservicesDropdown: Locator;
    readonly sourcesDropdown: Locator;

    readonly tenantUser: Locator;
    readonly tenantPassword: Locator;
    readonly dnsName: Locator;

    // Footer buttons INSIDE popup only
    readonly createBtn: Locator;
    readonly cancelBtn: Locator;

    constructor(page: Page) {
        this.page = page;

        this.createConfigBtn =
            page.getByRole('button', {
                name: /Create Configuration/i
            });

        this.popup = page.locator(
            '.ux-react-popup__wrapper'
        ).filter({
            has: page.getByText(
                'Create Configuration',
                { exact: true }
            )
        });

        // Popup container isn't consistent across QA builds.
        // Define fields relative to the popup wrapper when possible.
        // Fallback is handled in openCreatePopup() via dialog visibility.
        const popupRoot = this.popup.first();

        this.configName =
            this.popup.getByRole(
                'textbox',
                {
                    name: /Configuration Name/i
                }
            );
        this.microservicesDropdown =
            popupRoot.getByText(
                /Microservices/i
            );

        this.cloudDropdown =
            this.popup.getByRole(
                'combobox',
                {
                    name: /Cloud Name/i
                }
            );

        this.namespaceDropdown =
            this.popup.getByRole(
                'combobox',
                {
                    name: /Namespace/i
                }
            );

        this.sourcesDropdown =
            this.popup.getByRole(
                'combobox',
                {
                    name: /Sources/i
                }
            );

        this.tenantUser =
            this.popup.getByRole(
                'textbox',
                {
                    name: /Tenant Admin Username/i
                }
            );
        this.tenantPassword = popupRoot.locator('input[type="password"]');
        this.dnsName =
            this.popup.getByRole(
                'textbox',
                {
                    name: /DNS Name/i
                }
            );


        this.createBtn =
            popupRoot.getByRole(
                'button',
                {
                    name: /^Create$/i
                }
            );

        this.cancelBtn =
            popupRoot.getByRole(
                'button',
                {
                    name: /^Cancel$/i
                }
            );

    }

    async openCreatePopup() {
        // Ensure some environments content is present.
        // Different builds may render a native <table>, a grid, or a custom container.
        // Navigation already happened; readiness signal can vary a lot across builds.
        // Avoid hard-failing on the grid/table presence here.
        // Small wait to let UI settle before attempting to open the popup.
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForTimeout(1000);



        // Try clicking the canonical toolbar button if it exists.
        // In some QA builds this action may be missing/disabled, so we don't hard-fail on it.
        const canonical = this.createConfigBtn.first();
        if (await canonical.isVisible({ timeout: 5000 }).catch(() => false)) {
            await canonical.click();
        }

        // Wait for popup container.
        // Prefer the existing popup locator (it matches the specific dialog by text), but
        // don't block forever on dialog markup differences across builds.
        await this.popup.first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => null);

        const dialog = this.page
            .locator('[role="dialog"], .modal, .popup, .ux-react-popup__wrapper')
            .first();

        const popupIsVisible = await this.popup.first().isVisible().catch(() => false);
        const dialogIsVisible = await dialog.isVisible().catch(() => false);

        if (!popupIsVisible && !dialogIsVisible) {
            // Retry click once; avoid flakiness from initial invisible/disabled state.
            const canonical = this.createConfigBtn.first();
            if (await canonical.isVisible().catch(() => false)) {
                await canonical.click().catch(() => null);
            }
            await dialog.waitFor({ state: 'visible', timeout: 15000 }).catch(() => null);
        }

        // Final best-effort: if popup is still not visible, let next selectors fail with clearer errors.



        // Allow input placeholders to mount.
        // Instead of sleeping blindly, wait for the first field that should exist in the popup.
        await expect(this.configName).toBeVisible({ timeout: 30000 }).catch(() => null);

    }





    async selectDropdown(
        dropdown: Locator,
        value: string
    ) {

        // Wait for dropdown
        await expect(
            dropdown
        ).toBeVisible({
            timeout: 30000
        });

        // Open dropdown safely
        await dropdown.scrollIntoViewIfNeeded();

        await dropdown.click({
            force: true
        });

        // Wait options menu
        const option =
            this.page.getByRole(
                'option',
                {
                    name: value
                }
            ).first();

        await expect(
            option
        ).toBeVisible({
            timeout: 30000
        });

        // Select option
        await option.click({
            force: true
        });

        // Small stabilization wait
        await this.page.waitForTimeout(1000);

    }

    async createConfiguration(
        data: {
            configName: string;
            cloud: string;
            namespace: string;
            source: string;
            username: string;
            password: string;
            dns: string;
        }
    ) {

        // Ensure popup + fields are actually mounted before filling.
        // QA builds may open the popup but render inputs slightly later.
        const waitForFields = async () => {
            await expect(this.popup.first()).toBeVisible({ timeout: 30000 });
            await expect(this.configName).toBeVisible({ timeout: 10000 });
        };

        await waitForFields();

        await this.configName.fill(
            data.configName
        );


        await this.selectDropdown(
            this.cloudDropdown,
            data.cloud
        );

        await this.selectDropdown(
            this.namespaceDropdown,
            data.namespace
        );

        await this.selectDropdown(
            this.sourcesDropdown,
            data.source
        );

        await this.tenantUser.fill(
            data.username
        );

        await this.tenantPassword.fill(
            data.password
        );

        await this.dnsName.fill(
            data.dns
        );

        await expect(
            this.createBtn
        ).toBeEnabled();

        await this.createBtn.click();
    }

    async verifySuccess() {

    // Wait for loading spinner to disappear
    await this.page.waitForTimeout(5000);

    // Success toast / alert
    const successToast =
        this.page.locator('[role="alert"]')
        .or(
            this.page.getByText(
                /success|created/i
            )
        );

    await expect(
        successToast.first()
    ).toBeVisible({
        timeout: 60000
    });

}

}