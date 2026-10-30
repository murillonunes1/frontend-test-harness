import { defineApp } from '../schema';

/**
 * Modelo comentado. Copie para config/apps/<sua-app>.ts (sem o "_") e ajuste.
 * Arquivos iniciados por "_" são ignorados pelo carregador.
 */
export default defineApp({
  // Igual ao nome do arquivo; usado em --app=minha-app
  name: 'minha-app',
  description: 'Painel interno de exemplo',

  environments: {
    local: { baseURL: 'http://localhost:3000/', apiURL: 'http://localhost:4000/' },
    staging: {
      baseURL: 'https://staging.minha-app.com/',
      apiURL: 'https://api.staging.minha-app.com/',
    },
    production: { baseURL: 'https://minha-app.com/', apiURL: 'https://api.minha-app.com/' },
  },
  defaultEnv: 'staging',

  // Padrão: data-testid. Troque se a app já usa outro atributo.
  testIdAttribute: 'data-testid',

  // Opções: { type: 'none' } | { type: 'form', ... } | { type: 'custom', login: async ({ page, baseURL, env }) => {...} }
  auth: {
    type: 'form',
    loginPath: 'login',
    usernameSelector: '[data-testid="login-email"]',
    passwordSelector: '[data-testid="login-password"]',
    submitSelector: '[data-testid="login-submit"]',
    successSelector: '[data-testid="app-shell"]',
    usernameEnv: 'MINHA_APP_USER',
    passwordEnv: 'MINHA_APP_PASSWORD',
  },

  // Cada rota recebe automaticamente: smoke, links, a11y, visual e performance.
  routes: [
    { name: 'login', path: 'login', readySelector: '[data-testid="login-form"]' },
    {
      name: 'dashboard',
      path: 'dashboard',
      auth: true,
      readySelector: '[data-testid="dashboard"]',
      visual: { mask: ['[data-testid="current-date"]'] },
      a11y: {
        exclude: ['#chat-widget-de-terceiro'],
        disableRules: [{ id: 'region', reason: 'Gráfico legado sem landmark — ticket ABC-123' }],
      },
      skip: ['perf'],
    },
  ],

  console: { ignore: ['Download the React DevTools'] },
  links: { checkExternal: false, maxPerPage: 50, ignore: ['/logout'] },
  a11y: { tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'], disableRules: [] },
  budgets: {
    categories: { performance: 0.8, accessibility: 0.9, 'best-practices': 0.9, seo: 0.8 },
    metrics: {
      'largest-contentful-paint': 2500,
      'cumulative-layout-shift': 0.1,
      'total-blocking-time': 300,
    },
    level: 'error',
    runs: 3,
  },
});
