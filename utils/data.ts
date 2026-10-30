import { fakerPT_BR as faker } from '@faker-js/faker';

// Semente fixa por execução permite reproduzir uma falha: FAKER_SEED=123 pnpm test:e2e ...
const seed = Number(process.env.FAKER_SEED ?? Date.now());
faker.seed(seed);

export { faker, seed };

/** Sufixo único para dados criados em ambientes compartilhados (evita colisão entre shards). */
export function uniqueId(prefix = 'e2e'): string {
  return `${prefix}-${Date.now().toString(36)}-${faker.string.alphanumeric(5).toLowerCase()}`;
}

export function buildPerson() {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email({ provider: 'example.com' }).toLowerCase(),
    postalCode: faker.location.zipCode('#####-###'),
  };
}
