import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['node_modules', 'reports', 'test-results', 'blob-report', '.lighthouseci'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: globals.node },
  },
  {
    files: ['tests/**/*.ts', 'pages/**/*.ts', 'fixtures/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Esperas fixas deixam a suíte lenta e instável: use asserções web-first.
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-force-option': 'error',
      'playwright/no-page-pause': 'error',
      'playwright/no-focused-test': 'error',
      'playwright/prefer-web-first-assertions': 'error',
      // Testes genéricos são gerados a partir da config, por isso usam laços.
      'playwright/valid-title': 'off',
      'playwright/no-conditional-in-test': 'off',
      'playwright/no-skipped-test': ['error', { allowConditional: true }],
      'playwright/expect-expect': [
        'warn',
        { assertFunctionNames: ['expectNoA11yViolations', 'expectContract'] },
      ],
    },
  },
  {
    // O setup valida o login dentro de utils/auth.ts.
    files: ['tests/auth.setup.ts'],
    rules: { 'playwright/expect-expect': 'off' },
  },
  prettier,
);
