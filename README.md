# frontend-test-harness

Bateria de testes **plugável** para aplicações front-end. Você aponta o repositório para uma ou mais
aplicações web (por URL), sem precisar do código-fonte delas, e roda:

| Tipo                 | Ferramenta                    | O que verifica                                                                                 |
| -------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------- |
| **Genéricos**        | Playwright                    | Cada rota carrega sem erros de console, exceções JS, respostas 4xx/5xx ou links quebrados      |
| **E2E**              | Playwright + Page Objects     | Fluxos críticos da app (login, formulários, checkout...) em Chromium, Firefox, WebKit e mobile |
| **Acessibilidade**   | @axe-core/playwright          | WCAG 2.1 AA em cada rota                                                                       |
| **Regressão visual** | `toHaveScreenshot`            | Screenshot de cada rota comparado a uma baseline versionada                                    |
| **Performance**      | Lighthouse CI                 | Notas de performance, a11y, boas práticas e SEO + métricas (LCP, CLS, TBT) contra budgets      |
| **Contratos de API** | `request` do Playwright + zod | Endpoints consumidos pelo front respondem no formato esperado                                  |

Os testes genéricos, de a11y, visual e de performance são **gerados a partir da lista de rotas** de
cada app. Adicionar uma app nova exige só um arquivo em `config/apps/` e as variáveis de ambiente dela.

> Este repositório é um **template**: use _Use this template_ no GitHub (ou faça um fork) e adicione
> suas aplicações. Ele vem com dois exemplos funcionando contra demos públicas: `todomvc` e `saucedemo`.

---

## Sumário

