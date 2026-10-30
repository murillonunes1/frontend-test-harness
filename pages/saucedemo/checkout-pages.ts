import type { Locator, Page } from '@playwright/test';

export class CartPage {
  readonly items: Locator;
  readonly checkout: Locator;

  constructor(page: Page) {
    this.items = page.getByTestId('inventory-item');
    this.checkout = page.getByTestId('checkout');
  }
}

export class CheckoutPage {
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly postalCode: Locator;
  readonly continue: Locator;
  readonly finish: Locator;
  readonly total: Locator;
  readonly completeHeader: Locator;
  readonly error: Locator;

  constructor(page: Page) {
    this.firstName = page.getByTestId('firstName');
    this.lastName = page.getByTestId('lastName');
    this.postalCode = page.getByTestId('postalCode');
    this.continue = page.getByTestId('continue');
    this.finish = page.getByTestId('finish');
    this.total = page.getByTestId('total-label');
    this.completeHeader = page.getByTestId('complete-header');
    this.error = page.getByTestId('error');
  }

  async fillCustomer(data: { firstName: string; lastName: string; postalCode: string }) {
    await this.firstName.fill(data.firstName);
    await this.lastName.fill(data.lastName);
    await this.postalCode.fill(data.postalCode);
    await this.continue.click();
  }
}
