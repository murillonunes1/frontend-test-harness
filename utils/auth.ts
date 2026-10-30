import { expect, type Page } from '@playwright/test';
import { requireEnv, type Target } from '../config/load';
import { routeUrl } from './routes';

/** storageState vazio: usado em rotas públicas e apps sem login. */
export const EMPTY_STORAGE_STATE = { cookies: [], origins: [] };

/** Executa o login configurado para a app. Chamado uma única vez pelo auth.setup.ts. */
export async function login(page: Page, target: Target) {
  const { auth } = target.app;
  const baseURL = target.env.baseURL;

  if (auth.type === 'form') {
    await page.goto(routeUrl(baseURL, auth.loginPath));
    await page.locator(auth.usernameSelector).fill(requireEnv(auth.usernameEnv));
    await page.locator(auth.passwordSelector).fill(requireEnv(auth.passwordEnv));
    await page.locator(auth.submitSelector).click();
    await expect(page.locator(auth.successSelector).first()).toBeVisible();
  } else if (auth.type === 'custom') {
    await auth.login({ page, baseURL, env: requireEnv });
  }
}
