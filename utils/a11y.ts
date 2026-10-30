import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, type TestInfo } from '@playwright/test';
import type { AppConfig, RouteConfig } from '../config/schema';

type AxeResults = Awaited<ReturnType<AxeBuilder['analyze']>>;

/** Varre a página com axe usando as tags e exceções da app + da rota. */
export async function scanA11y(page: Page, app: AppConfig, route?: RouteConfig) {
  const disabled = [...app.a11y.disableRules, ...(route?.a11y.disableRules ?? [])].map((r) => r.id);
  let builder = new AxeBuilder({ page }).withTags(app.a11y.tags);
  if (disabled.length) builder = builder.disableRules(disabled);
  for (const selector of route?.a11y.exclude ?? []) builder = builder.exclude(selector);
  return builder.analyze();
}

/** Resumo legível: uma linha por regra violada, com impacto e nós afetados. */
export function formatViolations(violations: AxeResults['violations']): string[] {
  return violations.map((v) => {
    const targets = v.nodes
      .slice(0, 3)
      .map((n) => n.target.join(' '))
      .join(', ');
    const more = v.nodes.length > 3 ? ` (+${v.nodes.length - 3})` : '';
    return `[${v.impact}] ${v.id}: ${v.help} → ${targets}${more} (${v.helpUrl})`;
  });
}

/** Anexa o resultado completo ao relatório e falha se houver violações. */
export async function expectNoA11yViolations(results: AxeResults, testInfo: TestInfo) {
  await testInfo.attach('axe-results.json', {
    body: JSON.stringify(results.violations, null, 2),
    contentType: 'application/json',
  });
  expect(formatViolations(results.violations), 'Violações WCAG encontradas').toEqual([]);
}
