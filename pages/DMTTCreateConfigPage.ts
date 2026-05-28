import { expect, Locator, Page } from '@playwright/test';

export class DMTTCreateConfigPage {
    readonly page: Page;

    // Toolbar create button
    readonly createConfigBtn: Locator;

    // Popup
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

        this.configName =
            this.popup.getByPlaceholder(
                /Configuration Name/i
            );

        this.cloudDropdown =
            this.popup.getByPlaceholder(
                /Cloud Name/i
            );

        this.namespaceDropdown =
            this.popup.getByPlaceholder(
                /Namespace/i
            );

        this.microservicesDropdown =
            this.popup.getByPlaceholder(
                /Microservices/i
            );

        this.sourcesDropdown =
            this.popup.getByPlaceholder(
                /Sources/i
            );

        this.tenantUser =
            this.popup.getByPlaceholder(
                /Tenant Admin Username/i
            );

        this.tenantPassword =
            this.popup.locator(
                'input[type="password"]'
            );

        this.dnsName =
            this.popup.getByPlaceholder(
                /DNS Name/i
            );

        this.createBtn =
            this.popup.getByRole(
                'button',
                { name: /^Create$/ }
            );

        this.cancelBtn =
            this.popup.getByRole(
                'button',
                { name: /^Cancel$/ }
            );
    }

    async openCreatePopup() {

        await expect(
            this.createConfigBtn
        ).toBeVisible({
            timeout: 30000
        });

        await this.createConfigBtn.click();

        await expect(
            this.popup
        ).toBeVisible({
            timeout: 30000
        });
    }

    async selectDropdown(
        dropdown: Locator,
        value: string
    ) {

        await dropdown.click();

        const option =
            this.page.locator(
                '[role="option"]'
            )
            .filter({
                hasText: value
            })
            .first();

        await expect(
            option
        ).toBeVisible({
            timeout: 20000
        });

        await option.click();
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

        const successToast =
            this.page.locator(
                `
                text=/success|created/i,
                [role="alert"],
                .notification-container-module_ux-react-notification-new-container__5d622f
                `
            );

        await expect(
            successToast.first()
        ).toBeVisible({
            timeout: 60000
        });
    }
}