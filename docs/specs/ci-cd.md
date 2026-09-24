# CI/CD e infraestrutura

Alvo. Decisões 0008 e 0010 em `../decisoes.md`. Até a v8 entrar na `master`, tudo roda na `next`; a `master` só tem o CI atual.

## Containers

**Imagem única** `infra/docker/Dockerfile`: o servidor Fastify serve a API, o Socket.io e o build do web na mesma origem.

| Estágio | Faz |
| :-- | :-- |
| `deps` | `node:24-bookworm-slim`, `npm ci` com cache do BuildKit |
| `build` | Build de `packages/*`, `apps/web`, `apps/server` |
| `prod-deps` | `npm ci --omit=dev --workspace @sgm/server` (inclui o binário do `sharp`) |
| `runtime` | Copia `prod-deps`, os builds e as migrações. Usuário `node`, `tini`, `NODE_ENV=production`, `HEALTHCHECK` em `/healthz`, labels OCI. Mesma imagem roda `node dist/main.js` e `node dist/migrate.js` |

Enquanto o servidor for Express (até o bloco 3), a imagem roda o servidor atual e serve o `apps/web/dist` como estático; `/healthz` responde 200 simples.

`.dockerignore`: `node_modules`, `dist`, `.git`, `docs`, `e2e`, `.env*`. `.env.example` na raiz documenta todas as variáveis.

**Compose** (`infra/compose/`):

| Arquivo | Serviços | Uso |
| :-- | :-- | :-- |
| `compose.dev.yaml` | `postgres` 17 com healthcheck e volume | Dev: o app roda fora do Docker |
| `compose.e2e.yaml` | `postgres`, `app` (imagem local) | Playwright no CI e local |
| `compose.prod.yaml` | `caddy` (HTTPS automático), `migrate` (roda antes do app), `app`, `postgres` (sem porta externa), `backup` (`pg_dump` diário, 7 diários e 4 semanais) | Produção. Volume `media` em `/data/media`, incluído no backup |

O mesmo `compose.prod.yaml` serve para rede local (sem domínio, Caddy em HTTP).

## Workflows (`.github/workflows/`)

| Arquivo | Job | Faz |
| :-- | :-- | :-- |
| `ci.yml` | `check` | `npm ci` e `npm run check`. Nome fixo: é o check exigido pelas regras do GitHub |
| `ci.yml` | `e2e` | Depois do `check`: build da imagem (buildx com cache do GitHub), sobe `compose.e2e.yaml`, roda Playwright (roteiro de 4 passos, viewport 390x844). Traces como artefato se falhar |
| `ci.yml` | `publish` | Só em push na `next`: envia a imagem ao GHCR com tag `sha-<curto>` e `next` |
| `pr-title.yml` | `pr-title` | Título do PR em Conventional Commits |
| `deploy.yml` | `deploy` | Bloco 3. Manual (`workflow_dispatch` com o SHA): SSH no VPS, `pull`, `run --rm migrate` (para se falhar), `up -d app`, espera `/readyz` 60 s, volta para a versão anterior se falhar |

Regras: `concurrency` por ref cancelando execuções antigas; Node pela `.nvmrc`; `permissions: contents: read` (e `packages: write` só no `publish`); actions na versão maior (`@v4`). PR em menos de 15 min.

`dependabot.yml`: semanal para `npm`, `github-actions` e `docker`, patch e minor agrupados. Precisa estar na branch padrão (`master`) com `target-branch: next`, por PR para a `master`.

## Scripts da raiz

| Script | Faz |
| :-- | :-- |
| `npm run dev` | Web e server em watch (Postgres pelo `compose.dev.yaml` a partir do bloco 3) |
| `npm run check` | Formatação, tamanho dos docs, lint, tipos, fronteiras, testes, build |
| `npm run test:e2e` | Sobe `compose.e2e.yaml` e roda o Playwright |
| `npm run db:generate`, `db:migrate` | Drizzle (bloco 3) |

## Repositório

- `master` e `next` protegidas: só por PR, checks `check`, `e2e` e `pr-title`, histórico linear, sem force push. Sem aprovação obrigatória.
- Hooks locais em `.githooks/` (ver `AGENTS.md`). Template de PR em `.github/`.
