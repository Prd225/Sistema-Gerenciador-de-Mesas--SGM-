# Design System — SGM

> Padrão visual e de componentes que toda a interface deve seguir. O estado atual está em [`../architecture/design-system.md`](../architecture/design-system.md). Este documento define o **alvo**; a forma de migrar fica a critério de quem implementa, desde que o resultado siga estas regras.

Objetivos, em ordem: **padronização**, **responsividade**, **estabilidade**.

---

## 1. Bibliotecas

| Necessidade             | Biblioteca                                        | Observação                                                                                |
| :---------------------- | :------------------------------------------------ | :---------------------------------------------------------------------------------------- |
| Estilo e tokens         | Tailwind CSS v4                                   | Tokens em `@theme` no CSS. Container queries nativas                                      |
| Componentes base        | shadcn/ui sobre Base UI (`@base-ui/react`)        | Já em uso. Os componentes ficam em `src/components/ui/` e são a única fonte de primitivos |
| Ícones                  | `lucide-react`                                    | Único pacote de ícones                                                                    |
| Toasts                  | `sonner`                                          | Substitui `alert()` e avisos improvisados                                                 |
| Drawer (celular)        | `vaul` (via shadcn `drawer`)                      | Painéis e modais no celular                                                               |
| Formulários             | `react-hook-form` + `zod` + `@hookform/resolvers` | Os mesmos schemas Zod de `shared/` quando o formulário edita uma entidade do jogo         |
| Listas longas           | `@tanstack/react-virtual`                         | Listas com mais de 100 itens (tokens, notas, músicas)                                     |
| Erros de render         | `react-error-boundary`                            | Um boundary por região (seção 7)                                                          |
| HTML de usuário         | `dompurify`                                       | Obrigatório antes de qualquer `dangerouslySetInnerHTML`                                   |
| Catálogo de componentes | Storybook (builder Vite)                          | Cada componente de `ui/` tem uma story com todos os estados                               |
| Testes visuais e E2E    | Playwright                                        | Screenshots de referência nos três tamanhos de tela (seção 5)                             |
| Fonte                   | Geist (`@fontsource-variable/geist`)              | Única família. Números tabulares em fichas e iniciativa (`tabular-nums`)                  |

Nenhuma outra biblioteca de componentes (MUI, Mantine, Chakra, Ant) deve entrar. Misturar sistemas é a principal fonte de inconsistência.

---

## 2. Tokens

Todos os valores visuais vêm de tokens. **Proibido** em código novo ou migrado: hexadecimal arbitrário (`bg-[#121214]`), tamanho de fonte arbitrário (`text-[10px]`), z-index arbitrário (`z-[9999]`).

Os tokens existem em dois formatos gerados da mesma fonte:

- CSS (`@theme` em `src/index.css`) para classes Tailwind.
- TypeScript (`src/styles/tokens.ts`) para o canvas Konva, que não lê classes CSS.

### 2.1 Cores

Os valores são os da paleta atual, com as duplicatas unificadas.

| Token            | Valor     | Uso                                                            |
| :--------------- | :-------- | :------------------------------------------------------------- |
| `canvas`         | `#0d0d0f` | Fundo do mapa                                                  |
| `bg`             | `#121214` | Fundo da aplicação                                             |
| `surface`        | `#202024` | Cards, painéis, menus                                          |
| `surface-sunken` | `#1a1a1e` | Campos de entrada, áreas internas (substitui também `#18181b`) |
| `border`         | `#323238` | Bordas e divisores                                             |
| `control`        | `#323238` | Fundo de botões secundários e trilhas                          |
| `text`           | `#e1e1e6` | Texto principal                                                |
| `text-muted`     | `#a8a8b3` | Texto secundário                                               |
| `text-subtle`    | `#7c7c8a` | Placeholder, legendas (substitui também `#7a7a80`)             |
| `primary`        | `#8257e5` | Ação principal, seleção, foco                                  |
| `primary-hover`  | `#9466ff` | Hover da ação principal                                        |
| `on-primary`     | `#ffffff` | Texto sobre `primary`                                          |
| `accent`         | `#ffd700` | Destaques (turno atual, itens especiais)                       |
| `success`        | `#04d361` | Confirmação, PV cheio                                          |
| `warning`        | `#facc15` | Alertas não destrutivos                                        |
| `danger`         | `#ef4444` | Ação destrutiva, dano, erro                                    |
| `danger-hover`   | `#dc2626` | Hover de ação destrutiva                                       |

