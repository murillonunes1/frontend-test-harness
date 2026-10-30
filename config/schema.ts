import type { Page } from '@playwright/test';
import { z } from 'zod';

/** Tipos de teste genérico que uma rota pode pular individualmente. */
export const GENERIC_CHECKS = ['smoke', 'links', 'a11y', 'visual', 'perf'] as const;

const ruleExceptionSchema = z.object({
  id: z.string().describe('ID da regra do axe-core, ex.: "color-contrast"'),
  reason: z.string().min(10, 'Explique por que a regra está desativada (mín. 10 caracteres)'),
});

const routeSchema = z.object({
  /** Identificador estável: vira nome de teste e de arquivo de snapshot. */
  name: z.string().regex(/^[a-z0-9-]+$/, 'Use kebab-case: letras minúsculas, números e hífen'),
  /** Caminho relativo à baseURL do ambiente ("" ou "/" = a própria baseURL). */
  path: z.string(),
  /** Rota exige usuário logado (usa o storageState gerado no setup). */
  auth: z.boolean().default(false),
  /** Seletor que indica que a página terminou de carregar (prefira [data-testid=...]). */
  readySelector: z.string().optional(),
  /** Testes genéricos que não se aplicam a esta rota. */
  skip: z.array(z.enum(GENERIC_CHECKS)).default([]),
  visual: z
    .object({
      /** Seletores mascarados no screenshot (datas, avatares, conteúdo dinâmico). */
      mask: z.array(z.string()).default([]),
      fullPage: z.boolean().default(true),
      maxDiffPixelRatio: z.number().min(0).max(1).optional(),
    })
    .default({ mask: [], fullPage: true }),
  a11y: z
    .object({
      /** Seletores fora do escopo da varredura (ex.: widgets de terceiros). */
      exclude: z.array(z.string()).default([]),
      disableRules: z.array(ruleExceptionSchema).default([]),
    })
    .default({ exclude: [], disableRules: [] }),
});

const environmentSchema = z.object({
  /** URL base do front. Termine com "/" quando a app vive num subcaminho. */
  baseURL: z.url(),
  /** URL base da API consumida pelo front (testes de contrato). */
  apiURL: z.url().optional(),
});

/** Login por formulário: cobre a maioria dos casos de e-mail/senha. */
const formAuthSchema = z.object({
  type: z.literal('form'),
  loginPath: z.string(),
  usernameSelector: z.string(),
  passwordSelector: z.string(),
  submitSelector: z.string(),
  /** Seletor visível somente após login bem-sucedido. */
  successSelector: z.string(),
  /** Nomes das variáveis de ambiente com as credenciais (nunca os valores). */
  usernameEnv: z.string(),
  passwordEnv: z.string(),
});

export type CustomLogin = (args: {
  page: Page;
  baseURL: string;
  env: (name: string) => string;
}) => Promise<void>;

/** Login programático (SSO, OTP, API de sessão...). */
const customAuthSchema = z.object({
  type: z.literal('custom'),
  login: z.custom<CustomLogin>((v) => typeof v === 'function', 'login deve ser uma função'),
});

const authSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('none') }),
  formAuthSchema,
  customAuthSchema,
]);

const budgetsSchema = z.object({
  /** Notas mínimas (0–1) das categorias do Lighthouse. */
  categories: z
    .object({
      performance: z.number().min(0).max(1).optional(),
      accessibility: z.number().min(0).max(1).optional(),
      'best-practices': z.number().min(0).max(1).optional(),
      seo: z.number().min(0).max(1).optional(),
    })
    .default({}),
  /** Limites máximos de métricas, em ms (CLS é adimensional). */
  metrics: z
    .object({
      'first-contentful-paint': z.number().positive().optional(),
      'largest-contentful-paint': z.number().positive().optional(),
      'total-blocking-time': z.number().nonnegative().optional(),
      'cumulative-layout-shift': z.number().nonnegative().optional(),
      'speed-index': z.number().positive().optional(),
    })
    .default({}),
  /** "error" quebra o build; "warn" só registra. */
  level: z.enum(['error', 'warn']).default('error'),
  /** Execuções por URL (a mediana é usada nas asserções). */
  runs: z.number().int().min(1).max(9).default(3),
});

export const appConfigSchema = z
  .object({
    /** Identificador usado em --app=<name>. Deve ser igual ao nome do arquivo. */
    name: z.string().regex(/^[a-z0-9-]+$/),
    description: z.string().optional(),
    environments: z.record(z.string(), environmentSchema).refine((e) => Object.keys(e).length > 0, {
      message: 'Defina pelo menos um ambiente',
    }),
    defaultEnv: z.string(),
    /** Atributo usado por page.getByTestId(). Ex.: "data-test" em apps legadas. */
    testIdAttribute: z.string().default('data-testid'),
    auth: authSchema.default({ type: 'none' }),
    routes: z.array(routeSchema).min(1),
    console: z
      .object({
        /**
         * Regex (string) de erros tolerados. Vale para mensagens de console, exceções JS
         * e respostas >= 400 (formato "404 GET https://...").
         */
        ignore: z.array(z.string()).default([]),
      })
      .default({ ignore: [] }),
    links: z
      .object({
        /** Verifica também links para outros domínios. */
        checkExternal: z.boolean().default(false),
        /** Limite de links verificados por página. */
        maxPerPage: z.number().int().positive().default(50),
        /** Regex (string) de URLs que não devem ser verificadas. */
        ignore: z.array(z.string()).default([]),
      })
      .default({ checkExternal: false, maxPerPage: 50, ignore: [] }),
    a11y: z
      .object({
        tags: z.array(z.string()).default(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']),
        /** Exceções válidas para todas as rotas. Cada uma exige justificativa. */
        disableRules: z.array(ruleExceptionSchema).default([]),
      })
      .default({ tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'], disableRules: [] }),
    budgets: budgetsSchema.default({ categories: {}, metrics: {}, level: 'error', runs: 3 }),
  })
  .refine((c) => c.defaultEnv in c.environments, {
    message: 'defaultEnv precisa existir em environments',
    path: ['defaultEnv'],
  })
  .refine((c) => new Set(c.routes.map((r) => r.name)).size === c.routes.length, {
    message: 'Nomes de rota devem ser únicos',
    path: ['routes'],
  });

export type AppConfigInput = z.input<typeof appConfigSchema>;
export type AppConfig = z.output<typeof appConfigSchema>;
export type RouteConfig = AppConfig['routes'][number];
export type EnvironmentConfig = AppConfig['environments'][string];

/** Helper para os arquivos em config/apps: dá autocomplete e valida no carregamento. */
export function defineApp(config: AppConfigInput): AppConfigInput {
  return config;
}
