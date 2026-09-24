# Front-end: Regras

Regras tiradas de bugs reais do projeto. Valem para `apps/web/src/`.

## Roteiro no navegador (4 passos)

Typecheck e build não pegam tela branca. Depois de mudar o front-end, com o console aberto:

1. O app abre sem erro no console.
2. Criar um token e arrastá-lo no mapa.
3. Abrir e fechar o painel do mestre.
4. Recarregar (F5): o token continua lá.

Mexeu no multiplayer? Abra duas abas, crie a sala numa e entre na outra: mover um token aparece nas duas.

## Erros que já aconteceram

| Bug                                               | Regra                                                           |
| :------------------------------------------------ | :-------------------------------------------------------------- |
| Tipo importado como valor derrubou o Vite         | `import type { ... }`                                           |
| Import errado do `react-youtube` quebrou o bundle | Use o import da documentação da lib                             |
| Ícone removido do `lucide-react` deu tela branca  | Confira se o ícone existe em `node_modules/lucide-react`        |
| Store usado sem import                            | `npm run check` roda o build, não só o typecheck                |
| Modal abrindo por baixo do painel do mestre       | Use a escala de z-index abaixo                                  |
| Timer ou listener vazando                         | Todo `useEffect` com timer, listener ou `socket.on` tem limpeza |
| Callback lendo estado velho                       | Leia com `useXStore.getState()` na hora de executar             |

## Z-index

Só estes níveis: `z-10` a `z-30` (interno), `z-40` (sidebars), `z-50` (header, footer), `z-[60]`/`z-[61]` (overlays do layout), `z-[200]` (painel do mestre), `z-[300]` (`Dialog`), `z-[310]` (`Select`, `DropdownMenu`).

## Regras rápidas

- Seletor de store pega só o que usa. Seletor que retorna objeto ou array novo usa `useShallow`.
- Players (Spotify, YouTube) e conexões ficam em `apps/web/src/lib/`, fora de componentes.
- Estado efêmero (hover, modal aberto) em `useState`. Store só para o que é salvo ou compartilhado.
- Store novo que precisa ser salvo entra em `collectGameState`, `applyGameState` e `resetGameState` (`apps/web/src/lib/saveHelpers.ts`).
- Save de formato antigo: descarte e comece limpo, nunca tela branca.
- Não aumente `SidebarLeft.tsx`, `ZoneMarkerModal.tsx` e `TokenSheetModal.tsx`. Código novo vai num componente separado.
- Use os primitivos de `apps/web/src/components/ui/` e só as cores de `design-system.md`.
- Região nova (modal, sidebar) ganha error boundary. Trate `undefined` em dados de save ou da rede.
