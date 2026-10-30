import { test as base, expect, type Page } from '@playwright/test';
import type { Target } from '../config/load';
import { target } from './target';

export interface Diagnostics {
  consoleErrors: string[];
  pageErrors: string[];
  /** Respostas 4xx/5xx recebidas pela página (inclui assets e XHR). */
  failedResponses: string[];
  /** Falha o teste se algo foi coletado. */
  expectClean(): void;
}

function collectDiagnostics(page: Page, ignore: RegExp[]): Diagnostics {
  const isIgnored = (text: string) => ignore.some((re) => re.test(text));
  const d: Diagnostics = {
    consoleErrors: [],
    pageErrors: [],
    failedResponses: [],
    expectClean() {
      expect.soft(d.pageErrors, 'Exceções JS não tratadas').toEqual([]);
      expect.soft(d.consoleErrors, 'Erros no console').toEqual([]);
      expect.soft(d.failedResponses, 'Requisições com status >= 400').toEqual([]);
    },
  };
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    // Já registrado com URL e status em failedResponses.
    if (msg.text().startsWith('Failed to load resource')) return;
    if (!isIgnored(msg.text())) d.consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => {
    if (!isIgnored(err.message)) d.pageErrors.push(err.message);
  });
  page.on('response', (res) => {
    const line = `${res.status()} ${res.request().method()} ${res.url()}`;
    if (res.status() >= 400 && !isIgnored(line)) d.failedResponses.push(line);
  });
  return d;
}

export const test = base.extend<{ diagnostics: Diagnostics }, { target: Target }>({
  target: [
    async ({}, use) => {
      await use(target);
    },
    { scope: 'worker' },
  ],
  diagnostics: async ({ page, target }, use) => {
    const ignore = target.app.console.ignore.map((p) => new RegExp(p));
    await use(collectDiagnostics(page, ignore));
  },
});

export { expect };
