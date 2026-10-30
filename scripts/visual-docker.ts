/**
 * Gera/atualiza as baselines visuais de Linux dentro da imagem oficial do Playwright,
 * para que fiquem idênticas às do CI mesmo rodando em Windows/macOS.
 *
 *   pnpm test:visual:update:docker --app=todomvc
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from '../config/load';

const pkg = JSON.parse(
  readFileSync(path.join(ROOT, 'node_modules/@playwright/test/package.json'), 'utf8'),
);
const image = `mcr.microsoft.com/playwright:v${pkg.version}-noble`;
const args = process.argv.slice(2).filter((a) => a !== '--');

const inner = [
  'corepack enable',
  // node_modules isolado no container: os binários do host (Windows/macOS) não servem no Linux.
  'pnpm install --frozen-lockfile --config.confirmModulesPurge=false',
  `pnpm test:visual:update ${args.join(' ')}`,
].join(' && ');

console.log(`▶ ${image}`);
const result = spawnSync(
  'docker',
  [
    'run',
    '--rm',
    '--ipc=host',
    '-v',
    `${ROOT}:/work`,
    '-v',
    '/work/node_modules',
    '-w',
    '/work',
    '--env-file',
    path.join(ROOT, '.env'),
    image,
    'bash',
    '-c',
    inner,
  ],
  { stdio: 'inherit' },
);
process.exit(result.status ?? 1);
