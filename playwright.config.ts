import path from 'node:path';
import { defineConfig, devices, type ReporterDescription } from '@playwright/test';
import { resolveTarget } from './config/load';

const target = await resolveTarget();
const { app, env, reportDir } = target;
const isCI = !!process.env.CI;

// Projetos que rodam em todos os navegadores: testes genéricos de rota + fluxos E2E da app.
const browserMatch = ['generic/**/*.spec.ts', `e2e/${app.name}/**/*.spec.ts`];

const reporters: ReporterDescription[] = isCI
  ? // blob-report/<app>-<env>/ é juntado entre shards no job de relatório do CI.
    [['github'], ['blob', { outputDir: path.join('blob-report', path.basename(reportDir)) }]]
  : [['list']];
reporters.push(
  ['html', { outputFolder: path.join(reportDir, 'playwright-html'), open: 'never' }],
  ['json', { outputFile: path.join(reportDir, 'results.json') }],
);

export default defineConfig({
  testDir: './tests',
  outputDir: path.join('test-results', `${app.name}-${target.envName}`),
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? '100%' : undefined,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled', caret: 'hide' },
  },
  // Baselines por app e SO: só as de Linux (CI/Docker) são versionadas.
  snapshotPathTemplate: `{testDir}/visual/__screenshots__/${app.name}/{platform}/{arg}{ext}`,
  reporter: reporters,
  use: {
    baseURL: env.baseURL,
    testIdAttribute: app.testIdAttribute,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  },
  metadata: { app: app.name, env: target.envName, baseURL: env.baseURL },
  projects: [
    { name: 'setup', testMatch: 'auth.setup.ts' },

    ...[
      { name: 'chromium', device: devices['Desktop Chrome'] },
      { name: 'firefox', device: devices['Desktop Firefox'] },
      { name: 'webkit', device: devices['Desktop Safari'] },
      { name: 'mobile-chrome', device: devices['Pixel 7'] },
      { name: 'mobile-safari', device: devices['iPhone 14'] },
    ].map(({ name, device }) => ({
      name,
      testMatch: browserMatch,
      dependencies: ['setup'],
      use: { ...device },
    })),

    // a11y e visual: só Chromium, viewport fixo, para resultados determinísticos.
    {
      name: 'a11y',
      testMatch: 'a11y/**/*.spec.ts',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'visual',
      testMatch: 'visual/**/*.spec.ts',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },

    // Contratos de API: sem navegador.
    {
      name: 'api',
      testMatch: `api/${app.name}/**/*.spec.ts`,
      use: { baseURL: env.apiURL },
    },
  ],
});
