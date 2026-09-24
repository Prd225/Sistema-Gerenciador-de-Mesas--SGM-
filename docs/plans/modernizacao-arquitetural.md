# Plano de Modernização Arquitetural — SGM v7

> Ordem de execução da modernização. O **o quê** está nos specs: [arquitetura de código](../specs/code-architecture.md), [system design](../specs/system-design.md), [CI/CD](../specs/ci-cd.md) e [design system](../specs/ui-design-system.md). Este documento diz **em que ordem** fazer. Revisado em 2026-09-24.

---

## 1. Objetivo

Transformar o SGM numa base robusta e padronizada:

- Monorepo com contratos (`@sgm/shared`) e regras do jogo (`@sgm/engine`) compartilhados entre cliente e servidor.
- Servidor como autoridade das salas, com a camada de tempo real escrita pela equipe sobre Socket.io.
- Bibliotecas consolidadas em todo o resto (Fastify, Drizzle, Better Auth, TanStack Router e Query).
- CI/CD completo com Docker, staging automático e produção com aprovação.

---

## 2. Decisões

| Decisão                                                  | Registro                                                      |
| :------------------------------------------------------- | :------------------------------------------------------------ |
| Node/React, sem core em Go                               | [0001](../decisions/0001-manter-stack-node.md)                |
| Servidor próprio, sem BaaS                               | [0002](../decisions/0002-backend-proprio-sem-baas.md)         |
| Servidor como autoridade das salas                       | [0003](../decisions/0003-servidor-autoritativo.md)            |
| Sem compatibilidade retroativa durante o desenvolvimento | [0005](../decisions/0005-sem-compatibilidade-retroativa.md)   |
| Stack revisada (lista fechada de bibliotecas)            | [0006](../decisions/0006-stack-revisada.md)                   |
| Monorepo com engine compartilhada                        | [0007](../decisions/0007-arquitetura-engine-compartilhada.md) |

---

## 3. Diagnóstico (verificado no código em 2026-09-24)

### 3.1 Repositório

- Um único `package.json`, sem workspaces. Cliente em `src/`, servidor em `server/src/`.
- CI com formatação, lint, typecheck, testes e build. Sem Docker, E2E, segurança nem deploy.

### 3.2 Servidor multiplayer (`server/src/`)

O servidor só repassa eventos, sem arbitrar nada:

- **Sem permissão por papel**: qualquer membro da sala pode enviar `room:sync-state` e sobrescrever o mapa inteiro, ou apagar tokens, zonas e marcadores de qualquer um.
- **Papel de mestre por ordem de chegada**: se o mestre cai, o próximo que entrar vira mestre. O `id` do membro é o `socket.id`, então quem reconecta perde a identidade.
- **Segredos vazam**: o estado completo, incluindo itens com `isRevealed: false` e fichas de ameaças, vai para os jogadores.
- **Sem validação de payload**: qualquer JSON de até 20 MB é aceito.
- **Salas só em memória**: um restart derruba todas as sessões.
- **Imagens em Base64 pelo WebSocket**.
- **Tipos importados do frontend** (`../../src/types/*`).
- **Auth feito à mão**: `bcryptjs` no thread principal, token de sessão guardado em claro no banco e no `localStorage`.

### 3.3 Cliente (`src/`)

- Organizado por tipo de arquivo, com arquivos de mais de 1.000 linhas (`SidebarLeft.tsx` passa de 2.600).
- `lib/saveHelpers.ts` e os 14 stores têm dependência circular.
- Offline e online são fluxos diferentes (`saveHelpers` de um lado, `*FromRemote` do outro).
- `RichTextEditor` e `RulesEditor` renderizam HTML sem sanitização (XSS entre jogadores no multiplayer).
- Cores, tamanhos e z-index soltos nos componentes. Quase nenhum breakpoint responsivo.

---

## 4. Fases

Cada fase é um ou mais PRs. Uma fase só começa com a anterior revisada e aceita, exceto a Fase 8, que pode correr em paralelo a partir da Fase 3.