- [Instalação](#instalação)
- [Estrutura](#estrutura)
- [Como rodar](#como-rodar)
- [Adicionar uma nova aplicação](#adicionar-uma-nova-aplicação)
- [Autenticação](#autenticação)
- [Regressão visual e baselines](#regressão-visual-e-baselines)
- [Performance (Lighthouse)](#performance-lighthouse)
- [Contratos de API](#contratos-de-api)
- [Relatórios](#relatórios)
- [CI (GitHub Actions)](#ci-github-actions)
- [Convenções de escrita de testes](#convenções-de-escrita-de-testes)
- [Solução de problemas](#solução-de-problemas)
- [Decisões e limitações](#decisões-e-limitações)

---

## Instalação

Requisitos: **Node 20+** (o CI usa a versão do `.nvmrc`) e **pnpm 10+** (`corepack enable` instala a
versão fixada no `package.json`).

```bash
pnpm install
pnpm exec playwright install --with-deps   # navegadores: chromium, firefox, webkit
cp .env.example .env                       # preencha as credenciais
pnpm apps                                  # lista as apps configuradas
pnpm test:generic --app=todomvc            # primeiro teste
```

## Estrutura

```
config/
  schema.ts            # formato da config de uma app (validado com zod)
  load.ts              # resolve app/ambiente a partir de APP/ENV
  apps/
    _template.ts       # modelo comentado (arquivos com "_" são ignorados)
    todomvc.ts         # exemplo sem login
    saucedemo.ts       # exemplo com login e checkout
tests/
  auth.setup.ts        # loga uma vez e grava o storageState
  generic/             # smoke e links: rodam em qualquer app, a partir das rotas
  e2e/<app>/           # fluxos específicos de cada app
  a11y/                # varredura axe por rota
  visual/              # screenshots por rota + __screenshots__/<app>/<plataforma>/
  performance/         # gera a config do Lighthouse CI a partir dos budgets
  api/<app>/           # contratos dos endpoints (schemas zod)
pages/<app>/           # Page Objects
fixtures/              # fixtures do Playwright (diagnóstico, Page Objects por app)
utils/                 # auth, rotas, esperas, a11y, contratos, geração de dados
scripts/               # runner (--app/--env), Lighthouse, resumo, baselines via Docker
.github/               # workflows de CI e de atualização de baselines
```

## Como rodar

Todos os comandos aceitam `--app=<nome>` (uma ou várias separadas por vírgula) e `--env=<ambiente>`.
Sem `--app`, rodam **todas** as apps; sem `--env`, usam o `defaultEnv` de cada app.

| Comando                                        | O que roda                                                     |
| ---------------------------------------------- | -------------------------------------------------------------- |
| `pnpm test`                                    | Tudo: genéricos, E2E, a11y, visual, API e Lighthouse           |
| `pnpm test:playwright`                         | Tudo menos Lighthouse                                          |
| `pnpm test:generic`                            | Smoke e links das rotas, em todos os navegadores               |
| `pnpm test:e2e`                                | Fluxos de `tests/e2e/<app>/`, em todos os navegadores          |
| `pnpm test:a11y`                               | Acessibilidade (Chromium)                                      |
| `pnpm test:visual`                             | Regressão visual (Chromium, 1280×800)                          |
| `pnpm test:visual:update`                      | Regrava as baselines da sua plataforma                         |
| `pnpm test:visual:update:docker`               | Regrava as baselines **de Linux** (iguais às do CI) via Docker |
| `pnpm test:api`                                | Contratos de API                                               |
| `pnpm test:perf`                               | Lighthouse CI                                                  |
| `pnpm report --app=<nome>`                     | Abre o relatório HTML da última execução                       |
| `pnpm summary`                                 | Gera o resumo consolidado em `reports/summary.md`              |
| `pnpm apps`                                    | Lista apps e ambientes configurados                            |
| `pnpm lint` / `pnpm typecheck` / `pnpm format` | Qualidade de código                                            |

Qualquer argumento extra é repassado ao Playwright:

```bash
pnpm test:e2e --app=saucedemo --env=staging --project=chromium   # só um navegador
pnpm test:e2e --app=saucedemo -g "checkout"                      # filtra por título
pnpm test:e2e --app=saucedemo --headed --debug                   # depuração
pnpm test:playwright --app=todomvc --grep @smoke                 # por tag
BASE_URL=https://pr-42.preview.exemplo.com/ pnpm test:generic --app=minha-app  # sobrescreve a URL
```

Projetos do Playwright: `chromium`, `firefox`, `webkit`, `mobile-chrome` (Pixel 7) e
`mobile-safari` (iPhone 14) para genéricos/E2E; `a11y`, `visual` e `api` para os demais; `setup` faz o
login e é executado automaticamente antes.

## Adicionar uma nova aplicação

1. **Copie o modelo**: `cp config/apps/_template.ts config/apps/minha-app.ts` e ajuste `name` (igual ao
   nome do arquivo), ambientes, rotas, login e budgets. O arquivo é validado ao carregar; erros indicam
   o campo exato.
2. **Variáveis de ambiente**: acrescente as credenciais no `.env` (e no `.env.example`, sem valores).
   No CI, crie os _secrets_ com o mesmo nome e inclua-os no bloco `env:` de
   `.github/workflows/ci.yml` e `update-snapshots.yml`.
3. **Rode os genéricos**: `pnpm test:generic --app=minha-app`. Investigue o que falhar: erros reais
   devem ser corrigidos na app; exceções conscientes vão para a config (`console.ignore`,
   `links.ignore`, `a11y.disableRules` com `reason`).
4. **Gere as baselines visuais** (veja [abaixo](#regressão-visual-e-baselines)).
5. **Calibre os budgets**: rode `pnpm test:perf --app=minha-app`, veja as notas em `pnpm summary` e
   defina limites com alguma folga (o CI tem variação entre execuções).
6. **(Opcional) Fluxos específicos**: crie `pages/minha-app/`, uma fixture em
   `fixtures/minha-app.ts` e os testes em `tests/e2e/minha-app/`. Use `fixtures/saucedemo.ts` como modelo.
7. **(Opcional) Contratos de API**: defina `apiURL` nos ambientes e crie `tests/api/minha-app/`.

Nenhum teste genérico precisa ser alterado.

### Referência rápida da config

| Campo                                   | Para que serve                                                                          |
| --------------------------------------- | --------------------------------------------------------------------------------------- |
| `environments.<env>.baseURL` / `apiURL` | URLs por ambiente. Termine com `/` se a app vive num subcaminho                         |
| `defaultEnv`                            | Ambiente usado quando `--env` não é informado                                           |
| `testIdAttribute`                       | Atributo de `getByTestId()` (padrão `data-testid`)                                      |
| `auth`                                  | `none`, `form` (seletores + nomes das variáveis) ou `custom` (função)                   |
| `routes[].path`                         | Caminho **relativo à baseURL** (`""` = a própria baseURL; `#/x` para hash routing)      |
| `routes[].auth`                         | Rota exige login (usa o storageState)                                                   |
| `routes[].readySelector`                | Elemento que indica página pronta. Evita esperas arbitrárias                            |
| `routes[].skip`                         | Tipos genéricos a pular: `smoke`, `links`, `a11y`, `visual`, `perf`                     |
| `routes[].visual.mask`                  | Seletores mascarados no screenshot (datas, conteúdo dinâmico)                           |
| `routes[].a11y`                         | `exclude` (seletores) e `disableRules` (com `reason`) só para a rota                    |
| `console.ignore`                        | Regex de erros tolerados: console, exceções e respostas (`"404 GET https://..."`)       |
| `links`                                 | `checkExternal`, `maxPerPage`, `ignore`                                                 |
| `a11y`                                  | `tags` do axe (padrão WCAG 2.1 A/AA) e `disableRules` globais                           |
| `budgets`                               | `categories` (nota mínima 0–1), `metrics` (máximo em ms), `formFactor`, `level`, `runs` |

## Autenticação

O projeto `setup` (`tests/auth.setup.ts`) faz login **uma vez por execução** e grava o estado em
`.auth/<app>-<env>.json` (fora do git). Rotas com `auth: true` e fixtures de app reaproveitam esse
arquivo via `storageState`, sem logar a cada teste.

- **`form`**: preenche usuário/senha a partir das variáveis indicadas em `usernameEnv`/`passwordEnv`
  e espera `successSelector`.
- **`custom`**: para SSO, OTP ou login via API. Recebe `{ page, baseURL, env }`:

  ```ts
  auth: {
    type: 'custom',
    login: async ({ page, baseURL, env }) => {
      // Ex.: obter sessão por API e injetar o cookie — mais rápido e estável que a UI do SSO.
      const res = await page.request.post(new URL('api/test-session', baseURL).toString(), {
        data: { token: env('MINHA_APP_TEST_TOKEN') },
      });
      if (!res.ok()) throw new Error(`login falhou: ${res.status()}`);
    },
  },
  ```

- Testes que exercitam o próprio login começam deslogados com
  `test.use({ storageState: EMPTY_STORAGE_STATE })` (veja `tests/e2e/saucedemo/login.spec.ts`).

**Segredos ficam só em variáveis de ambiente.** Os arquivos de config guardam apenas o _nome_ da
variável. `.env` e `.auth/` estão no `.gitignore`.

## Regressão visual e baselines

As baselines ficam em `tests/visual/__screenshots__/<app>/<plataforma>/<rota>.png`. A renderização de
fontes muda entre sistemas operacionais, por isso **somente as baselines `linux` são versionadas**; elas
são as usadas pelo CI. As de `win32`/`darwin` são geradas localmente e ignoradas pelo git.

Para atualizar depois de uma mudança visual **intencional**:

| Opção                            | Como                                                                                                                   |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **GitHub Actions** (recomendado) | _Actions → Atualizar baselines visuais → Run workflow_, escolha o branch e a app. O workflow gera e commita as imagens |
| **Docker**                       | `pnpm test:visual:update:docker --app=minha-app` (usa a imagem oficial do Playwright, igual ao CI)                     |
| **Local, só para você**          | `pnpm test:visual:update --app=minha-app` (gera baselines da sua plataforma, não versionadas)                          |

Revise o diff das imagens no PR antes de aprovar. Conteúdo dinâmico (datas, banners rotativos,
avatares) deve ser mascarado em `routes[].visual.mask`, e não resolvido aumentando a tolerância.

## Performance (Lighthouse)

`pnpm test:perf` gera a configuração do Lighthouse CI a partir da app (`tests/performance/lighthouserc.ts`),
roda `budgets.runs` vezes por URL usando o Chromium do Playwright e compara a **mediana** com os budgets:

```ts
budgets: {
  categories: { performance: 0.8, accessibility: 0.9, 'best-practices': 0.9, seo: 0.8 },
  metrics: { 'largest-contentful-paint': 2500, 'cumulative-layout-shift': 0.1, 'total-blocking-time': 300 },
  formFactor: 'mobile',   // ou 'desktop'
  level: 'error',         // 'warn' registra sem quebrar o build
  runs: 3,
}
```

Rotas com `auth: true` não entram no Lighthouse (ele usa um navegador próprio, sem o storageState).

## Contratos de API

Os testes em `tests/api/<app>/` usam o `request` do Playwright com `baseURL = apiURL` do ambiente e
validam respostas com schemas zod via `expectContract()`:

```ts
const todos = await expectContract(await request.get('todos'), todoListSchema);
```

O contrato descreve **o que o front usa**: campos extras são aceitos, campos ausentes ou com tipo
errado quebram o teste. `expectContract` também verifica status, `content-type` e, opcionalmente,
o tempo de resposta.

## Relatórios

Tudo fica em `reports/<app>-<env>/` (fora do git):

| Arquivo                                     | Conteúdo                                                          |
| ------------------------------------------- | ----------------------------------------------------------------- |
| `playwright-html/`                          | Relatório HTML do Playwright: abra com `pnpm report --app=<nome>` |
| `results.json`                              | Resultado em JSON (usado pelo resumo)                             |
| `lighthouse/*.html`                         | Relatório completo do Lighthouse de cada execução                 |
| `lighthouse/manifest.json`                  | Notas de cada execução; `isRepresentativeRun` marca a mediana     |
| `lhci/.lighthouseci/assertion-results.json` | Budgets avaliados e quais falharam                                |
| `../summary.md`                             | Resumo consolidado (`pnpm summary`)                               |

Os traces, vídeos e screenshots de falhas ficam em `test-results/`.

**Como interpretar:**

- **Falha em smoke** → o anexo do teste lista os erros por categoria: _Exceções JS_, _Erros no console_,
  _Requisições com status ≥ 400_. Abra o **trace** (`pnpm exec playwright show-trace <trace.zip>` ou
  pelo relatório HTML) para ver rede, console e DOM passo a passo.
- **Falha em a11y** → cada linha traz impacto, regra, elementos afetados e link para a explicação da
  Deque. O JSON completo do axe está anexado ao teste.
- **Falha visual** → o relatório mostra _expected_, _actual_ e _diff_, com um slider para comparar.
- **Flaky** → passou só após retry (no CI). Trate como bug: o teste ou a app têm uma condição de corrida.
- **Budget estourado** → o resumo mostra métrica, limite e valor obtido; abra o HTML do Lighthouse
  para ver as oportunidades de melhoria.

No CI, o resumo aparece na aba **Summary** da execução, e o artefato `relatorio-consolidado` contém
todos os relatórios.

## CI (GitHub Actions)

`.github/workflows/ci.yml` roda:

- em **pull requests**, em **push na `main`**, por **agendamento** (dias úteis às 06:00 de Brasília) e
  **manualmente** (com escolha de app e ambiente);
- `quality` → lint, typecheck, formatação e lista de apps;
- `playwright` → matriz **app × 2 shards**, com `retries: 2` só no CI. Em falha, envia o artefato
  `falhas-<app>-<shard>` com traces, vídeos e screenshots;
- `lighthouse` → uma execução por app;
- `report` → junta os shards de cada app (`merge-reports`), publica o resumo e o artefato
  `relatorio-consolidado`.

**Secrets:** configure as credenciais em _Settings → Secrets and variables → Actions_ e exponha-as no
bloco `env:` dos workflows. As credenciais da `saucedemo` têm um valor padrão porque são públicas
(aparecem na tela de login da demo). Nunca faça isso com credenciais reais.

Para mudar o número de shards, altere `shard: [1, 2]` e o `--shard=${{ matrix.shard }}/2`.

## Convenções de escrita de testes

### Seletores, em ordem de preferência

1. **Por papel e nome acessível**: `page.getByRole('button', { name: 'Salvar' })`. Também testa
   a acessibilidade.
2. **Por label/placeholder/texto**: `getByLabel('E-mail')`, `getByPlaceholder(...)`.
3. **Por test id**: `getByTestId('checkout-submit')`, quando não há papel/texto estável (ícones,
   listas, textos traduzidos ou dinâmicos).
4. ~~CSS/XPath acoplado a estilo ou estrutura~~ (`.btn-primary > span:nth-child(2)`): evite.

### Convenção de `data-testid` para os times de front

- **Formato**: `<área>-<elemento>[-<qualificador>]`, em kebab-case, em inglês ou português, mas
  consistente na app. Exemplos: `login-email`, `login-submit`, `cart-item`, `cart-item-remove`,
  `checkout-total`, `nav-menu-toggle`.
- **Itens de lista**: o mesmo test id em todos os itens (`product-card`) e um atributo de dados
  para a identidade (`data-product-id="123"`). No teste, use `getByTestId('product-card').filter({ hasText })`.
- **Estável**: não pode depender de texto, idioma, estilo, índice ou id gerado em build.
- **Presente em produção**: não remova no build. Os testes rodam também contra produção.
- **Contrato**: renomear ou remover um test id é uma _breaking change_ para a suíte. Avise no PR.
- **Marcador de "pronto"**: exponha um test id no contêiner principal de cada página
  (`dashboard-page`, `product-list`) para ser usado como `readySelector`.
- Se a app já usa outro atributo (ex.: `data-test`), configure `testIdAttribute` em vez de renomear.

### Esperas

- **Nunca** use `page.waitForTimeout()` (o lint bloqueia). Use asserções _web-first_, que já
  esperam: `await expect(locator).toBeVisible()`, `toHaveText`, `toHaveURL`, `toHaveCount`.
- Para aguardar uma chamada de rede específica, use `waitForResponseOk` (`utils/waits.ts`),
  registrando a espera _antes_ da ação que dispara a requisição:

  ```ts
  const saved = waitForResponseOk(page, '/api/orders');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await saved;
  ```

- Evite `networkidle`: aplicações com polling ou analytics nunca ficam ociosas.

### Organização

- **Page Objects** expõem _locators_ e ações de negócio (`addToCart`, `login`), e não asserções. As
  asserções ficam no teste.
- Cada teste é **independente**: não dependa da ordem nem de dados criados por outro teste.
- Dados criados em ambientes compartilhados usam `uniqueId()` / `faker` (`utils/data.ts`).
  `FAKER_SEED=<n>` reproduz uma execução.
- Títulos descrevem comportamento: `'finaliza checkout com dois itens'`.
- Tags: `@smoke`, `@e2e`, `@a11y`, `@visual`, `@api`. Filtre com `--grep @smoke`.
- Exceções (a11y, console, links) ficam **na config, com justificativa**, e não em `if` no teste.

## Solução de problemas

| Sintoma                                        | Causa provável                                                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `Informe a app com --app=<nome>`               | Há mais de uma app e o comando precisa de uma (ex.: `pnpm report`)                                      |
| `Variável de ambiente X não definida`          | Falta no `.env` ou nos secrets/`env:` do workflow                                                       |
| Rotas autenticadas caem no login               | Sessão expirou ou `successSelector` aparece antes do cookie ser gravado. Apague `.auth/` e rode de novo |
| Visual falha só no CI                          | Baseline gerada em outro SO. Use o workflow ou o script Docker                                          |
| Visual falha com diferença pequena e aleatória | Conteúdo dinâmico ou animação. Use `visual.mask`                                                        |
| Lighthouse oscila                              | Aumente `budgets.runs` e dê folga aos limites. Rede do CI varia                                         |
| `No tests found`                               | Não ocorre via `pnpm test:*` (usa `--pass-with-no-tests`). Confira o caminho `tests/e2e/<app>/`         |

## Decisões e limitações

- **zod** valida as configs e os contratos de API com mensagens claras. **@faker-js/faker** gera dados.
  **tsx** roda os scripts em TypeScript.
- **Runner próprio** (`scripts/run.ts`): o Playwright rejeita flags desconhecidas como `--app`, então o
  runner as converte em `APP`/`ENV` e repassa o resto.
- **a11y e visual só no Chromium**: os resultados quase não variam entre motores, e rodar nos cinco
  projetos multiplicaria o tempo sem ganho real.
- **Links quebrados** verificam só o mesmo domínio por padrão (`links.checkExternal`).
- **Lighthouse não cobre rotas autenticadas** (veja [Performance](#performance-lighthouse)).
- **Exemplos usam demos públicas**: a disponibilidade e o conteúdo delas podem mudar. Os achados reais
  encontrados nelas (contraste no TodoMVC, HTTP 404 em deep links do saucedemo) estão registrados como
  exceções nas configs, para demonstrar o mecanismo.

## Licença

[MIT](LICENSE)
