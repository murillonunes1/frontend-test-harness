import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { config as loadDotenv } from 'dotenv';
import { appConfigSchema, type AppConfig, type EnvironmentConfig } from './schema';

loadDotenv({ quiet: true });

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APPS_DIR = path.join(ROOT, 'config', 'apps');

/** Apps disponíveis = arquivos .ts em config/apps (exceto os iniciados por "_"). */
export function listApps(): string[] {
  return readdirSync(APPS_DIR)
    .filter((f) => f.endsWith('.ts') && !f.startsWith('_'))
    .map((f) => f.replace(/\.ts$/, ''))
    .sort();
}

export async function loadApp(name: string): Promise<AppConfig> {
  const available = listApps();
  if (!available.includes(name)) {
    throw new Error(
      `App "${name}" não encontrada em config/apps. Disponíveis: ${available.join(', ')}`,
    );
  }
  const mod = await import(pathToFileURL(path.join(APPS_DIR, `${name}.ts`)).href);
  const parsed = appConfigSchema.safeParse(mod.default);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
    throw new Error(`Config inválida em config/apps/${name}.ts:\n${issues.join('\n')}`);
  }
  if (parsed.data.name !== name) {
    throw new Error(`config/apps/${name}.ts declara name="${parsed.data.name}"; use "${name}".`);
  }
  return parsed.data;
}

export interface Target {
  app: AppConfig;
  envName: string;
  env: EnvironmentConfig;
  /** Arquivo de storageState gerado pelo projeto "setup". */
  authFile: string;
  /** Pasta de relatórios desta combinação app/ambiente. */
  reportDir: string;
}

/**
 * Resolve a app/ambiente alvo a partir de APP e ENV (definidos pelo scripts/run.ts).
 * BASE_URL e API_URL sobrescrevem as URLs do arquivo, útil para preview deploys.
 */
export async function resolveTarget(
  appName = process.env.APP,
  envName = process.env.ENV,
): Promise<Target> {
  const apps = listApps();
  // Variáveis vazias (ex.: input não preenchido no GitHub Actions) contam como ausentes.
  const name = appName || (apps.length === 1 ? apps[0] : undefined);
  if (!name) {
    throw new Error(
      `Informe a app com --app=<nome> (ou APP=<nome>). Disponíveis: ${apps.join(', ')}`,
    );
  }
  const app = await loadApp(name);
  const resolvedEnv = envName || app.defaultEnv;
  const env = app.environments[resolvedEnv];
  if (!env) {
    throw new Error(
      `Ambiente "${resolvedEnv}" não existe para ${name}. Disponíveis: ${Object.keys(app.environments).join(', ')}`,
    );
  }
  const slug = `${name}-${resolvedEnv}`;
  return {
    app,
    envName: resolvedEnv,
    env: {
      baseURL: process.env.BASE_URL ?? env.baseURL,
      apiURL: process.env.API_URL ?? env.apiURL,
    },
    authFile: path.join(ROOT, '.auth', `${slug}.json`),
    reportDir: path.join(ROOT, 'reports', slug),
  };
}

/** Lê uma variável obrigatória com mensagem de erro útil. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente ${name} não definida. Veja .env.example.`);
  }
  return value;
}