### Fase 0 — Alinhamento do repositório (concluída)

- [x] Commitar a remoção de `legacy/`.
- [x] Trazer os 12 commits de `origin/master` e resolver conflitos.
- [x] Publicar a branch no remoto.
- [x] Remover as pastas órfãs `client/` e `shared/`.
- [x] Limpeza inicial de dependências.

### Fase 1 — Estabilidade imediata (concluída)

- [x] Vitest com `fake-indexeddb` e `npm test` no CI.
- [x] Testes de unidade de stores críticos, persistência e contratos (`useTokenStore`, `useCampaignStore`, `useScenesStore`, `campaignPersistence`, `contracts`).
- [x] Schemas Zod em `shared/` para todas as entidades e eventos e tipos inferidos (`z.infer`).
- [x] Error boundary na raiz do app e em cada subpainel do mestre.
- [x] Escala de z-index corrigida (dialogs acima do painel do mestre) e `AddMusicModal` migrado para `Dialog`.

### Fase 2 — Monorepo

Spec: [`code-architecture.md`](../specs/code-architecture.md), seções 3 e 6.

Esta fase **move** código e cria os pacotes. Não reorganiza o cliente em `features/` (isso é a Fase 6) e não troca bibliotecas do servidor (Fase 4).

- [x] npm workspaces na raiz com `apps/*` e `packages/*`. `.nvmrc` e `engines` com Node 24.
- [x] `tsconfig.base.json` na raiz. Cada workspace com o próprio `tsconfig.json` e `package.json` (`@sgm/web`, `@sgm/server`, `@sgm/shared`, `@sgm/engine`).
- [x] Mover `src/`, `index.html`, `public/`, `vite.config.ts`, `vitest.config.ts`, Tailwind e PostCSS para `apps/web/`. Mover `server/` para `apps/server/`.
- [x] Criar `@sgm/shared` com schemas Zod das entidades atuais (`domain/`) e dos eventos de socket atuais (`protocol/`), a partir de `src/types/game.ts` e `src/types/multiplayer.ts`. Tipos com `z.infer`.
- [x] Cliente e servidor passam a importar de `@sgm/shared`. Nenhum import relativo entre apps.
- [x] Criar `@sgm/engine` só com a estrutura e um teste de exemplo (o conteúdo vem na Fase 5).
- [x] Scripts da raiz rodando em todos os workspaces (`dev`, `build`, `test`, `lint`, `typecheck`, `format`) e `dev.sh` ajustado.
- [x] `dependency-cruiser` com as regras entre pacotes da seção 6 do spec e script `depcruise`.
- [x] Atualizar caminhos em `AGENTS.md`, `README.md` e `docs/architecture/`.
- [ ] O app funciona exatamente como antes (roteiro de fumaça completo).

### Fase 3 — Docker e CI/CD

Spec: [`ci-cd.md`](../specs/ci-cd.md).

- [ ] `infra/docker/Dockerfile` multi-stage, `.dockerignore`, `.env.example`.
- [ ] `compose.dev.yaml` (Postgres), `compose.e2e.yaml`, `compose.prod.yaml` com Caddy e backup.
- [ ] `ci.yml` com os jobs `quality`, `unit`, `security`, `build`, `docker`, `e2e` e `publish`. `integration` entra com o primeiro teste de integração (Fase 4).
- [ ] Playwright configurado com o roteiro de fumaça atual e viewport de celular.
- [ ] `pr-title.yml`, `codeql.yml`, `release.yml` (release-please), `dependabot.yml`.
- [ ] `deploy.yml` para staging e produção. Se ainda não houver VPS, deixar o workflow pronto e desabilitado até os segredos existirem, e documentar os segredos necessários.
- [ ] Templates de PR e issue, `CODEOWNERS`.
- [ ] Documentar em `docs/architecture/` como rodar localmente com Docker.

