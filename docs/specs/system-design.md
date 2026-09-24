# System Design

Comportamento do sistema alvo. Estrutura de pastas em `code-architecture.md`, deploy em `ci-cd.md`. Decisões: 0002, 0003, 0006, 0007.

## 1. Requisitos

| ID | Requisito |
| :--- | :--- |
| F1 | Mestre prepara a campanha offline, sem servidor |
| F2 | Jogadores entram por código ou QR, sem conta |
| F3 | Mapa, tokens e iniciativa em tempo real |
| F4 | Jogador move só os próprios tokens. Zonas, marcadores, fundos e ameaças só o mestre |
| F5 | Segredos do mestre (`isRevealed: false`, fichas de ameaça) nunca chegam ao jogador |
| F6 | Reconexão volta com a mesma identidade e papel |
| F7 | Sala sobrevive a restart ou deploy |
| F8 | Imagens enviadas uma vez e reaproveitadas |
| F9 | Log de eventos da sessão (base para replay) |

Metas: movimento de token p95 < 150 ms (internet), perda máxima de 2 s se o servidor cair, 2 a 8 jogadores por sala (máx. 20), um VPS de 1 vCPU e 1 GB. Um processo Node basta; o único risco de desempenho era Base64 no socket (resolvido na seção 7).

Fora de escopo: várias instâncias, CRDT, voz e vídeo.

## 2. Componentes

| Componente | Faz | Não faz |
| :--- | :--- | :--- |
| Features React | Renderizam e capturam intenção | Não falam com socket nem Dexie |
| `room-store` (web) | Estado da sala para a UI | Não decide permissões |
| `RoomConnection` (web) | Envia comandos, aplica eventos, otimismo, reconexão. A versão local roda o engine no navegador | Não tem regra de jogo |
| Dexie (web) | Campanha offline, imagens `local:`, cache para F5 | Não é fonte de verdade online |
| Gateway (server) | Autentica socket, valida Zod, rate limit, chama o engine | Não altera estado |
| `@sgm/engine` | Regras e permissões, funções puras, iguais no cliente e servidor | Não faz I/O |
| Room store (server) | Snapshot, log de eventos, recarga | Não conhece regras |
| Media (server) | Valida, converte, deduplica e serve imagens | Não usa o socket |
| HTTP (Fastify) | Auth (Better Auth), campanhas, salas, mídia | — |

## 3. Identidade

- **Usuário**: Better Auth (e-mail e senha ou Google), sessão em cookie `httpOnly`. O mestre precisa de conta para abrir sala.
- **Convidado**: `memberToken` aleatório de 32 bytes no `localStorage`, hash em `room_members`.
- `memberId` é UUID estável, nunca o `socket.id`. Um membro pode ter vários sockets.
- Papel `gm` só para o dono da sala, **nunca por ordem de chegada**. Papel `spectator` (TV) vê a projeção de jogador e só envia ping.
- Handshake: `connect { roomCode, memberToken? }` + cookie → servidor resolve usuário (`auth.api.getSession`) ou convidado → responde `welcome { memberId, memberToken?, role }` e `snapshot` projetado.

## 4. Dados

Postgres com Drizzle (`apps/server/src/db/schema/`):

```
user, session, account, verification   -- do Better Auth; não criar tabelas próprias de usuário
campaigns    (id, owner_id, name, data jsonb, updated_at)
rooms        (id, code unique, campaign_id?, owner_user_id, state jsonb, version, status open|closed, created/updated/closed_at)
room_members (id, room_id, user_id?, token_hash?, display_name, role, color, joined_at, last_seen_at)
room_events  (room_id, version, member_id, type, payload jsonb, created_at)  -- pk (room_id, version), append-only, 90 dias
media        (hash pk, owner_user_id, mime, bytes, width, height, created_at)
```

`RoomState`: `version`, e `tokens`, `zones`, `markers`, `backgrounds`, `members` como `Record` por id (não arrays). `initiative { order, values, round, turn }`. Token ganha `ownerMemberId` (null = só mestre) e `visibility: 'all' | 'gm'`.

Campanha = documento durável do mestre (Dexie e `campaigns`). Sala = sessão ao vivo criada a partir dela. Ao fechar, o estado volta para a campanha.

## 5. Protocolo

Schemas em `packages/shared/src/protocol/`.

```
cliente: emit('cmd', { id, type, payload }, ack)
ack:     { ok: true, version } | { ok: false, code, message }
servidor: 'evt' { version, type, payload, actorId, cmdId? } e 'snapshot' { version, state }
```

Erros: `INVALID_PAYLOAD`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `ROOM_CLOSED`.

