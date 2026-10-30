import { resolveTarget } from '../config/load';

/** App/ambiente em teste, resolvido uma vez por processo a partir de APP/ENV. */
export const target = await resolveTarget();