Cores de domínio (Ordem Paranormal), hoje duplicadas em `SidebarLeft.tsx` e `ZoneMarkerModal.tsx`:

| Token                  | Valor     |
| :--------------------- | :-------- |
| `element-sangue`       | `#ef4444` |
| `element-morte`        | `#9ca3af` |
| `element-conhecimento` | `#eab308` |
| `element-energia`      | `#a855f7` |
| `element-medo`         | `#ffffff` |

Estilo de etiqueta de elemento: texto na cor, borda com 30% de opacidade e fundo com 10%. Existe **um** componente `ElementBadge` para isso.

As variáveis que o shadcn espera (`--background`, `--primary`, `--muted`...) apontam para esses tokens, para os primitivos de `ui/` herdarem a paleta.

Contraste: texto sobre fundo precisa de 4.5:1 (WCAG AA). `text-subtle` sobre `surface` não atinge isso e fica restrito a placeholders e legendas não essenciais.

### 2.2 Tipografia

| Token       | Tamanho / altura de linha | Uso                                                                                                       |
| :---------- | :------------------------ | :-------------------------------------------------------------------------------------------------------- |
| `text-xs`   | 12 / 16                   | Legendas, badges. **Tamanho mínimo do app**                                                               |
| `text-sm`   | 14 / 20                   | Texto de interface padrão                                                                                 |
| `text-base` | 16 / 24                   | Texto de leitura (notas, diário, descrições). Campos de entrada no celular (evita zoom automático do iOS) |
| `text-lg`   | 18 / 28                   | Títulos de seção                                                                                          |
| `text-xl`   | 20 / 28                   | Títulos de painel e modal                                                                                 |
| `text-2xl`  | 24 / 32                   | Números de destaque (PV, rodada)                                                                          |

Pesos: 400 (texto), 500 (rótulos e botões), 600 (títulos). Nada abaixo de 12 px: os 74 usos atuais de `text-[9px]`, `text-[10px]` e `text-[11px]` viram `text-xs`.

### 2.3 Espaçamento, raio, sombra

- Espaçamento em múltiplos de 4 px (escala padrão do Tailwind). Nada de `p-[13px]`.
- Raio: `rounded-sm` 4 px (badges), `rounded-md` 6 px (botões, campos), `rounded-lg` 8 px (cards, menus), `rounded-xl` 12 px (modais, drawers).
- Sombra: `shadow-sm` para elementos flutuantes pequenos (menus, tooltips), `shadow-lg` para modais e painéis sobre o mapa. Mais nenhuma.

### 2.4 Camadas (z-index)

Tokens nomeados, usados como `z-(--z-dialog)`:

| Token         | Valor | Uso                                                 |
| :------------ | :---- | :-------------------------------------------------- |
| `--z-map-ui`  | 10    | Controles sobre o mapa (toolbar, iniciativa)        |
| `--z-sidebar` | 20    | Sidebars e drawers laterais                         |
| `--z-header`  | 30    | Header e footer                                     |
| `--z-panel`   | 40    | Painel do mestre                                    |
| `--z-overlay` | 50    | Fundo escurecido de modais                          |
| `--z-dialog`  | 60    | Dialog, Sheet, Drawer, AlertDialog                  |
| `--z-popover` | 70    | Popover, Select, DropdownMenu, ContextMenu, Tooltip |
| `--z-toast`   | 80    | Toasts                                              |

Regra: um modal aberto de dentro de qualquer painel aparece acima dele, sem overlay manual.

### 2.5 Movimento

- Durações: 150 ms (hover, foco, pequenas mudanças) e 250 ms (abrir e fechar painéis, modais, drawers).
- `prefers-reduced-motion`: desliga animações de entrada e pulsos (inclusive o ping do mapa, que vira um marcador estático).

