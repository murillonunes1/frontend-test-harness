/**
 * Ponto de entrada dos scripts do package.json.
 *
 *   pnpm test:e2e --app=todomvc --env=production [args extras do Playwright]
 *   pnpm test                       # todos os tipos, todas as apps
 *   pnpm test:playwright --shard=1/2  # tudo menos Lighthouse (aceita args do Playwright)
 *
 * O Playwright rejeita flags desconhecidas, então --app/--env são lidos aqui,
 * viram APP/ENV e o restante é repassado.
 */
import { spawnSync } from 'node:child_process';
import { listApps, resolveTarget, ROOT } from '../config/load';

const TYPES = {
  generic: {
    projects: ['chromium', 'firefox', 'webkit', 'mobile-chrome', 'mobile-safari'],
    paths: ['tests/generic/'],
  },
  e2e: {
    projects: ['chromium', 'firefox', 'webkit', 'mobile-chrome', 'mobile-safari'],
    paths: ['tests/e2e/'],
  },
  a11y: { projects: ['a11y'], paths: [] },
  visual: { projects: ['visual'], paths: [] },
  api: { projects: ['api'], paths: [] },
} as const;
type PwType = keyof typeof TYPES;
const ALL_TYPES = ['generic', 'e2e', 'a11y', 'visual', 'api', 'perf', 'playwright'] as const;
type RunType = (typeof ALL_TYPES)[number] | 'all';

function parseArgs(argv: string[]) {
  const [type, ...rest] = argv;
  if (!type || (type !== 'all' && !ALL_TYPES.includes(type as never))) {
    throw new Error(`Tipo inválido: ${type}. Use: all, ${ALL_TYPES.join(', ')}`);
  }
  let app = process.env.APP || undefined;
  let env = process.env.ENV || undefined;
  const passthrough: string[] = [];
  for (const arg of rest) {
    if (arg === '--') continue; // separador inserido por alguns gerenciadores de pacote
    const m = arg.match(/^--(app|env)=(.+)$/);
    if (m?.[1] === 'app') app = m[2];
    else if (m?.[1] === 'env') env = m[2];
    else passthrough.push(arg);
  }
  return { type: type as RunType, apps: app ? app.split(',') : listApps(), env, passthrough };
}

function runPlaywright(app: string, env: string | undefined, types: PwType[], extra: string[]) {
  // --project explícito do usuário substitui os projetos padrão do tipo.
  const userPicked = extra.some((a) => a.startsWith('--project'));
  const projects = userPicked ? [] : [...new Set(types.flatMap((t) => TYPES[t].projects))];
  // Filtro por caminho só quando um único tipo de navegador foi pedido (generic x e2e).
  const paths = types.length === 1 ? [...TYPES[types[0]!].paths] : [];
  // Uma app pode não ter testes de um tipo (ex.: sem API): isso não é falha.
  const args = [
    'playwright',
    'test',
    '--pass-with-no-tests',
    ...projects.map((p) => `--project=${p}`),
    ...paths,
    ...extra,
  ];
  console.log(`\n▶ ${app}${env ? ` (${env})` : ''}: npx ${args.join(' ')}`);
  const result = spawnSync('npx', args, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, APP: app, ...(env ? { ENV: env } : {}) },
  });
  return result.status ?? 1;
}

async function main() {
  const { type, apps, env, passthrough } = parseArgs(process.argv.slice(2));
  // "playwright" = todos os tipos exceto Lighthouse (usado pelos shards do CI).
  const pwTypes: PwType[] =
    type === 'all' || type === 'playwright'
      ? ['generic', 'e2e', 'a11y', 'visual', 'api']
      : type === 'perf'
        ? []
        : [type];

  let failed = 0;
  for (const app of apps) {
    const target = await resolveTarget(app, env); // valida config/ambiente antes de rodar
    if (pwTypes.length > 0) failed += runPlaywright(app, env, pwTypes, passthrough) === 0 ? 0 : 1;
    if (type === 'perf' || type === 'all') {
      const { runLighthouse } = await import('./lighthouse');
      failed += (await runLighthouse(target)) === 0 ? 0 : 1;
    }
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err: Error) => {
  console.error(`✖ ${err.message}`);
  process.exit(1);
});
