# Front-end: Regras e Verificação

Regras tiradas de bugs reais do histórico do projeto. Valem para qualquer mudança em `src/`.

## 1. Verificação obrigatória no navegador

`typecheck` e `build` passando **não** garantem que a tela funciona. Vários bugs do projeto passaram no typecheck e deram tela branca em runtime.

Antes de concluir uma tarefa de front-end:

1. Rode `npm run dev` e abra o app.
2. Abra o console do navegador. Nenhum erro ou warning novo pode aparecer.
3. Use a funcionalidade alterada: caminho principal e pelo menos um caso de borda (lista vazia, texto longo, cancelar no meio, tela estreita).
4. Faça o roteiro de fumaça da seção 7.
5. Se não conseguir abrir o navegador, diga isso explicitamente na entrega. Não declare a tarefa concluída.

## 2. Imports que quebram em runtime

| Bug já ocorrido                                               | Regra                                                                                             |
| :------------------------------------------------------------ | :------------------------------------------------------------------------------------------------ |
| `DragEndEvent` importado como valor derrubou o Vite           | Tipos sempre com `import type { ... }`                                                            |
| Named exports do `react-youtube` quebraram o bundle           | Use o import que a documentação da biblioteca mostra. Confira no navegador                        |
| Ícone `PlayCircle` removido do `lucide-react` deu tela branca | Antes de usar um ícone, confirme que ele existe na versão instalada (`node_modules/lucide-react`) |
| Store usado sem import em `AppLayout`                         | Rode `npm run build`, não só o typecheck                                                          |

## 3. Camadas e z-index

Use apenas estes níveis. Não crie valores novos como `z-[9999]`.

| Nível              | Uso                                                      |
| :----------------- | :------------------------------------------------------- |
| `z-10` a `z-30`    | Empilhamento interno de um componente                    |
| `z-40`             | Sidebars e gatilhos flutuantes sobre o mapa              |
| `z-50`             | Header, footer e popovers internos de painéis            |
| `z-[60]`, `z-[61]` | Overlays do `AppLayout`                                  |
| `z-[200]`          | Overlay do painel do mestre                              |
| `z-[300]`          | `Dialog` (`ui/dialog.tsx`)                               |
| `z-[310]`          | `Select` e `DropdownMenu` (precisam abrir sobre dialogs) |

Modais (`Dialog`) e seus menus subordinados (`Select`, `DropdownMenu`) renderizam acima do painel do mestre via Portal (`z-[300]` e `z-[310]`), permitindo que modais acionados de dentro do painel do mestre apareçam normalmente sem necessidade de overlays manuais ou `z-[9999]`.

## 4. React e Zustand

- **Seletores**: leia do store só o que o componente usa (`useTokenStore((s) => s.tokens)`), nunca o store inteiro. Seletor que retorna objeto ou array novo a cada render precisa de `useShallow`.
- **Closures desatualizadas**: callbacks assíncronos, timers e listeners devem ler o estado atual com `useXStore.getState()`, não uma variável capturada no render. Lógica de sequência (próxima faixa, próximo turno) fica no store, não no componente.
- **Limpeza de efeitos**: todo `setTimeout`, `setInterval`, `addEventListener` e `socket.on` criado num `useEffect` precisa ser removido no retorno do efeito.
- **Singletons e HMR**: players (Spotify, YouTube) e conexões ficam em módulos de `src/lib/`, não dentro de componentes, para não duplicar no remount ou no hot reload.
- **Estado de UI x estado de jogo**: estado efêmero (hover, modal aberto, input em edição) fica em `useState`. Só vai para store o que é salvo ou compartilhado.

## 5. Dados salvos

- Não há compatibilidade com saves antigos durante o desenvolvimento (decisão 0005). Pode renomear, remover e reestruturar campos sem migração. Não escreva código para aceitar formatos antigos.
- Mesmo assim, o app não pode quebrar ao encontrar um save de formato antigo no navegador: se o formato não bater, descarte o save e comece limpo, em vez de dar tela branca.
- Store novo que precisa ser salvo entra em `collectGameState`, `applyGameState` e `resetGameState` (`src/lib/saveHelpers.ts`).

## 6. Componentes

- `SidebarLeft.tsx` (mais de 2.600 linhas), `ZoneMarkerModal.tsx` e `TokenSheetModal.tsx` (mais de 1.000 cada) são frágeis. Não aumente esses arquivos: código novo vai em um componente separado na mesma pasta e é importado.
- Componente novo com mais de 300 linhas é sinal de que precisa ser dividido.
- Use os primitivos de `src/components/ui/` antes de criar um novo. Se um primitivo não funciona no contexto (ex.: `Dialog` dentro do painel do mestre), corrija o primitivo em vez de contorná-lo.
- Use somente as cores da paleta. Enquanto os tokens de `docs/specs/ui-design-system.md` não existirem, use os hexadecimais de `docs/architecture/design-system.md`. Não invente valores novos.
- Textos da interface curtos e em português. Tooltips com uma frase no máximo.
- Não existe error boundary hoje: qualquer erro de render derruba o app inteiro. Trate `undefined` em dados vindos de save ou da rede (`token.imageUrl?`, listas vazias).

## 7. Roteiro de fumaça

Rode depois de qualquer mudança de front-end, com o console aberto:

1. O app abre sem erros no console.
2. Criar um token, arrastar no mapa, abrir a ficha e fechar.
3. Desenhar uma zona retangular e um marcador, depois apagar os dois.
4. Zoom com a roda e pan com Espaço.
5. Abrir o painel do mestre, alternar dois subpainéis e fechar.
6. Recarregar a página (F5): o que foi criado continua lá.
7. Se a mudança tocar no multiplayer: duas abas, uma cria a sala e a outra entra. Mover um token numa aba aparece na outra.
