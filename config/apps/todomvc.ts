import { defineApp } from '../schema';

/**
 * Exemplo de app sem login: a demo pública do TodoMVC mantida pelo time do Playwright.
 * Use este arquivo como modelo (veja também config/apps/_template.ts).
 */
export default defineApp({
  name: 'todomvc',
  description: 'TodoMVC (React) — demo pública do Playwright',
  environments: {
    production: {
      baseURL: 'https://demo.playwright.dev/todomvc/',
      // A demo não tem backend; a JSONPlaceholder faz o papel da API consumida pelo front
      // para demonstrar os testes de contrato.
      apiURL: 'https://jsonplaceholder.typicode.com/',
    },
  },
  defaultEnv: 'production',
  auth: { type: 'none' },
  routes: [
    { name: 'home', path: '#/', readySelector: '.new-todo' },
    { name: 'active', path: '#/active', readySelector: '.new-todo', skip: ['visual', 'perf'] },
    {
      name: 'completed',
      path: '#/completed',
      readySelector: '.new-todo',
      skip: ['visual', 'perf'],
    },
  ],
  budgets: {
    categories: { performance: 0.8, accessibility: 0.8, 'best-practices': 0.8, seo: 0.6 },
    metrics: {
      'largest-contentful-paint': 4000,
      'cumulative-layout-shift': 0.1,
      'total-blocking-time': 600,
    },
  },
});
