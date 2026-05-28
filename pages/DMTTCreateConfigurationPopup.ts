import {
Page,
Locator,
expect
}
from '@playwright/test';

export class DMTTCreateConfigurationPopup {

readonly page: Page;

readonly popup: Locator;

readonly configName: Locator;
readonly cloud: Locator;
readonly namespace: Locator;
readonly sources: Locator;

readonly tenantUser: Locator;
readonly tenantPassword: Locator;

readonly dns: Locator;

readonly createBtn: Locator;

constructor(page: Page){

this.page = page;

this.popup =
page.locator(
'.ux-react-popup__wrapper'
).filter({
has:
page.getByText(
'Create Configuration'
)
});

this.configName =
this.popup.getByPlaceholder(
/Configuration Name/i
);

this.cloud =
this.popup.getByPlaceholder(
/Cloud Name/i
);

this.namespace =
this.popup.getByPlaceholder(
/Namespace/i
);

this.sources =
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

this.dns =
this.popup.getByPlaceholder(
/DNS Name/i
);

this.createBtn =
this.popup.getByRole(
'button',
{
name:/^Create$/i
});

}



async selectOption(
dropdown: Locator,
value: string
){

await dropdown.click();

await this.page
.getByRole(
'option',
{ name:value }
)
.first()
.click();

}

async create(
data:any
){

await expect(
this.popup
).toBeVisible();

await this.configName.fill(
data.configName
);

await this.selectOption(
this.cloud,
data.cloud
);

await this.selectOption(
this.namespace,
data.namespace
);

await this.selectOption(
this.sources,
data.source
);

await this.tenantUser.fill(
data.username
);

await this.tenantPassword.fill(
data.password
);

await this.dns.fill(
data.dns
);

await this.createBtn.click();

}

}