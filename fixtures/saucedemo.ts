import { CartPage, CheckoutPage } from '../pages/saucedemo/checkout-pages';
import { InventoryPage } from '../pages/saucedemo/inventory-page';
import { LoginPage } from '../pages/saucedemo/login-page';
import { target } from './target';
import { test as base } from './test';

interface SauceFixtures {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
}

export const test = base.extend<SauceFixtures>({
  // Por padrão os testes já começam logados (storageState gerado no setup).
  storageState: target.authFile,
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  inventoryPage: async ({ page }, use) => use(new InventoryPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
});

export { expect } from './test';
