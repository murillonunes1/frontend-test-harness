import path from 'node:path';
import type { Target } from '../../config/load';
import { routeUrl, routesFor } from '../../utils/routes';

/**
 * Monta a configuração do Lighthouse CI a partir de config/apps/<app>.ts.
 * Não há lighthouserc fixo: URLs e budgets vêm sempre da config da app.
 *
 * Limitação: rotas com auth: true ficam de fora (o Lighthouse abre um navegador
 * próprio, sem o storageState do Playwright).
 */
export function buildLhciConfig(target: Target, chromePath: string) {
  const { app, env, reportDir } = target;
  const { budgets } = app;
  const urls = routesFor(app, 'perf')
    .filter((r) => !r.auth)
    .map((r) => routeUrl(env.baseURL, r.path));

  const assertions: Record<string, [string, Record<string, unknown>]> = {};
  for (const [category, minScore] of Object.entries(budgets.categories)) {
    if (minScore !== undefined) {
      assertions[`categories:${category}`] = [
        budgets.level,
        { minScore, aggregationMethod: 'median-run' },
      ];
    }
  }
  for (const [metric, maxNumericValue] of Object.entries(budgets.metrics)) {
    if (maxNumericValue !== undefined) {
      assertions[metric] = [budgets.level, { maxNumericValue, aggregationMethod: 'median-run' }];
    }
  }

  return {
    urls,
    config: {
      ci: {
        collect: {
          url: urls,
          numberOfRuns: budgets.runs,
          chromePath,
          settings: {
            preset: budgets.formFactor === 'desktop' ? 'desktop' : undefined,
            chromeFlags: '--headless=new --no-sandbox --disable-dev-shm-usage',
            onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
          },
        },
        assert: { assertions },
        upload: {
          target: 'filesystem',
          outputDir: path.join(reportDir, 'lighthouse'),
          reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%',
        },
      },
    },
  };
}