### Fase 4 — Fundação do servidor

Specs: [`code-architecture.md`](../specs/code-architecture.md) seção 3.3 e [`system-design.md`](../specs/system-design.md) seções 4, 5.1, 9 e 11.

- [ ] Trocar Express por Fastify com `fastify-type-provider-zod`. Estrutura `main.ts`, `app.ts`, `config/`, `plugins/`, `modules/`.
- [ ] `config/env.ts` validando variáveis de ambiente com Zod.
- [ ] Drizzle com schema em `db/schema/` e migrações pelo `drizzle-kit`.
- [ ] Better Auth (e-mail e senha, Google OAuth) montado em `/api/auth/*`, com sessão em cookie. Remover o auth antigo, `bcryptjs`, `pg` direto e `express`.
- [ ] Cliente passa a usar o cliente do Better Auth. Nenhum token no `localStorage`.
- [ ] `@fastify/helmet`, `@fastify/cors` (só em desenvolvimento), `@fastify/rate-limit`.
- [ ] `/healthz` e `/readyz`. Logs do pino com `reqId`.
- [ ] Socket.io anexado ao servidor do Fastify, com os handlers atuais funcionando sem mudança de comportamento.
- [ ] Servidor serve o build do cliente com `@fastify/static`.
- [ ] Testes de integração das rotas de auth e health com Postgres. Job `integration` ligado no CI.

### Fase 5 — Engine e servidor autoritativo

Spec: [`system-design.md`](../specs/system-design.md) seções 4, 5.2, 6 e 9.

- [ ] `@sgm/shared/protocol` com o envelope `cmd`/`evt`/`snapshot`, comandos, eventos e códigos de erro.
- [ ] `@sgm/engine`: `applyCommand`, `can` (permissões), `projectFor` e `projectEvent`. Cobertura mínima de 90%.
- [ ] `apps/server/src/realtime/`: `gateway`, `handshake`, `room-registry` (fila por sala), `broadcaster`.
- [ ] Identidade: `memberId` estável, `memberToken` para convidados, sessão do Better Auth para usuários. Papel de mestre só para o dono da sala.
- [ ] Rate limit por socket e `maxHttpBufferSize` de 64 KB.
- [ ] Testes de integração: dois clientes na mesma sala, permissão negada, segredo não chega ao jogador, reconexão com a mesma identidade.
- [ ] O cliente atual é adaptado só o suficiente para continuar funcionando com o protocolo novo. A reestruturação vem na Fase 6.

### Fase 6 — Cliente: features, RoomConnection e rotas

Spec: [`code-architecture.md`](../specs/code-architecture.md) seção 3.4. Pode ser entregue em vários PRs, um grupo de features por vez.

- [ ] `apps/web/src/room/`: `RoomConnection`, `LocalRoomConnection` (engine + Dexie), `RemoteRoomConnection` (Socket.io, otimismo, lacuna de versão), `room-store`, `useRoom` e `useCommand`.
- [ ] TanStack Router com as rotas `/`, `/sala/$code`, `/tv/$code` e `/login`. TanStack Query para as chamadas HTTP.
- [ ] Reorganizar o código em `app/`, `features/`, `persistence/` e `shared/`, conforme a tabela da seção 4 do spec.
- [ ] Remover `useTokenStore`, `useZoneStore`, a parte de sala do `useCampaignStore`, `useMultiplayerStore`, as funções `*FromRemote` e o `saveHelpers.ts`.
- [ ] Dividir `SidebarLeft.tsx`, `ZoneMarkerModal.tsx` e `TokenSheetModal.tsx` entre as features correspondentes.
- [ ] Sanitizar com DOMPurify todo HTML renderizado.
- [ ] Regras de fronteira de `web/` no `dependency-cruiser`.
- [ ] Testes das duas `RoomConnection`. E2E com dois navegadores na mesma sala.

### Fase 7 — Persistência de salas e mídia

Spec: [`system-design.md`](../specs/system-design.md) seções 5, 7 e 8.