---

## 3. Componentes

### 3.1 Inventário obrigatório

Todo elemento de interface usa um destes. Se faltar algum, adiciona-se ao `ui/` via shadcn antes de usar.

| Categoria    | Componentes                                                                                      |
| :----------- | :----------------------------------------------------------------------------------------------- |
| Ações        | `Button` (variantes: `primary`, `secondary`, `ghost`, `danger`, `icon`), `Toggle`, `ToggleGroup` |
| Entrada      | `Input`, `Textarea`, `NumberInput`, `Select`, `Combobox`, `Checkbox`, `Switch`, `Slider`, `Form` |
| Sobreposição | `Dialog`, `AlertDialog`, `Sheet`, `Drawer`, `Popover`, `Tooltip`, `DropdownMenu`, `ContextMenu`  |
| Feedback     | `Toast` (sonner), `Skeleton`, `Progress`, `Badge`, `EmptyState`                                  |
| Estrutura    | `Card`, `Tabs`, `ScrollArea`, `Separator`, `Collapsible`, `ResponsivePanel` (seção 4.3)          |
| Domínio      | `ElementBadge`, `StatBar` (PV, PE, SAN, PD), `ConditionChip`, `TokenAvatar`, `DiceResult`        |

### 3.2 O que substitui o quê

| Hoje                                                                          | Padrão                                                             |
| :---------------------------------------------------------------------------- | :----------------------------------------------------------------- |
| 28 chamadas de `alert()`, `confirm()`, `prompt()`                             | `Toast`, `AlertDialog`, `Dialog` com `Form`                        |
| 127 atributos `title="..."` como dica                                         | `Tooltip` (e nada em ações que só funcionam com hover)             |
| Menu de contexto do token feito à mão em `AppLayout.tsx`                      | `ContextMenu`, com a mesma ação acessível por botão ou toque longo |
| Overlays próprios com `fixed inset-0` (5 arquivos, incluindo `AddMusicModal`) | `Dialog`, `Sheet` ou `Drawer`                                      |
| Mapas de cor por elemento copiados entre arquivos                             | `ElementBadge` e tokens `element-*`                                |
| Barras de PV/PE montadas em cada tela                                         | `StatBar`                                                          |

### 3.3 Regras de composição

- Um componente de tela não define cores, bordas ou raios próprios: compõe primitivos de `ui/` e usa tokens.
- Variantes via `class-variance-authority` dentro do primitivo, nunca por concatenação de classes na tela.
- Estados obrigatórios em todo componente interativo: padrão, hover, foco visível (`ring` com `primary`), desabilitado, carregando quando houver I/O.
- Toda lista tem estado vazio (`EmptyState`) e, se carrega dados, estado de carregamento (`Skeleton`).
- Ícone sozinho em botão exige `aria-label` e `Tooltip`.
- Textos de interface em português, curtos, verbo no infinitivo em botões ("Salvar", "Apagar token").

---

## 4. Responsividade

### 4.1 Faixas

| Faixa    | Largura                   | Dispositivo alvo         | Quem usa         |
| :------- | :------------------------ | :----------------------- | :--------------- |
| Compacta | < 768 px                  | Celular                  | Jogador          |
| Média    | 768 a 1279 px             | Tablet, notebook pequeno | Mestre e jogador |
| Ampla    | ≥ 1280 px                 | Desktop                  | Mestre           |
| TV       | qualquer, modo espectador | TV ou projetor           | Mesa presencial  |

### 4.2 Layout por faixa

