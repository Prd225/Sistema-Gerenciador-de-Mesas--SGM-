# Plano de modernização (v8)

Ordem de execução. O **o quê** está em `../specs/`; o porquê, em `../decisoes.md`. Revisado em 2026-09-24.

Feito (antigas fases 0 a 2): repositório alinhado, error boundaries e z-index, testes com Vitest, monorepo (`apps/web`, `apps/server`, `packages/shared`, `packages/engine`), `dependency-cruiser`, `npm run check`, hooks, CI com `check` e `pr-title`.

Regras: um bloco por vez (o 2 e o 3 podem ser divididos em vários PRs). Nada de itens de outro bloco. Marque os checkboxes no mesmo PR.

## Bloco 1 — Docker e CI (concluído)

Spec: `../specs/ci-cd.md`.

- [x] Limpeza: dependências da raiz só `concurrently`, `dependency-cruiser`, `oxlint`, `prettier`, `typescript`; aliases `@shared` antigos (tsconfigs de web e server, `vite.config.ts`, `vitest.config.ts`); `tsconfig.node.json` da raiz se nada usar; arquivos mortos `packages/shared/src/game.ts`, `multiplayer.ts`, `auth.ts`.
- [x] `infra/docker/Dockerfile` multi-stage, `.dockerignore`, `.env.example`. O servidor atual serve o `apps/web/dist` e responde `/healthz`.
- [x] `infra/compose/compose.dev.yaml`, `compose.e2e.yaml`, `compose.prod.yaml` (Caddy, migrate, app, postgres, backup).
- [x] Playwright em `apps/web/e2e/` com o roteiro de 4 passos (desktop e 390x844) e `npm run test:e2e`.
- [x] `ci.yml`: manter `check`, adicionar `e2e` e `publish` (GHCR, só push na `next`).
- [x] `docs/architecture/overview.md`: como rodar com Docker (curto).

Fora deste bloco (Ronald faz): `dependabot.yml` por PR na `master`, regras de proteção no GitHub.

## Bloco 2 — Engine, modo local e front novo (atual)

Specs: `../specs/code-architecture.md`, `../specs/system-design.md` (seções 2 e 4), `../specs/ui-design-system.md`. O multiplayer antigo sai no 2a e volta no bloco 3.

Etapas na ordem, uma branch e um PR por etapa. Cada etapa termina com `npm run check`, E2E e o roteiro de 4 passos verdes. "Paralelo" = um subagente por item, cada um num worktree e só nas pastas do item; o agente principal junta e valida.

### 2a — Tirar o legado do caminho

- [x] Remover o multiplayer antigo. Servidor: `roomManager.ts`, `handlers/` e o Socket.io do `index.ts`. Web: `lib/socket.ts`, `useMultiplayerStore`, `MultiplayerModal`, funções `*FromRemote` e botões de sala. Tirar a regra "Multiplayer antigo" do `AGENTS.md`.
- [x] Web para de importar `@sgm/shared`: os tipos que o front usa passam a ser definidos em `apps/web/src/types/` (somem no 2d).
- [x] `@sgm/shared` no formato novo: `Campaign { table, panel }`, `TableState`, `Scene`, coleções em `Record`, `imageRef`, `ownerMemberId`, `visibility`, comandos, eventos, envelope e erros da seção 4. Schema e tipo com o mesmo nome, com limites. Apagar os `*Schema` e o que não estiver no spec (`api/auth` fica até o bloco 3).

### 2b — Engine e base do design system (paralelo, 2 agentes)

- [x] Engine (só `packages/engine`): `applyCommand` com todos os comandos, `can` pela tabela da seção 4, `projectFor` com todos os segredos. immer, sem I/O, tempo e ids por parâmetro. Teste de cada comando, permissão negada e segredo. Cobertura mínima de 90% no vitest.
- [x] UI (só config do web e `src/ui/`): Tailwind v4 (`@tailwindcss/upgrade`), tokens em `@theme` e `ui/tokens.ts`, mover `components/ui` para `src/ui/` (nas telas, só os imports), primitivos e componentes de domínio da seção 3, `ResponsivePanel`, sonner, DOMPurify, error boundary reutilizável, guarda no CI com a lista de exceções de hoje. Atualizar `AGENTS.md` e `docs/architecture/design-system.md`. As telas ainda não migram.

### 2c — Camada `room/`

