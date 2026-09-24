# System Design

Comportamento alvo. Pastas em `code-architecture.md`, deploy em `ci-cd.md`. Decisões 0003, 0007, 0009.

## 1. Modos e requisitos

| Modo | Conta | Campanha em | Jogadores |
| :-- | :-- | :-- | :-- |
| Local | Não | Dexie | Não (tela única) |
| Nuvem | Sim | Postgres | Por código/QR, sem conta |

"Salvar na nuvem" move a campanha local (e as imagens) para a conta; "Baixar cópia" exporta JSON. Um dono por vez, sem sync bidirecional. Campanha da nuvem exige conexão.

| ID | Requisito |
| :-- | :-- |
| F1 | Modo local completo sem servidor nem internet |
| F2 | Jogadores entram por código ou QR, sem conta |
| F3 | Mapa, tokens e iniciativa em tempo real |
| F4 | Jogador move só os próprios tokens; o resto é do mestre |
| F5 | Segredos nunca chegam a jogador ou TV |
| F6 | Reconexão volta com a mesma identidade e papel |
| F7 | Sala sobrevive a restart ou deploy (perda máx. 2 s) |
| F8 | Imagens enviadas uma vez e reaproveitadas |

Metas: `token.move` p95 < 150 ms, 2 a 8 jogadores por sala (máx. 20), VPS de 1 vCPU e 1 GB, um processo Node. Fora de escopo: várias instâncias, CRDT, voz e vídeo, log de eventos.

## 2. Dados

`Campaign { id, name, updatedAt, table, panel }`:
- `table: TableState { version, activeSceneId, round, turn, scenes: Record<id, Scene> }`; `Scene { id, name, tokens, zones, markers, backgrounds: Record<id, T>, initiative { order: string[], values: Record<tokenId, number> } }`. Só a `table` passa pelo engine.
- `panel`: diário, notas, regras, tabelas, roletas, soundpad. Só do mestre, salvo direto (Dexie ou `PATCH /api/campaigns/:id/panel`), nunca vai para a sala.
- Token ganha `ownerMemberId` (null = mestre) e `visibility: 'all' | 'gm'`. Imagens por referência (`imageRef`), nunca Base64.

Postgres (Drizzle, `db/schema.ts`). Tabelas `user`, `session`, `account`, `verification` são do Better Auth.

```
campaigns    (id, owner_id, name, table_state jsonb, panel jsonb, version, updated_at)
rooms        (id, code unique, campaign_id, status open|closed, created_at, closed_at)
room_members (id, room_id, user_id?, token_hash?, display_name, role, color, last_seen_at)
media        (hash pk, owner_id, mime, bytes, width, height, created_at)
```

**Sala = campanha aberta ao vivo.** O servidor mantém a `table` em memória e grava em `campaigns.table_state` (debounce 2 s). Dexie: `campaigns` (id) e `media` (hash, Blob).

## 3. Identidade

- Usuário: Better Auth (e-mail e senha, Google), cookie `httpOnly`. Mestre precisa de conta para abrir sala.
- Convidado: `memberToken` aleatório de 32 bytes no `localStorage`, hash em `room_members`.
- `memberId` é UUID estável, nunca o `socket.id`. Papel `gm` só para o dono da campanha, nunca por ordem de chegada. `spectator` (TV) vê a projeção de jogador e só envia ping.
- Handshake: `connect { roomCode, memberToken? }` + cookie → `welcome { memberId, memberToken?, role }` + `snapshot` projetado.

## 4. Protocolo

Schemas em `packages/shared/src/protocol/`.

```
cliente:  emit('cmd', { id, type, payload }, ack)
ack:      { ok: true, version } | { ok: false, code, message }
servidor: 'evt' { version, type, payload, actorId, cmdId? } | 'snapshot' { version, table }
```

Erros: `INVALID_PAYLOAD`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `ROOM_CLOSED`.

