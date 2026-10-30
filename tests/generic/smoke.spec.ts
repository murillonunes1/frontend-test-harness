import { expect, test } from '../../fixtures/test';
import { target } from '../../fixtures/target';
import { EMPTY_STORAGE_STATE } from '../../utils/auth';
import { routesFor } from '../../utils/routes';
import { gotoRoute } from '../../utils/waits';

// Gerado a partir de config/apps/<app>.ts: um teste por rota, sem código específico da app.
// Sessão expirada em rota autenticada costuma redirecionar ao login: o readySelector pega isso.
for (const route of routesFor(target.app, 'smoke')) {
  test.describe(`smoke: ${route.name}`, () => {
    test.use({ storageState: route.auth ? target.authFile : EMPTY_STORAGE_STATE });

    test(`${route.name} carrega sem erros`, { tag: '@smoke' }, async ({ page, diagnostics }) => {
      await gotoRoute(page, target.env.baseURL, route);

      await expect(page).toHaveTitle(/\S/);
      // Inclui o status do próprio documento (falha em 4xx/5xx, salvo exceção na config).
      diagnostics.expectClean();
    });
  });
}
