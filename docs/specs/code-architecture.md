# Arquitetura de código

Estrutura alvo e fronteiras. Comportamento em `system-design.md`. Decisões 0007 e 0009.

## Princípios

1. Regra de jogo só em `@sgm/engine`, funções puras, iguais no cliente e no servidor.
2. A UI manda comandos para uma `RoomConnection` (local: engine + Dexie; remota: socket). A tela não sabe o modo.
3. Cliente organizado por funcionalidade (`features/<nome>/`).
4. Contratos primeiro: entidades, comandos, eventos e rotas são schemas Zod em `@sgm/shared`.
5. Dependências numa direção, verificadas pelo `dependency-cruiser`.

## Pacotes

```
apps/web/          @sgm/web
apps/server/       @sgm/server
apps/ocr-worker/   reservado (futuro, fora do plano): container próprio, sem import de código
packages/shared/   @sgm/shared   src/domain, protocol, api, constants. Só zod
packages/engine/   @sgm/engine   state, apply, commands/<grupo>, permissions (can), project (projectFor). Só shared e immer
infra/docker/, infra/compose/
```

- shared: cada arquivo exporta schema e tipo com o mesmo nome (`export const Token = z.object(...)`, `export type Token = z.infer<typeof Token>`). Limites de string e array nos schemas.
- engine: sem I/O, `Date.now()` ou `Math.random()` (tempo e ids por parâmetro). Imutável. Cobertura mínima 90%.

## Cliente (`apps/web/src/`)

```
app/        providers, router, layout, error boundaries
routes/     /, /campanha/$id, /sala/$code, /tv/$code, /entrar. Finas: só montam features
features/   battlemap, tokens, zones, initiative, scenes, campaigns, room, auth,
            panel/(diary, notes, rules, tables, roulettes, soundpad). Cada uma com index.ts público
room/       connection.ts, local-connection.ts, remote-connection.ts, room-store.ts, hooks.ts (useRoom, useCommand)
lib/        db.ts (Dexie: campaigns, media), media.ts, api.ts, utils
ui/         primitivos shadcn e componentes de domínio (StatBar, ElementBadge, TokenAvatar)
```

| Estado | Onde |
| :-- | :-- |
| Mesa (`table`) | Só no `room-store`. Ler com `useRoom(selector)`, alterar com `useCommand()` |
| Painel (`panel`) | Store da feature; salvo direto (Dexie ou `PATCH /api/campaigns/:id/panel`) |
| UI (ferramenta, seleção, zoom) | `useState` ou store da feature |
| HTTP | TanStack Query |

Migração: `canvas/` → `features/battlemap`; `components/master-panel/<sub>` → `features/panel/<sub>`; `components/ui` → `ui/`; `lib/socket.ts` + `useMultiplayerStore` → `room/remote-connection.ts`; `useTokenStore`, `useZoneStore`, `useScenesStore` e parte do `useCampaignStore` → `room-store` + engine; `saveHelpers.ts` e `types/` (reexports) removidos.

## Servidor (`apps/server/src/`)

```
main.ts, app.ts (buildApp, usado nos testes), env.ts (Zod)
plugins/    db, auth, security (helmet, cors só em dev, rate-limit), static
modules/    auth, campaigns, rooms, media, health: routes.ts + service.ts (service usa o Drizzle direto)
realtime/   gateway.ts (socket, handshake, Zod, rate limit), live-rooms.ts (salas em memória,
            fila por sala, applyCommand, projectFor, envio), persist.ts (grava a mesa com debounce)
db/         schema.ts, migrations/, client.ts
```

## Convenções

- Arquivos em `kebab-case`, componentes em `PascalCase`, exports nomeados. Arquivo acima de 300 linhas é dividido.
- Comandos `dominio.verbo`, eventos no particípio.
- Testes ao lado do arquivo; integração em `apps/server/test/`; E2E em `apps/web/e2e/`.
- Entre pacotes, import pelo nome (`@sgm/shared`). No web, alias `@/`.

| De | Pode importar | Não pode |
| :-- | :-- | :-- |
| shared | zod | Pacotes do projeto |
| engine | shared, immer | React, Node, I/O |
| web, server | shared, engine | Um ao outro |
| web/routes | `features/*/index.ts`, `app/`, `ui/` | Interior de features |
| web/features/X | `room/`, `lib/`, `ui/`, `features/Y/index.ts` | Interior de outra feature |
| web/ui, web/lib | Bibliotecas externas | `features/`, `room/`, `routes/` |
| web/room | engine, `lib/` | `features/` |
| server/modules/X | `db/`, `plugins/`, `modules/Y/service.ts` | `realtime/` |
| server/realtime | engine, `modules/*/service.ts` | `modules/*/routes.ts` |
