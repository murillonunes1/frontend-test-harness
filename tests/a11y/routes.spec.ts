import { test } from '../../fixtures/test';
import { target } from '../../fixtures/target';
import { expectNoA11yViolations, scanA11y } from '../../utils/a11y';
import { EMPTY_STORAGE_STATE } from '../../utils/auth';
import { routesFor } from '../../utils/routes';
import { gotoRoute } from '../../utils/waits';

// Uma varredura WCAG 2.1 AA por rota configurada. Exceções ficam na config, com justificativa.
for (const route of routesFor(target.app, 'a11y')) {
  test.describe(`a11y: ${route.name}`, () => {
    test.use({ storageState: route.auth ? target.authFile : EMPTY_STORAGE_STATE });

    test(`${route.name} atende WCAG 2.1 AA`, { tag: '@a11y' }, async ({ page }, testInfo) => {
      await gotoRoute(page, target.env.baseURL, route);
      const results = await scanA11y(page, target.app, route);
      await expectNoA11yViolations(results, testInfo);
    });
  });
}
