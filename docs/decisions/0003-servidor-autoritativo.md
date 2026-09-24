# 0003. Servidor como autoridade das salas multiplayer

- Status: Aceita
- Data: 2026-09-24

## Contexto

Hoje o servidor só retransmite eventos. Não valida payloads, não verifica permissões (qualquer jogador pode sobrescrever o mapa do mestre) e guarda as salas só em memória. Cada cliente aplica suas próprias mudanças, o que exige as funções `*FromRemote` para evitar reemissão em loop.

## Decisão

- Contratos de eventos como schemas Zod num pacote `shared/`, usados pelo cliente e pelo servidor.
- Uma função pura `applyEvent(state, event, actor)` no servidor, que valida permissões e devolve o novo estado ou uma rejeição.
- O cliente emite intenções e aplica os eventos confirmados, com atualização otimista só em interações contínuas como arrastar tokens.
- Estado da sala versionado e salvo no Postgres como `jsonb`. Reconexão recebe o snapshot completo.
- Manter Socket.io. CRDT (Yjs) foi descartado por enquanto: só se justifica se edição offline com merge virar requisito.

## Consequências

- Permissões e validação num único lugar testável sem rede nem banco.
- Fim das funções `*FromRemote` e do risco de eco.
- Salas sobrevivem a restart do servidor.
- Exige refatorar os stores que emitem eventos (`useTokenStore`, `useZoneStore`, `useCampaignStore`, `useMultiplayerStore`).
- Execução em fases no [plano de modernização](../plans/modernizacao-arquitetural.md).