- [ ] Tabelas `rooms`, `room_members`, `room_events`, `campaigns` e `media` no Drizzle.
- [ ] `room-store` do servidor: snapshot com debounce de 2 s, log de eventos, carga sob demanda, shutdown gracioso com gravação das salas.
- [ ] Criar sala por HTTP (`POST /api/rooms`), fechar sala e fechamento automático após 24 h sem ninguém.
- [ ] `POST /api/media` com validação por magic bytes, conversão para WebP com `sharp` e deduplicação por hash. Entrega com cache imutável.
- [ ] Referências `local:<hash>` no Dexie e upload ao abrir sala. Fim do Base64.
- [ ] Testes de integração: restart do servidor sem perder a sala, upload duplicado reaproveitado.

### Fase 8 — Design system (em paralelo a partir da Fase 3)

Spec: [`ui-design-system.md`](../specs/ui-design-system.md). Depois da Fase 6, os caminhos passam a ser os de `apps/web/src/shared/`.

- [ ] Tailwind v4 e tokens (cores, tipografia, z-index, movimento) em CSS e em `shared/styles/tokens.ts`.
- [ ] Inventário completo de primitivos e componentes de domínio, com Storybook.
- [ ] Guarda no CI contra hexadecimal, tamanho e z-index arbitrários e `alert`/`confirm`/`prompt`.
- [ ] Error boundaries nas regiões restantes.
- [ ] Layout responsivo nas faixas compacta, média e ampla, com `ResponsivePanel`.
- [ ] Migrar as telas para tokens e primitivos, uma área por PR.
- [ ] Screenshots de referência no Playwright nos três tamanhos de tela.

### Depois (sem data)

- Métricas em `/metrics`, erros do cliente enviados ao servidor.
- Modo espectador completo, QR code de convite.
- Resumo e replay de sessão a partir de `room_events`.
- Importação de fichas por OCR/LLM ([`roadmap-features.md`](roadmap-features.md), seção 8).

---

## 5. Execução por agentes de IA

Regras gerais em [`/AGENTS.md`](../../AGENTS.md). Ao executar este plano:

1. **Uma fase por vez.** Não comece a próxima sem a anterior revisada e aceita. Fases grandes podem ser divididas em vários PRs.
2. **Leia antes de mexer**: o spec indicado na fase, as decisões 0005 a 0007 e o documento de `docs/architecture/` da área afetada.
3. **Sem desvio de escopo**: nenhuma biblioteca fora da [decisão 0006](../decisions/0006-stack-revisada.md), nenhum item de fase futura. Se o spec não fizer sentido diante do código, pare e explique.
4. **Documentação viva**: marque os checkboxes concluídos aqui e atualize `docs/architecture/` e `AGENTS.md` no mesmo PR que mudar o que eles descrevem.
5. **Ao terminar a Fase 5**, troque a seção "Multiplayer (estado de transição)" do `AGENTS.md` pela regra do modelo novo: todo comando novo exige schema em `@sgm/shared`, caso em `applyCommand`, regra em `can` e, se envolver segredo, em `projectFor`, tudo com teste.

---

## 6. Definition of Done

1. CI verde: formatação, lint, typecheck, fronteiras, testes, build e, a partir da Fase 3, Docker e E2E.
2. Roteiro de fumaça feito no navegador para qualquer mudança em `apps/web`.
3. Todo comando de socket novo ou alterado tem schema, caso no engine e teste, incluindo permissão negada.
4. Nenhum import entre apps. Nenhuma biblioteca fora da decisão 0006.
5. Documentação atualizada no mesmo PR.

---

## 7. Fora de escopo

- Core em Go, Redis, MinIO, microsserviços, escala horizontal.
- Backend gerenciado (Supabase, Firebase).
- Frameworks de servidor de jogo (Colyseus e similares): a camada de tempo real é escrita pela equipe.
- Sincronização por CRDT (Yjs).
