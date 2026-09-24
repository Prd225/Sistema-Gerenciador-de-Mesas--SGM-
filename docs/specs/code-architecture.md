# Arquitetura de Código

Estrutura alvo, camadas e fronteiras. Comportamento em `system-design.md`. Decisões 0006 e 0007.

## 1. Princípios

1. **Regra de jogo num lugar só**: `@sgm/engine`, funções puras, rodando igual no cliente e no servidor.
2. **Offline e online são o mesmo fluxo**: a UI manda comandos para uma `RoomConnection`. A local roda o engine no navegador e salva no Dexie; a remota usa o socket e o servidor roda o mesmo engine.
3. **Por funcionalidade**: tudo de zonas em `features/zones/`, não espalhado por `components/`, `store/`, `types/`.
4. **Dependências numa direção**, verificadas no CI (seção 5).
5. **Contratos primeiro**: entidades, comandos, eventos e rotas são schemas Zod em `@sgm/shared`.

## 2. Pacotes

```
apps/web/          @sgm/web     SPA React
apps/server/       @sgm/server  Fastify + Socket.io
apps/ocr-worker/   (futuro)     OCR + LLM, seção 6
packages/shared/   @sgm/shared  contratos
packages/engine/   @sgm/engine  regras do jogo
infra/docker/      Dockerfile, Caddyfile
infra/compose/     compose.dev/e2e/prod.yaml
```

**shared** (`src/domain/`, `protocol/`, `api/`, `constants/`): só depende de `zod`. Cada arquivo exporta schema e tipo com o mesmo nome (`Token` e `z.infer<typeof Token>`). Limites de tamanho de string e array ficam nos schemas.

**engine** (`state.ts`, `apply.ts`, `commands/<grupo>.ts`, `permissions.ts` com `can()`, `project.ts` com `projectFor`/`projectEvent`): só depende de `@sgm/shared` e `immer`. Sem I/O, `Date.now()` ou `Math.random()`: tempo e ids entram por parâmetro. Estado imutável. Cobertura mínima de 90%.

## 3. Servidor (`apps/server/src/`)

```
main.ts          sobe o servidor, shutdown gracioso no SIGTERM
app.ts           buildApp(): Fastify + plugins + módulos (usado nos testes)
config/env.ts    variáveis de ambiente validadas com Zod
plugins/         db, auth, cors, helmet, rate-limit, static, sensible
modules/<nome>/  routes.ts -> service.ts -> repository.ts (auth, campaigns, rooms, media, health)
realtime/        gateway.ts, handshake.ts, room-registry.ts (fila por sala), broadcaster.ts, room-store.ts
db/              schema/ (Drizzle), migrations/, client.ts
observability/   logger, métricas
test/integration/
```

Só o `repository.ts` fala com o banco. A camada `realtime/` é escrita à mão sobre Socket.io.

## 4. Cliente (`apps/web/src/`)

```
app/            providers, router, error-boundary, layout/ (AppShell, Header, Footer)
routes/         TanStack Router, finas: /, /sala/$code, /tv/$code, /login
features/<nome>/ components/, hooks/, store.ts (UI), api.ts (Query), model.ts (lógica pura), index.ts (API pública)
room/           connection.ts, local-connection.ts, remote-connection.ts, room-store.ts, hooks.ts (useRoom, useCommand)
persistence/    db.ts (Dexie), campaigns-repo.ts, media-repo.ts
shared/         ui/ (shadcn), components/ (ElementBadge, StatBar, TokenAvatar), hooks/, lib/, styles/
```

Features: battlemap, tokens, zones, initiative, scenes, campaign, room, auth, master-panel (só o contêiner), notes, diary, rules, tables, roulettes, soundpad.

Onde fica cada estado:
- **Sala** (tokens, zonas, marcadores, fundos, iniciativa): só no `room-store`. Ler com `useRoom(selector)`, alterar com `useCommand()`.
- **UI** (ferramenta, seleção, zoom): `store.ts` da feature ou `useState`.
- **HTTP** (usuário, campanhas): cache do TanStack Query.
- Autosave deixa de existir: a `LocalRoomConnection` persiste cada comando confirmado.

Migração do código atual: `canvas/` → `features/battlemap`; modais e sidebars → a feature do seu conteúdo; `components/master-panel/<sub>` → `features/<sub>`; `components/layout` → `app/layout`; `components/ui` → `shared/ui`; `lib/db.ts` → `persistence/`; `lib/socket.ts` e `useMultiplayerStore` → `room/remote-connection.ts`; `useTokenStore`, `useZoneStore` e parte de `useCampaignStore` → `room-store` + engine; demais stores → `features/<nome>/store.ts`; `saveHelpers.ts` é removido. No servidor: `roomManager` e `socketHandlers` → `realtime/` + engine; auth → `modules/auth` (Better Auth); `db/` → Drizzle.

## 5. Convenções e fronteiras

- Arquivos e pastas em `kebab-case`. Componentes em `PascalCase`, um público por arquivo. Exports nomeados.
- Comandos `dominio.verbo` (`token.move`), eventos no particípio (`token.moved`).
- Testes ao lado do arquivo (`apply.test.ts`); integração em `apps/server/test/`, E2E em `apps/web/e2e/`. Stories ao lado do componente.
- Entre pacotes, import pelo nome (`@sgm/shared`). No web, alias `@/`.
- Arquivo com mais de 300 linhas é dividido.

Regras do `dependency-cruiser` (violação falha o CI; ciclos proibidos):

| De | Pode importar | Não pode |
| :--- | :--- | :--- |
| shared | `zod` | Qualquer pacote do projeto |
| engine | shared, `immer` | React, Node, I/O |
| server / web | shared, engine | um ao outro |
| web/routes | `features/*/index.ts`, `app/`, `shared/` | Interior de features |
| web/features/X | `room/`, `persistence/`, `shared/`, `features/Y/index.ts` | Interior de outra feature |
| web/shared | Bibliotecas externas | `features/`, `room/`, `routes/` |
| web/room | engine, `persistence/`, `shared/lib` | `features/` |
| server/modules/X | `db/`, `plugins/`, `observability/`, `modules/Y/service.ts` | `repository.ts` alheio, `realtime/` |
| server/realtime | engine, `db/`, `modules/*/service.ts`, `observability/` | `modules/*/routes.ts` |

## 6. Reservado: `apps/ocr-worker` (futuro)

Importação de fichas por foto (roadmap, seção 4.1). Fora de todas as fases atuais.

- Processo e container próprios, provavelmente Python, fora dos npm workspaces, com job de CI próprio.
- Nenhum import de código em nenhum sentido. O servidor cria um job (imagem de `/api/media` + sistema de RPG), o worker devolve JSON e o servidor valida com o schema da ficha em `@sgm/shared`.
- Transporte (HTTP interno ou fila no Postgres) será decidido quando o worker for planejado.
