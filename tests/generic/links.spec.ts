import { expect, test } from '../../fixtures/test';
import { target } from '../../fixtures/target';
import { EMPTY_STORAGE_STATE } from '../../utils/auth';
import { routesFor } from '../../utils/routes';
import { gotoRoute } from '../../utils/waits';

const { links } = target.app;
const ignore = links.ignore.map((p) => new RegExp(p));

for (const route of routesFor(target.app, 'links')) {
  test.describe(`links: ${route.name}`, () => {
    test.use({ storageState: route.auth ? target.authFile : EMPTY_STORAGE_STATE });

    test(`${route.name} não tem links quebrados`, { tag: '@links' }, async ({ page }) => {
      // Status HTTP independe do navegador: roda só no projeto chromium.
      test.skip(test.info().project.name !== 'chromium', 'verificado apenas no chromium');

      await gotoRoute(page, target.env.baseURL, route);
      const origin = new URL(page.url()).origin;

      const hrefs = await page
        .locator('a[href]')
        .evaluateAll((els) => els.map((a) => (a as HTMLAnchorElement).href));

      const toCheck = [...new Set(hrefs)]
        .filter((href) => /^https?:/.test(href))
        .map((href) => href.split('#')[0] as string)
        .filter((href) => links.checkExternal || href.startsWith(origin))
        .filter((href) => !ignore.some((re) => re.test(href)))
        .filter((href, i, all) => all.indexOf(href) === i)
        .slice(0, links.maxPerPage);

      const broken: string[] = [];
      for (const href of toCheck) {
        // GET em vez de HEAD: muitos servidores não implementam HEAD corretamente.
        const res = await page.request.get(href, { failOnStatusCode: false, maxRedirects: 5 });
        if (res.status() >= 400) broken.push(`${res.status()} ${href}`);
      }
      test
        .info()
        .annotations.push({ type: 'links verificados', description: String(toCheck.length) });
      expect(broken, `Links quebrados em ${route.name}`).toEqual([]);
    });
  });
}
