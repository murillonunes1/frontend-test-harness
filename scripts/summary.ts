/**
 * Resumo consolidado em Markdown de todas as execuções em reports/<app>-<env>/:
 * resultados do Playwright (results.json) + Lighthouse (manifest e asserções).
 *
 * Localmente imprime e grava reports/summary.md; no GitHub Actions também
 * escreve em $GITHUB_STEP_SUMMARY.
 */
import { appendFile, readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { stripVTControlCharacters } from 'node:util';
import { ROOT } from '../config/load';

interface PwResult {
  status: string;
  error?: { message?: string };
}
interface PwTest {
  projectName: string;
  status: 'expected' | 'unexpected' | 'flaky' | 'skipped';
  results: PwResult[];
}
interface PwSpec {
  title: string;
  file: string;
  tests: PwTest[];
}
interface PwSuite {
  title: string;
  specs?: PwSpec[];
  suites?: PwSuite[];
}
interface PwReport {
  stats: {
    expected: number;
    unexpected: number;
    flaky: number;
    skipped: number;
    duration: number;
  };
  suites: PwSuite[];
}
interface LhManifestEntry {
  url: string;
  isRepresentativeRun: boolean;
  summary: Record<string, number>;
}
interface LhAssertion {
  auditId: string;
  auditProperty?: string;
  name: string;
  expected: number;
  actual: number;
  passed: boolean;
  level: string;
  url: string;
}

const REPORTS = path.join(ROOT, 'reports');

async function readJson<T>(file: string): Promise<T | undefined> {
  if (!existsSync(file)) return undefined;
  return JSON.parse(await readFile(file, 'utf8')) as T;
}

function collectFailures(suites: PwSuite[], parents: string[] = []): string[] {
  const out: string[] = [];
  for (const suite of suites) {
    const trail = suite.title && !suite.title.endsWith('.ts') ? [...parents, suite.title] : parents;
    for (const spec of suite.specs ?? []) {
      for (const t of spec.tests.filter((t) => t.status === 'unexpected' || t.status === 'flaky')) {
        const last = t.results.at(-1);
        const msg =
          stripVTControlCharacters(last?.error?.message ?? '')
            .split('\n')[0]
            ?.slice(0, 200) ?? '';
        const icon = t.status === 'flaky' ? '⚠️ flaky' : '❌';
        out.push(
          `| ${icon} | \`${t.projectName}\` | ${[...trail, spec.title].join(' › ')} | ${msg.replace(/\|/g, '\\|')} |`,
        );
      }
    }
    out.push(...collectFailures(suite.suites ?? [], trail));
  }
  return out;
}

const pct = (n: number | undefined) => (n === undefined ? '–' : String(Math.round(n * 100)));

async function main() {
  const dirs = existsSync(REPORTS)
    ? (await readdir(REPORTS, { withFileTypes: true }))
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
    : [];

  const lines: string[] = ['# Resumo da bateria de testes', ''];
  const failures: string[] = [];
  const lhRows: string[] = [];
  const lhFailures: string[] = [];
  let anyFailure = false;

  lines.push(
    '## Playwright',
    '',
    '| App / ambiente | ✅ | ❌ | ⚠️ flaky | ⏭️ | Duração |',
    '|---|---:|---:|---:|---:|---:|',
  );
  for (const dir of dirs.sort()) {
    const report = await readJson<PwReport>(path.join(REPORTS, dir, 'results.json'));
    if (report) {
      const s = report.stats;
      anyFailure ||= s.unexpected > 0;
      lines.push(
        `| ${dir} | ${s.expected} | ${s.unexpected} | ${s.flaky} | ${s.skipped} | ${(s.duration / 1000).toFixed(0)}s |`,
      );
      failures.push(...collectFailures(report.suites).map((l) => `| ${dir} ${l}`));
    }

    const manifest = await readJson<LhManifestEntry[]>(
      path.join(REPORTS, dir, 'lighthouse', 'manifest.json'),
    );
    for (const run of (manifest ?? []).filter((r) => r.isRepresentativeRun)) {
      const s = run.summary;
      lhRows.push(
        `| ${dir} | ${run.url} | ${pct(s.performance)} | ${pct(s.accessibility)} | ${pct(s['best-practices'])} | ${pct(s.seo)} |`,
      );
    }
    const assertions = await readJson<LhAssertion[]>(
      path.join(REPORTS, dir, 'lhci', '.lighthouseci', 'assertion-results.json'),
    );
    for (const a of (assertions ?? []).filter((a) => !a.passed)) {
      anyFailure ||= a.level === 'error';
      const metric = a.auditProperty ? `${a.auditId}.${a.auditProperty}` : a.auditId;
      lhFailures.push(
        `| ${a.level === 'error' ? '❌' : '⚠️'} | ${dir} | ${a.url} | ${metric} | ${a.name} ${a.expected} | ${Number(a.actual.toFixed(3))} |`,
      );
    }
  }
  if (failures.length) {
    lines.push(
      '',
      '### Falhas',
      '',
      '| App / ambiente | | Projeto | Teste | Erro |',
      '|---|---|---|---|---|',
      ...failures,
    );
  }
  if (lhRows.length) {
    lines.push(
      '',
      '## Lighthouse (execução representativa)',
      '',
      '| App / ambiente | URL | Perf | A11y | Boas práticas | SEO |',
      '|---|---|---:|---:|---:|---:|',
      ...lhRows,
    );
  }
  if (lhFailures.length) {
    lines.push(
      '',
      '### Budgets estourados',
      '',
      '| | App / ambiente | URL | Métrica | Esperado | Obtido |',
      '|---|---|---|---|---|---|',
      ...lhFailures,
    );
  }
  if (!dirs.length) lines.push('', '_Nenhum resultado encontrado em reports/._');
  lines.push('', anyFailure ? '**Resultado: ❌ há falhas**' : '**Resultado: ✅ tudo verde**', '');

  const markdown = lines.join('\n');
  console.log(markdown);
  await writeFile(path.join(REPORTS, 'summary.md'), markdown).catch(() => undefined);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, markdown);
}

main().catch((err: Error) => {
  console.error(err);
  process.exit(1);
});
