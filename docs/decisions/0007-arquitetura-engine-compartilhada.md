# 0007. Monorepo com engine compartilhada entre cliente e servidor

- Status: Aceita
- Data: 2026-09-24

## Contexto

O código atual organiza o cliente por tipo de arquivo (`components/`, `store/`, `types/`), tem arquivos de milhares de linhas, duplica regras entre stores e servidor e trata o modo offline e o online como fluxos diferentes (`saveHelpers` de um lado, `*FromRemote` do outro).

## Decisão

- Monorepo npm workspaces com `apps/web`, `apps/server`, `packages/shared` e `packages/engine`.
- Todas as regras do jogo ficam em `@sgm/engine`, em funções puras e determinísticas (`applyCommand`, `projectFor`).
- O servidor usa o engine como autoridade. O cliente usa o mesmo engine para prever o resultado de comandos (otimismo) e para rodar a mesa inteira no modo offline.
- A interface fala com uma `RoomConnection` com duas implementações (local e remota), sem saber qual está ativa.
- Cliente organizado por funcionalidade (`features/`), servidor por módulo (`modules/`) mais a camada `realtime/`.
- Fronteiras verificadas no CI com `dependency-cruiser`.

Estrutura completa em [`../specs/code-architecture.md`](../specs/code-architecture.md).

## Consequências

- Uma regra de jogo existe em um só lugar e é testada sem rede, banco ou React.
- Offline e online usam o mesmo caminho de código, então um bug corrigido num modo é corrigido no outro.
- O engine precisa ser determinístico: nada de `Date.now()`, `Math.random()` ou I/O dentro dele.
- A migração é uma reestruturação grande do cliente. Os stores de tokens, zonas e campanha são substituídos pelo `room-store`, e o `saveHelpers` deixa de existir.
