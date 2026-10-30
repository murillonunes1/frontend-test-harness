import { requireEnv } from '../../../config/load';
import { expect, test } from '../../../fixtures/saucedemo';
import { EMPTY_STORAGE_STATE } from '../../../utils/auth';

test.describe('Swag Labs: login', { tag: '@e2e' }, () => {
  // Estes testes exercitam o próprio login, então começam deslogados.
  test.use({ storageState: EMPTY_STORAGE_STATE });

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('entra com credenciais válidas', async ({ loginPage, inventoryPage }) => {
    await loginPage.login(requireEnv('SAUCEDEMO_USER'), requireEnv('SAUCEDEMO_PASSWORD'));
    await expect(inventoryPage.container).toBeVisible();
  });

  test('mostra erro com senha inválida', async ({ loginPage }) => {
    await loginPage.login(requireEnv('SAUCEDEMO_USER'), 'senha-errada');
    await expect(loginPage.error).toContainText('do not match');
  });

  test('exige usuário', async ({ loginPage }) => {
    await loginPage.submit.click();
    await expect(loginPage.error).toContainText('Username is required');
  });
});