| Região                           | Compacta                                                                    | Média                      | Ampla                                    |
| :------------------------------- | :-------------------------------------------------------------------------- | :------------------------- | :--------------------------------------- |
| Mapa                             | Tela cheia                                                                  | Tela cheia                 | Área central                             |
| Header                           | Barra compacta: sala, conexão, menu                                         | Completo                   | Completo                                 |
| Toolbar do mapa                  | Barra inferior com as ações do papel (jogador: selecionar, ping, meu token) | Vertical flutuante         | Vertical flutuante                       |
| Sidebar esquerda (tokens, zonas) | `Drawer` inferior                                                           | `Sheet` sobreposta ao mapa | Fixa, redimensionável                    |
| Sidebar direita                  | `Drawer` inferior                                                           | `Sheet` sobreposta         | Fixa                                     |
| Painel do mestre                 | Tela cheia, um subpainel por vez com `Tabs`                                 | Uma coluna com `Tabs`      | Três colunas (duas entre 1024 e 1279 px) |
| Modais                           | `Drawer` inferior                                                           | `Dialog`                   | `Dialog`                                 |
| Iniciativa                       | Faixa horizontal com rolagem no topo do mapa                                | Igual                      | Igual                                    |
| TV                               | Só mapa e iniciativa, sem controles                                         | —                          | —                                        |

### 4.3 Regras

- `ResponsivePanel`: um único componente que vira `Drawer` na faixa compacta e `Dialog` ou `Sheet` nas demais. Telas não escolhem isso por conta própria.
- Altura com `h-dvh`, nunca `h-screen` (a barra do navegador móvel corta o conteúdo).
- Respeitar `env(safe-area-inset-*)` em barras fixas.
- Alvos de toque de pelo menos 44×44 px na faixa compacta e 36×36 px nas demais.
- Nenhuma ação exclusiva de hover, clique direito ou atalho de teclado: toda ação tem um caminho por toque.
- Painéis usam container queries (`@container`) para se adaptar à própria largura, já que as colunas do painel do mestre variam independentemente da tela.
- O stage Konva acompanha o tamanho do contêiner com `ResizeObserver`, não com `window.innerWidth`.
- Sem rolagem horizontal da página em nenhuma faixa. Tabelas largas rolam dentro do próprio contêiner.
- Campos de entrada com `text-base` na faixa compacta.

---

## 5. Estabilidade

- **Error boundaries** em: raiz do app, mapa, cada sidebar, cada subpainel do mestre, cada modal. A tela de erro diz o que falhou e tem botão para recarregar só aquela região.
- **Dados defensivos**: todo componente que lê dados de save ou da rede trata campo ausente (`?.`, valor padrão). Dado de formato inesperado é descartado com aviso, nunca derruba a tela.
- **Sem estado duplicado**: um dado tem um dono (store ou `useState`). Componentes não copiam dado de store para estado local, a não ser em formulários de edição.
- **Tamanho de arquivo**: componente com mais de 300 linhas é dividido. `SidebarLeft.tsx`, `ZoneMarkerModal.tsx` e `TokenSheetModal.tsx` são quebrados por seção à medida que forem tocados.
- **Catálogo**: cada componente de `ui/` e de domínio tem story no Storybook com todos os estados da seção 3.3.
- **Regressão visual**: Playwright tira screenshot das telas principais (mapa com tokens, painel do mestre, ficha, modal de zona) em 390×844, 1024×768 e 1440×900. Diferença acima do limite falha o CI.
- **Guarda no CI**: um passo de verificação falha se aparecer hexadecimal arbitrário, `text-[Npx]`, `z-[N]`, `alert(`, `confirm(` ou `prompt(` em `src/` fora de uma lista de exceções que só diminui.

---

## 6. Acessibilidade mínima

- Foco visível em tudo que é interativo. Ordem de tabulação segue a ordem visual.
- Modais prendem o foco e fecham com Esc (já garantido pelos primitivos do Base UI; não recriar).
- Cor nunca é o único indicador: estado de token (morto, inconsciente) tem ícone ou texto além da cor.
- Imagens de token com `alt` igual ao nome do personagem.

---

## 7. Critério de pronto para telas novas ou migradas

1. Só primitivos de `src/components/ui/` e tokens da seção 2.
2. Funciona nas faixas compacta, média e ampla (verificado no navegador).
3. Tem error boundary na região.
4. Tem story no Storybook (componentes) ou screenshot de referência no Playwright (telas).
5. Nenhum item da guarda do CI (seção 5).
