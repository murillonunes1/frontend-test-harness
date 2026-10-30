import { expect, type Locator, type Page } from '@playwright/test';

export class InventoryPage {
  readonly container: Locator;
  readonly items: Locator;
  readonly cartBadge: Locator;
  readonly cartLink: Locator;
  readonly sort: Locator;

  constructor(private readonly page: Page) {
    this.container = page.getByTestId('inventory-container');
    this.items = page.getByTestId('inventory-item');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.sort = page.getByTestId('product-sort-container');
  }

  async goto() {
    await this.page.goto('inventory.html');
    await expect(this.container).toBeVisible();
  }

  item(name: string): Locator {
    return this.items.filter({ hasText: name });
  }

  async addToCart(name: string) {
    await this.item(name).getByRole('button', { name: 'Add to cart' }).click();
  }

  async prices(): Promise<number[]> {
    const texts = await this.page.getByTestId('inventory-item-price').allTextContents();
    return texts.map((t) => Number(t.replace('$', '')));
  }

  async openCart() {
    await this.cartLink.click();
  }
}