| Comando | Quem pode |
| :--- | :--- |
| `token.move` | Mestre ou dono |
| `token.create/update/delete` | Mestre. Jogador: só `update` de PV e condições do próprio token |
| `zone.*`, `marker.*`, `background.*`, `initiative.*`, `room.load` | Mestre |
| `ping` | Todos (não entra no log nem muda versão) |

Servidor, por comando: rate limit → Zod → `applyCommand(state, cmd, member)` → rejeição no ack, ou novo estado + `version++` → ack → evento projetado para cada membro → agenda snapshot e log. Uma sala processa um comando por vez (sem `await` entre ler e gravar).

Cliente: prevê o resultado com o mesmo `applyCommand` e descarta se rejeitado. Arrasto envia `token.move` a 20 Hz e um final no `dragend`. Evento com `version > lastVersion + 1` → pede snapshot.

**`projectFor(state, member)`** roda em todo envio para jogador e espectador: remove itens de zona com `isRevealed: false` e inventário com `isFound: false`, tokens `visibility: 'gm'` e stats de ameaça (fica nome, imagem, posição, condições). Evento de algo secreto não é enviado; item revelado chega como `created`. Todo campo secreto novo exige teste de `projectFor`.

## 6. Fluxos

- **Abrir sala**: `POST /api/rooms` → código de 6 caracteres (alfabeto de 31 sem `0/O`, `1/I`) → sobe imagens `local:` → conecta → `room.load` → mostra código e QR.
- **Reconexão**: Socket.io reconecta sozinho → handshake com `memberToken` ou cookie → snapshot. Comandos sem ack durante a queda são descartados; a UI bloqueia edição até o snapshot.
- **Restart**: no `SIGTERM`, grava todas as salas e fecha. No boot, salas abertas carregam sob demanda.
- **Fechar**: mestre encerra → `closed`, estado vai para a campanha. Sala vazia por 24 h fecha sozinha.

## 7. Mídia

- `POST /api/media` (autenticado, até 15 MB): valida magic bytes (PNG, JPEG, WebP, GIF), converte para WebP com `sharp` (máx. 8192 px, sem EXIF), nome = sha256, reaproveita se já existe. Grava em `/data/media/ab/cd/<hash>.webp`.
- `GET /media/<hash>.webp` com cache `immutable` de 1 ano.
- Referências: `/media/<hash>.webp` (no servidor) ou `local:<hash>` (Blob no Dexie, offline). O estado da sala nunca contém `local:`. Base64 deixa de existir.

## 8. Segurança

| Risco | Mitigação |
| :--- | :--- |
| Jogador altera o que não deve | Permissões no engine |
| Jogador vê segredos | `projectFor` antes de todo envio |
| Payload grande ou malicioso | Zod com limites de tamanho, `maxHttpBufferSize` 64 KB |
| Flood | 30 comandos/s por socket (rajada 60), ping 2/s |
| Força bruta de código de sala | 10 tentativas por IP por minuto |
| Força bruta de login | Rate limit do Better Auth + `@fastify/rate-limit` |
| XSS | Cookie `httpOnly`/`Secure`/`SameSite=Lax`, nada de token no `localStorage`, DOMPurify em todo HTML renderizado (`RichTextEditor` e `RulesEditor` hoje não sanitizam) |
| CSRF e CORS | `trustedOrigins` do Better Auth, checagem de `Origin`; produção com origem única, CORS só em dev |
| Headers | `@fastify/helmet` com CSP para app, YouTube e Spotify |
| Upload malicioso | Magic bytes, reprocessar com `sharp`, nunca servir o original |

## 9. Falhas

| Falha | Comportamento |
| :--- | :--- |
| Cliente cai | Banner "reconectando", edição bloqueada, snapshot ao voltar |
| Mestre cai | Sala continua; jogadores movem os próprios tokens |
| Servidor reinicia | Até 2 s perdidos; clientes reconectam |
| Postgres fora | Salas seguem em memória, snapshot com retry; login e salas novas falham com aviso; `/readyz` degradado |
| Disco cheio | Upload responde 507 |
| Comando rejeitado | Cliente desfaz a previsão e avisa |
| Erro de render | Error boundary recarrega só a região |

## 10. Observabilidade e testes

- Logs pino com `reqId`; logs de socket com `roomId`, `memberId`, `cmdId`. `/healthz`, `/readyz`, `/metrics` (`prom-client`).
- Unidade: cada comando e permissão negada em `applyCommand`, cada segredo em `projectFor`, schemas.
- Integração: `buildApp()` + Postgres + `socket.io-client` — dois clientes, reconexão, rejeição, restart.
- Cliente: `RoomConnection` local e remota. E2E: Playwright com dois navegadores e viewport de celular.