| Comando | Quem pode |
| :-- | :-- |
| `token.move` | Mestre ou dono |
| `token.update` | Mestre; jogador só PV e condições do próprio token |
| `token.create/delete`, `zone.*`, `marker.*`, `background.*`, `initiative.*`, `scene.*` | Mestre |
| `ping` | Todos (não muda versão) |

Servidor, por comando: rate limit → Zod → `applyCommand(table, cmd, member)` → rejeição no ack, ou nova `table` + `version++` → ack → evento projetado para cada membro → agenda gravação. Um comando por vez por sala (sem `await` entre ler e gravar).

Cliente remoto: prevê com o mesmo `applyCommand`, desfaz se rejeitado. Arrasto envia `token.move` a 20 Hz e um final no `dragend`. `version > lastVersion + 1` → pede snapshot. Cliente local: `applyCommand` + grava no Dexie (debounce).

`projectFor(table, member)` em todo envio para jogador e TV: só a cena ativa; remove tokens `visibility: 'gm'`, `stats` de ameaça (ficam nome, imagem, posição, condições), marcadores `hidden`, itens de zona com `isRevealed: false` ou `isFound: false`. Evento de algo secreto não é enviado; ao revelar, chega como `created`. Campo secreto novo exige teste de `projectFor`.

## 5. Fluxos

- **Salvar na nuvem**: sobe cada `local:<hash>` em `/api/media`, troca por `/media/<hash>.webp`, `POST /api/campaigns`, apaga a local.
- **Abrir sala**: `POST /api/rooms { campaignId }` → código de 6 caracteres (31 símbolos, sem `0/O`, `1/I`) → conecta → mostra código e QR.
- **Reconexão**: Socket.io reconecta → handshake → snapshot. Comandos sem ack são descartados; edição bloqueada até o snapshot.
- **Restart**: no `SIGTERM` grava todas as salas. Salas abertas carregam sob demanda.
- **Fechar**: mestre encerra → `closed`. Sala vazia por 24 h fecha sozinha.

## 6. Mídia

`POST /api/media` (autenticado, até 15 MB): magic bytes (PNG, JPEG, WebP, GIF) → WebP com `sharp` (máx. 8192 px, sem EXIF) → nome sha256, reaproveita se existe → `/data/media/ab/cd/<hash>.webp`. `GET /media/<hash>.webp` com cache `immutable`. A `table` na nuvem nunca contém `local:`.

## 7. Segurança e falhas

| Risco | Mitigação |
| :-- | :-- |
| Jogador altera ou vê o que não deve | `can` e `projectFor` no engine |
| Payload grande | Zod com limites, `maxHttpBufferSize` 64 KB |
| Flood | 30 comandos/s por socket (rajada 60), ping 2/s; código de sala 10 tentativas/IP/min |
| Login | Rate limit do Better Auth + `@fastify/rate-limit` |
| XSS | Cookie `httpOnly`/`Secure`/`SameSite=Lax`, nenhum token no `localStorage`, DOMPurify em todo HTML renderizado |
| CSRF/CORS | `trustedOrigins`, checagem de `Origin`, origem única em produção |
| Headers e upload | `@fastify/helmet` com CSP (YouTube, Spotify); reprocessar imagem, nunca servir o original |

| Falha | Comportamento |
| :-- | :-- |
| Cliente ou mestre cai | Banner "reconectando"; sala continua |
| Postgres fora | Salas seguem em memória com retry; login e salas novas falham com aviso; `/readyz` degradado |
| Comando rejeitado | Desfaz a previsão e avisa |
| Erro de render | Error boundary recarrega só a região |

## 8. Testes e logs

- pino com `reqId`; socket com `roomId`, `memberId`, `cmdId`. `/healthz` e `/readyz`.
- Unidade: cada comando e permissão negada em `applyCommand`, cada segredo em `projectFor`.
- Integração: `buildApp()` + Postgres + `socket.io-client` (dois clientes, reconexão, rejeição, restart).
- Cliente: as duas `RoomConnection`. E2E: dois navegadores e viewport de celular.
