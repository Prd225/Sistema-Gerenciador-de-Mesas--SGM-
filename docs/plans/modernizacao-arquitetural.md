# Plano de modernização (v8)

Ordem de execução. O **o quê** está em `../specs/`; o porquê, em `../decisoes.md`. Revisado em 2026-09-24.

Feito (antigas fases 0 a 2): repositório alinhado, error boundaries e z-index, testes com Vitest, monorepo (`apps/web`, `apps/server`, `packages/shared`, `packages/engine`), `dependency-cruiser`, `npm run check`, hooks, CI com `check` e `pr-title`.

Regras: um bloco por vez (o 2 e o 3 podem ser divididos em vários PRs). Nada de itens de outro bloco. Marque os checkboxes no mesmo PR.

## Bloco 1 — Docker e CI (atual)

Spec: `../specs/ci-cd.md`.

- [ ] Limpeza: dependências da raiz só `concurrently`, `dependency-cruiser`, `oxlint`, `prettier`, `typescript`; aliases `@shared` antigos (tsconfigs de web e server, `vite.config.ts`, `vitest.config.ts`); `tsconfig.node.json` da raiz se nada usar; arquivos mortos `packages/shared/src/game.ts`, `multiplayer.ts`, `auth.ts`.
- [ ] `infra/docker/Dockerfile` multi-stage, `.dockerignore`, `.env.example`. O servidor atual serve o `apps/web/dist` e responde `/healthz`.
- [ ] `infra/compose/compose.dev.yaml`, `compose.e2e.yaml`, `compose.prod.yaml` (Caddy, migrate, app, postgres, backup).
- [ ] Playwright em `apps/web/e2e/` com o roteiro de 4 passos (desktop e 390x844) e `npm run test:e2e`.
- [ ] `ci.yml`: manter `check`, adicionar `e2e` e `publish` (GHCR, só push na `next`).
- [ ] `docs/architecture/overview.md`: como rodar com Docker (curto).

Fora deste bloco (Ronald faz): `dependabot.yml` por PR na `master`, regras de proteção no GitHub.

## Bloco 2 — Engine, modo local e front novo

Specs: `../specs/code-architecture.md`, `../specs/system-design.md` (seções 2 e 4), `../specs/ui-design-system.md`. O multiplayer antigo é removido aqui e volta no bloco 3.

- [ ] `@sgm/shared`: formato novo (`Campaign { table, panel }`, coleções em `Record`, `imageRef`), schema e tipo com o mesmo nome (sem sufixo `Schema`).
- [ ] `@sgm/engine` completo: todos os comandos da mesa, `can`, `projectFor`. Cobertura 90%.
- [ ] `room/`: `RoomConnection`, `LocalRoomConnection`, `room-store`, `useRoom`, `useCommand`. Dexie novo (`campaigns`, `media`), imagens `local:<hash>`, importar e exportar JSON.
- [ ] TanStack Router com `/` (lista de campanhas) e `/campanha/$id`.
- [ ] Reorganizar em `app/`, `routes/`, `features/`, `room/`, `lib/`, `ui/`. Remover `useTokenStore`, `useZoneStore`, `useScenesStore`, `useMultiplayerStore`, `saveHelpers.ts`, `lib/socket.ts`, `types/`. Dividir `SidebarLeft.tsx`, `ZoneMarkerModal.tsx`, `TokenSheetModal.tsx`.
- [ ] Design system: Tailwind v4, tokens, primitivos, responsivo nas três faixas, guarda no CI, DOMPurify, error boundaries.
- [ ] Regras de `web/` no `dependency-cruiser`. Testes da `LocalRoomConnection`. Screenshots do Playwright nos três tamanhos.

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
