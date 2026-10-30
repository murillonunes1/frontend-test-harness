import type { AppConfig, RouteConfig } from '../config/schema';
import { GENERIC_CHECKS } from '../config/schema';

type GenericCheck = (typeof GENERIC_CHECKS)[number];

/** URL absoluta da rota. O path é sempre relativo à baseURL (inclusive subcaminhos). */
export function routeUrl(baseURL: string, routePath: string): string {
  const base = baseURL.endsWith('/') ? baseURL : `${baseURL}/`;
  return new URL(routePath.replace(/^\//, ''), base).toString();
}

/** Rotas da app que participam de um tipo de teste genérico. */
export function routesFor(app: AppConfig, check: GenericCheck): RouteConfig[] {
  return app.routes.filter((r) => !r.skip.includes(check));
}
