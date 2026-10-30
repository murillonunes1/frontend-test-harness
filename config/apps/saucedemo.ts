import { defineApp } from '../schema';

/**
 * Exemplo de app com login por formulário e fluxo de checkout.
 * Credenciais vêm de SAUCEDEMO_USER / SAUCEDEMO_PASSWORD (veja .env.example).
 */
export default defineApp({
  name: 'saucedemo',
  description: 'Swag Labs — loja de demonstração da Sauce Labs',
  environments: {
    production: { baseURL: 'https://www.saucedemo.com/' },
  },
  defaultEnv: 'production',
  // A app usa data-test em vez de data-testid.
  testIdAttribute: 'data-test',
  auth: {
    type: 'form',
    loginPath: '',
    usernameSelector: '[data-test="username"]',
    passwordSelector: '[data-test="password"]',
    submitSelector: '[data-test="login-button"]',
    successSelector: '[data-test="inventory-container"]',
    usernameEnv: 'SAUCEDEMO_USER',
    passwordEnv: 'SAUCEDEMO_PASSWORD',
  },
  // Achado real da demo: o host responde HTTP 404 em deep links da SPA (a página
  // renderiza via fallback). Em uma app sua isso seria bug; aqui fica como exceção.
  console: { ignore: ['^404 GET https://www\\.saucedemo\\.com/(inventory|cart)\\.html$'] },
  links: { ignore: ['/(inventory|cart)\\.html$'] },
  routes: [
    { name: 'login', path: '', readySelector: '[data-test="login-button"]' },
    {
      name: 'inventory',
      path: 'inventory.html',
      auth: true,
      readySelector: '[data-test="inventory-container"]',
    },
    {
      name: 'cart',
      path: 'cart.html',
      auth: true,
      readySelector: '[data-test="cart-list"]',
      skip: ['perf'],
    },
  ],
  budgets: {
    categories: { performance: 0.7, accessibility: 0.8, 'best-practices': 0.8 },
    metrics: { 'largest-contentful-paint': 4000, 'cumulative-layout-shift': 0.1 },
  },
});
