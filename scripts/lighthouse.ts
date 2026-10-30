import { spawnSync } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { ROOT, type Target } from '../config/load';
import { buildLhciConfig } from '../tests/performance/lighthouserc';

/** Roda o Lighthouse CI para a app/ambiente alvo. Retorna o exit code do lhci. */
export async function runLighthouse(target: Target): Promise<number> {
  const { config, urls } = buildLhciConfig(target, chromium.executablePath());
  const label = `${target.app.name} (${target.envName})`;
  if (urls.length === 0) {
    console.log(`\n▶ Lighthouse ${label}: nenhuma rota pública com perf habilitado, pulando.`);
    return 0;
  }

  // Cada app/ambiente tem sua própria pasta de trabalho (.lighthouseci fica dentro dela).
  const workDir = path.join(target.reportDir, 'lhci');
  await rm(workDir, { recursive: true, force: true });
  await rm(path.join(target.reportDir, 'lighthouse'), { recursive: true, force: true });
  await mkdir(workDir, { recursive: true });
  const configPath = path.join(workDir, 'lighthouserc.json');
  await writeFile(configPath, JSON.stringify(config, null, 2));

  console.log(`\n▶ Lighthouse ${label}: ${urls.join(', ')}`);
  const cli = path.join(ROOT, 'node_modules', '@lhci', 'cli', 'src', 'cli.js');
  const result = spawnSync(process.execPath, [cli, 'autorun', `--config=${configPath}`], {
    cwd: workDir,
    stdio: 'inherit',
  });
  return result.status ?? 1;
}
