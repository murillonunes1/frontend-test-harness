import type { Target } from '../config/load';

// Implementado na etapa de performance.
export async function runLighthouse(target: Target): Promise<number> {
  throw new Error(`Lighthouse ainda não configurado (${target.app.name})`);
}
