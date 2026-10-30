import { expect, type APIResponse } from '@playwright/test';
import type { z } from 'zod';

interface ContractOptions {
  status?: number;
  /** Tempo máximo de resposta em ms (medido pelo chamador). */
  maxDurationMs?: number;
  durationMs?: number;
}

/**
 * Valida status, content-type e corpo da resposta contra um schema zod.
 * Campos extras são permitidos (o front não deve quebrar com campos novos);
 * campos ausentes ou com tipo errado quebram o contrato.
 */
export async function expectContract<T extends z.ZodType>(
  response: APIResponse,
  schema: T,
  { status = 200, maxDurationMs, durationMs }: ContractOptions = {},
): Promise<z.output<T>> {
  expect(response.status(), `status de ${response.url()}`).toBe(status);
  expect(response.headers()['content-type'] ?? '').toContain('application/json');

  const body: unknown = await response.json();
  const parsed = schema.safeParse(body);
  const issues = parsed.success
    ? []
    : parsed.error.issues.map((i) => `${i.path.join('.') || '(raiz)'}: ${i.message}`);
  expect(issues, `contrato violado em ${response.url()}`).toEqual([]);

  if (maxDurationMs !== undefined && durationMs !== undefined) {
    expect(durationMs, `tempo de resposta de ${response.url()}`).toBeLessThan(maxDurationMs);
  }
  return parsed.data as z.output<T>;
}

/** Executa a chamada medindo a duração. */
export async function timed(call: () => Promise<APIResponse>) {
  const start = performance.now();
  const response = await call();
  return { response, durationMs: performance.now() - start };
}
