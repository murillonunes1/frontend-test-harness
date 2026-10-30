import { expect, type Page } from '@playwright/test';
import type { RouteConfig } from '../config/schema';
import { routeUrl } from './routes';

/**
 * Navega até a rota e espera ela ficar pronta — sem esperas fixas.
 * "Pronta" = evento load + readySelector visível (quando configurado).
 */
export async function gotoRoute(page: Page, baseURL: string, route: RouteConfig) {
  const response = await page.goto(routeUrl(baseURL, route.path), { waitUntil: 'load' });
  if (route.readySelector) {
    await expect(page.locator(route.readySelector).first()).toBeVisible();
  }
  return response;
}

/** Espera fontes web carregarem; evita falsos positivos em screenshots. */
export async function waitForFonts(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

/** Espera a próxima resposta cuja URL combine com o padrão e verifica que foi 2xx. */
export async function waitForResponseOk(page: Page, urlPart: string | RegExp) {
  const response = await page.waitForResponse((r) =>
    typeof urlPart === 'string' ? r.url().includes(urlPart) : urlPart.test(r.url()),
  );
  expect(response.ok(), `${response.url()} respondeu ${response.status()}`).toBeTruthy();
  return response;
}
