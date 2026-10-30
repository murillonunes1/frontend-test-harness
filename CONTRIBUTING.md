# Contribuindo

Obrigado por contribuir! Este guia vale tanto para quem adiciona uma app quanto para quem melhora a
infraestrutura da suíte.

## Fluxo

1. Crie um branch a partir da `main`: `feat/minha-app`, `fix/links-redirect`, `docs/...`.
2. Rode localmente o que você mudou, por exemplo `pnpm test:generic --app=minha-app`.
3. Antes do PR: `pnpm lint && pnpm typecheck && pnpm format:check`.
4. Abra o PR descrevendo **o que** mudou e **por quê**. Se houver baselines visuais novas, explique a
   mudança visual esperada.

Commits seguem [Conventional Commits](https://www.conventionalcommits.org/pt-br/):
`feat:`, `fix:`, `test(e2e):`, `test(visual):`, `ci:`, `docs:`, `chore:`.

## Regras

- **Testes genéricos** (`tests/generic`, `a11y`, `visual`, `performance`) não podem conter nada
  específico de uma app. Se uma app precisa de comportamento diferente, crie uma opção no
  `config/schema.ts` (com default compatível) e documente no README.
- **Testes específicos** ficam em `tests/e2e/<app>/` e `tests/api/<app>/` e usam Page Objects de
  `pages/<app>/`.
- **Sem `waitForTimeout`**, sem `force: true` e sem `test.only`. O lint barra os três.
- **Seletores** por role/label/test id, conforme as
  [convenções do README](README.md#convenções-de-escrita-de-testes).
- **Exceções** (regras de a11y, erros de console tolerados, links ignorados) vão na config da app,
  sempre com justificativa e, de preferência, com o link do ticket que corrige o problema.
- **Segredos** nunca entram no repositório: só em `.env` local e nos Secrets do GitHub.
- **Baselines visuais**: commite apenas as de `linux`, geradas pelo workflow _Atualizar baselines
  visuais_ ou por `pnpm test:visual:update:docker`.
- Um teste flaky é um bug: corrija ou abra uma issue. Não aumente retries nem timeouts para escondê-lo.