- [ ] `RoomConnection`, `LocalRoomConnection` (engine e Dexie com debounce), `room-store`, `useRoom(selector)`, `useCommand()`. Sem tela nova.
- [ ] Dexie com versão nova: `campaigns`, `media` (hash, Blob), imagens `local:<hash>` via `lib/media.ts`. As tabelas antigas ficam até o 2d. Tipar o `PanelState` do `shared` (hoje `z.unknown()`). Importar e exportar JSON validado por `Campaign` (inválido é descartado com aviso).
- [ ] Testes da `LocalRoomConnection` com fake-indexeddb.

### 2d — Virada da mesa

- [ ] TanStack Router: `/` (lista de campanhas: criar, abrir, apagar, importar, exportar) e `/campanha/$id`.
- [ ] Mapa, tokens, zonas, marcadores, fundos, iniciativa e cenas leem com `useRoom` e alteram com `useCommand`. O painel do mestre salva em `campaign.panel`.
- [ ] Remover `useTokenStore`, `useZoneStore`, `useScenesStore`, a parte de mesa do `useCampaignStore`, `saveHelpers.ts`, `types/` e as tabelas antigas do Dexie.
- [ ] O roteiro de 4 passos e o `smoke.spec.ts` começam criando uma campanha. Atualizar `docs/architecture/` para o código novo.

### 2e — Features e telas (paralelo por grupo)

- [ ] Primeiro, sozinho: mover para `app/`, `routes/`, `features/`, `lib/` sem mudar comportamento e ligar as regras de `web/` no `dependency-cruiser`. Estrutura de temas (tokens por `data-theme`, Konva lendo o tema ativo), seletor ainda escondido.
- [ ] Grupo mapa: `features/battlemap`, `tokens`, `zones`. Dividir `StageMap.tsx`, `ZoneMarkerModal.tsx`, `TokenSheetModal.tsx`, `GeneralTab.tsx`.
- [ ] Grupo mesa: `features/initiative`, `scenes`, `campaigns` e o layout. Menu de contexto manual vira `ContextMenu`.
- [ ] Grupo painel: `features/panel/` diary, notes, rules, tables, roulettes.
- [ ] Grupo som: `features/panel/soundpad`. Refazer a usabilidade mantendo playlists, login do Spotify e YouTube.
- [ ] Final, sozinho: screenshots do Playwright em 390x844, 1024x768 e 1440x900 nos temas escuro e claro; lista de exceções da guarda vazia; seletor de tema visível; docs de arquitetura atualizados.

Cada grupo: só primitivos e tokens, três faixas da seção 4 do spec de UI, error boundary por região, arquivos até 300 linhas, sem `alert`/`confirm`/`prompt`/`title=`, e tira seus arquivos da lista de exceções.

## Bloco 3 — Servidor e nuvem

Specs: `../specs/system-design.md`, `../specs/code-architecture.md` (servidor).

- [ ] Fastify com `fastify-type-provider-zod`, `env.ts`, plugins (helmet, cors só em dev, rate-limit, static), `/healthz` e `/readyz`, pino. Remover Express, `pg` direto, `bcryptjs`, auth antigo.
- [ ] Drizzle (`campaigns`, `rooms`, `room_members`, `media`) e migrações. Better Auth (e-mail, Google).
- [ ] API: campanhas (CRUD, `PATCH panel`), salas (`POST /api/rooms`, fechar), mídia (`sharp`, hash).
- [ ] `realtime/`: gateway, handshake, `live-rooms` (fila, `applyCommand`, `projectFor`), `persist` (2 s, `SIGTERM`).
- [ ] Cliente: `RemoteRoomConnection` (previsão, lacuna de versão, reconexão), rotas `/sala/$code`, `/tv/$code`, `/entrar`, "Salvar na nuvem", código e QR.
- [ ] Testes de integração (dois clientes, permissão negada, segredo, reconexão, restart) e E2E com dois navegadores.
- [ ] `deploy.yml` manual e VPS com `compose.prod.yaml`.

## Depois (sem data)

Métricas, log e replay de sessão, roadmap de funcionalidades (`roadmap-features.md`), `apps/ocr-worker`.

## Pronto =

`npm run check` e E2E verdes; roteiro de 4 passos no navegador se mexeu no web; comando novo com schema, caso no engine e teste de permissão negada; docs atualizados no mesmo PR.
