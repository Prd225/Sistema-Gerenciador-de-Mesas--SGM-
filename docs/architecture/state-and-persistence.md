# Estado e Persistência

## Stores Zustand (`apps/web/src/store/`)

| Store                                                                                                        | Domínio                                                                               |       Autosave        | Emite socket |
| :----------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :-------------------: | :----------: |
| `useTokenStore`                                                                                              | Tokens, fila de iniciativa, token em edição                                           |          sim          |     sim      |
| `useZoneStore`                                                                                               | Zonas, marcadores, imagens de fundo, ferramenta ativa, seleção                        |          sim          |     sim      |
| `useCampaignStore`                                                                                           | Cena, rodada, turno, urgência, slot de autosave, modais de save/load                  |          sim          |     sim      |
| `useMultiplayerStore`                                                                                        | Conexão, sala, papel (`gm`/`player`), membros, pings. Registra os listeners do socket |          não          |     sim      |
| `useScenesStore`                                                                                             | Cenas salvas e troca de cena                                                          | grava direto no Dexie |     não      |
| `useDiaryStore`, `useNotesStore`, `useRulesStore`, `useTablesStore`, `useRoulettesStore`, `useSoundpadStore` | Subpainéis do mestre                                                                  |          sim          |     não      |
| `useMasterPanelStore`                                                                                        | Layout de 3 colunas do painel do mestre                                               |          não          |     não      |
| `useAuthStore`                                                                                               | Usuário logado e sessão                                                               |          não          |     não      |
| `useTimerStore`                                                                                              | Cronômetro                                                                            |          não          |     não      |

Nenhum store usa o middleware `persist` do Zustand. A persistência passa toda por `saveHelpers.ts` ou, no caso das cenas, direto pelo Dexie.

## Autosave (`apps/web/src/lib/saveHelpers.ts`)

1. Uma ação de store chama `triggerAutoSave()`.
2. Debounce de 800ms (ou imediato com `forceImmediate`).
3. `collectGameState()` lê o estado de todos os stores via `getState()`.
4. Grava sempre em `db.sessionState` (chave `currentSession`), para o F5 não perder nada.
5. Se houver slot de autosave ativo em `useCampaignStore`, grava também em `db.campaignSlots`.

O salvamento é pausado com os modais de save/load abertos e durante o reset (`isResetting` e `sessionStorage.sgm_is_resetting`).

Outras funções: `applyGameState` (aplica um estado salvo em todos os stores), `loadWorkingSession`, `clearWorkingSession`, `resetGameState` (limpa tudo e recarrega a página).

Dívida conhecida: `saveHelpers.ts` importa todos os stores e os stores importam `triggerAutoSave`, uma dependência circular. A correção está no plano (Fase 6). Até lá, ao criar um store novo que precisa ser salvo, adicione-o em `collectGameState` e `applyGameState`.

## IndexedDB (`apps/web/src/lib/db.ts`)

Banco `SGMDatabase`, schema na versão 7:

| Tabela          | Chave        | Conteúdo                                                 |
| :-------------- | :----------- | :------------------------------------------------------- |
| `campaignSlots` | `slotNumber` | Campanhas salvas manualmente (nome, `updatedAt`, `data`) |
| `activeScenes`  | `id`         | Cenas do mestre                                          |
| `sessionState`  | `key`        | Sessão de trabalho atual (`currentSession`)              |

Para mudar o schema, incremente a versão (`this.version(8).stores({...})`). Editar uma versão existente não chega a quem já tem o banco no navegador. Não é preciso migrar dados antigos (decisão 0005): pode descartá-los.
