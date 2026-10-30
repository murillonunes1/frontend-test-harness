import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { test as setup } from '@playwright/test';
import { target } from '../fixtures/target';
import { EMPTY_STORAGE_STATE, login } from '../utils/auth';

// Loga uma vez e grava o storageState; todos os testes com auth reaproveitam o arquivo.
setup(`autenticar ${target.app.name} (${target.envName})`, async ({ page }) => {
  await mkdir(path.dirname(target.authFile), { recursive: true });

  if (target.app.auth.type === 'none') {
    await writeFile(target.authFile, JSON.stringify(EMPTY_STORAGE_STATE));
    return;
  }

  await login(page, target);
  await page.context().storageState({ path: target.authFile });
});
