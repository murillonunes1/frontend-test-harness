import { expect, test } from '../../../fixtures/saucedemo';
import { buildPerson } from '../../../utils/data';

test.describe('Swag Labs: compra', { tag: '@e2e' }, () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
  });

  test('ordena produtos por preço crescente', async ({ inventoryPage }) => {
    await inventoryPage.sort.selectOption('lohi');

    const prices = await inventoryPage.prices();
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test('finaliza checkout com dois itens', async ({
    page,
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    await inventoryPage.addToCart('Sauce Labs Backpack');
    await inventoryPage.addToCart('Sauce Labs Bike Light');
    await expect(inventoryPage.cartBadge).toHaveText('2');

    await inventoryPage.openCart();
    await expect(cartPage.items).toHaveCount(2);
    await cartPage.checkout.click();

    await checkoutPage.fillCustomer(buildPerson());
    await expect(checkoutPage.total).toContainText('$');
    await checkoutPage.finish.click();

    await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!');
    await expect(page).toHaveURL(/checkout-complete/);
  });

  test('valida campos obrigatórios do checkout', async ({
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    await inventoryPage.addToCart('Sauce Labs Onesie');
    await inventoryPage.openCart();
    await cartPage.checkout.click();
    await checkoutPage.continue.click();

    await expect(checkoutPage.error).toContainText('First Name is required');
  });
});
