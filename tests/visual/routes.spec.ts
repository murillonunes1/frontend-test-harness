import { expect, test } from '../../fixtures/test';
import { target } from '../../fixtures/target';
import { EMPTY_STORAGE_STATE } from '../../utils/auth';
import { routesFor } from '../../utils/routes';
import { gotoRoute, waitForFonts } from '../../utils/waits';

// Baselines em tests/visual/__screenshots__/<app>/<plataforma>/<rota>.png.
// Atualize com: pnpm test:visual:update --app=<app>  (ou :docker para gerar as de Linux).
for (const route of routesFor(target.app, 'visual')) {
  test.describe(`visual: ${route.name}`, () => {
    test.use({ storageState: route.auth ? target.authFile : EMPTY_STORAGE_STATE });

    test(`${route.name} não mudou visualmente`, { tag: '@visual' }, async ({ page }) => {
      await gotoRoute(page, target.env.baseURL, route);
      await waitForFonts(page);

      await expect(page).toHaveScreenshot(`${route.name}.png`, {
        fullPage: route.visual.fullPage,
        mask: route.visual.mask.map((selector) => page.locator(selector)),
        ...(route.visual.maxDiffPixelRatio !== undefined && {
          maxDiffPixelRatio: route.visual.maxDiffPixelRatio,
        }),
      });
    });
  });
}
