# Sistema Gerenciador de Mesas (SGM v7.0)

> **Plataforma web all-in-one & offline-first para gestão de sessões de RPG de mesa** — combinando battlemap tático 2D, controle de cenas e turnos, painel completo do mestre, bandeja de dados e fichas modulares orientadas por DSL própria (**SGM-SDL**).

---

## 1. Visão Geral & Problema Resolvido

Conduzir uma sessão de RPG de mesa costuma exigir um ecossistema fragmentado: um VTT aberto em uma aba para o mapa, players externos para trilha sonora, editores de texto para anotações de campanha, PDFs de regras, geradores de tabelas aleatórias e ferramentas separadas para fichas e rolagem de dados. Essa dispersão gera troca constante de telas, perda de ritmo narrativo e sobrecarga cognitiva para quem mestra.

O **SGM (Sistema Gerenciador de Mesas)** foi projetado para eliminar esse atrito reunindo tudo em um **fluxo único de trabalho de baixo atrito**, com persistência local imediata (**IndexedDB**):

- **Battlemap 2D Interativo (`StageMap`)**: Grid tático em 60 FPS via HTML5 Canvas (`konva` / `react-konva`), upload de mapas de fundo, zonas geométricas (retângulos, elipses e polígonos) com inspeção contextual, névoa de guerra (`FogLayer`), marcadores SVG, desenho livre e controle de tokens.
- **Ritmo de Sessão e Combate**: Controle contínuo de cena, round, turno e urgência com barra de iniciativa dedicada (`InitiativeBar`).
- **Painel do Mestre em 3 Colunas Configuráveis (`MasterPanel`)**: Workspace acoplável que reúne **Trilha Sonora / Soundpad** (YouTube e integração Spotify + importador de playlists), **Cenas**, **Diário de Campanha** (editor rich-text), **Notas Rápidas**, **Regras**, **Tabelas Roláveis**, **Roletas Personalizadas** e **Inventário / Handouts**.
- **Fichas Modulares & Linguagem SGM-SDL**: Compilador completo no frontend (`src/lib/sheet-dsl/`) que transforma declarações textuais legíveis em fichas reativas agnósticas de sistema, com suporte a atributos, estatísticas derivadas via DAG, recursos, perícias, habilidades e progressão por níveis.
- **Bandeja de Dados (`DiceTray`)**: Rolagens animadas integradas diretamente às fórmulas de atributos, perícias, ações e habilidades.

---

## 2. Evolução Arquitetural (Do Monolito ao Sistema Modular)

A base de código do SGM registra uma transição explícita de validação rápida para engenharia modular sustentável, acelerada por um fluxo **AI-First** (desenvolvimento assistido por IA).

### 2.1 Protótipo Monolítico (`legacy/v6/`)

O projeto nasceu como um dashboard único em Vanilla HTML/CSS/JS em [`legacy/v6/`](./legacy/v6/README.md):

- [`legacy/v6/DM_tool_6v.html`](./legacy/v6/DM_tool_6v.html) (~1.267 linhas — *"GM Dashboard V6.6 - Final Ordem"*), concentrando marcação de layout CSS Grid (`header`, sidebars, mapa, `footer`), estilos inline e painéis.
- [`legacy/v6/js/app.js`](./legacy/v6/js/app.js) (596 linhas) e [`legacy/v6/css/styles.css`](./legacy/v6/css/styles.css) (200 linhas), com manipulação direta de DOM e estado acoplado à interface.

Esse formato permitiu validar rapidamente o layout central de condução de mesa antes de investir em infraestrutura complexa.

### 2.2 Reestruturação Modular (`src/`)

Para comportar múltiplas camadas de canvas, persistência robusta e novos subsistemas sem regressões, a aplicação foi reescrita em uma SPA modular baseada no ecossistema **React (atualmente React 19 — `^19.2.7`, evolução da arquitetura concorrente iniciada no React 18)**, **TypeScript** (`~6.0.2`), **Vite** (`^8.1.1`), **Zustand** (`^5.0.14`), **React Konva** (`^19.2.5`) e **Dexie.js** (`^4.4.4`):

- **Separação entre renderização, estado e domínio**: Canvas 2D dividido em camadas independentes (`GridLayer`, `BackgroundLayer`, `ZoneLayer`, `FogLayer`, `TokenLayer`, `MarkerLayer`, `DrawingLayer`) para evitar re-renderizações em eventos de ponteiro de alta frequência.
- **Estado fatiado por domínio**: 20 stores atômicas em [`src/store/`](./src/store) desacopladas por responsabilidade, persistindo automaticamente até 50 slots de campanha no IndexedDB ([`src/lib/db.ts`](./src/lib/db.ts), [`src/lib/saveHelpers.ts`](./src/lib/saveHelpers.ts)) além de importação/exportação completa em `.json`.

### 2.3 Fluxo de Desenvolvimento Assistido por IA (AI-First)

O repositório adota uma abordagem **AI-First**, utilizando agentes de IA como multiplicadores de arquitetura e implementação a partir de especificações técnicas versionadas:

- **Especificação antes de código**: Documentos estruturais em [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) e [`docs/ROADMAP_FEATURES.md`](./docs/ROADMAP_FEATURES.md) servem como contexto formal para planejamento de features e contratos de tipos.
- **Construção de subsistemas complexos**: Sub-motores como o compilador completo de fichas **SGM-SDL** (`lexer.ts` → `parser.ts` → `analyzer.ts` → `diceEngine.ts` + `editorIntelligence.ts`) e a engine progressiva de evolução (`@progression`, `@step`, `branch`) foram estruturados com separação estrita de AST, análise semântica em DAG e tipagem forte.
- **Qualidade automatizada**: Verificação contínua com `tsc -b`, análise estática com `oxlint` e formatação padronizada com `prettier`.

---

## 3. Iteração Guiada por Uso Real & Decisões de Escopo

O SGM já foi testado e validado em **4 sessões reais com usuários**. O feedback obtido durante o uso ao vivo orientou três decisões práticas de produto e engenharia que definem o ciclo atual do projeto:

1. **Simplificação de Navegação e Redução de Troca de Telas**:
   - Em sessões reais, alternar entre múltiplos modais desconcentra quem está mestrando. A interface passou a priorizar inspeção contextual diretamente nas sidebars (`sidebar/zone/tabs/`), painéis acoplados nas 3 colunas do Painel do Mestre e acionamento direto de evolução de ficha pelo cabeçalho do perfil (`ProfileSection`) em vez de módulos redundantes.
2. **Refatoração Progressiva para um Design System Modular**:
   - Consolidação gradual de estilos que nasceram hard-coded nos componentes em direção a tokens semânticos CSS (`--bg-canvas`, `--bg-app`, `--bg-surface`, `--bg-surface-elevated`, `--border-subtle`, `--brand-purple`, `--brand-gold`, `--sheet-accent`) integrados ao Tailwind CSS e primitivos reutilizáveis em [`src/components/ui/`](./src/components/ui).
3. **Corte Estratégico de Escopo (Desacoplamento da Camada WebSocket em `server/`)**:
   - O projeto possui um servidor Node.js + Express + Socket.io em [`server/`](./server/src/index.ts) (`RoomManager`, `socketHandlers`, `playerView`, além de resquícios de experimentos de workspace em `apps/` e `packages/`).
   - Com base nos aprendizados das sessões reais, optou-se por **priorizar performance local, estabilidade offline-first, modularidade e a experiência central do Mestre**, desacoplando/removendo a criticidade da sincronização multiplayer em tempo real via WebSocket do fluxo principal antes de reintroduzir recursos de rede em versões futuras.

---

## 4. Arquitetura & Módulos Principais

```text
Sistema-Gerenciador-de-Mesas--SGM-/
├── docs/                           # Documentação técnica (ARCHITECTURE.md, ROADMAP_FEATURES.md)
├── legacy/v6/                      # Protótipo monolítico arquivado (DM_tool_6v.html, css/, js/)
├── server/src/                     # Camada Express + Socket.io em desacoplamento (index.ts, roomManager.ts, handlers/)
└── src/
    ├── canvas/                     # Battlemap 2D em React Konva (Stage, Grid, BG, Zonas, Fog, Tokens, Marcadores, Desenho)
    ├── components/
    │   ├── master-panel/           # Painel do Mestre 3 colunas (diary, scenes, soundpad, notes, rules, tables, roulettes, inventory)
    │   ├── modular-sheet/          # Interface das Fichas Modulares, editor DSL com autocomplete e modal de evolução
    │   ├── sidebar/                # Sidebars retráteis e abas contextuais de Zona (General, NPCs, Threats, Missions, Inventory, Diary, Highlights)
    │   ├── dice-tray/              # Bandeja interativa de dados (DiceTrayWindow, DiceTrayCanvas, histórico e áudio)
    │   ├── initiative/             # Barra visual de ordem de iniciativa e turnos
    │   ├── toolbar/                # Barra de ferramentas de manipulação do mapa
    │   ├── modals/                 # Modais de Save/Load (50 slots), criação/aparência de tokens, ficha e zonas
    │   ├── tokens/                 # Gestão de condições e status em tokens
    │   ├── player/                 # Componentes auxiliares da visão de jogador (HUD, projeção, handouts, áudio)
    │   ├── layout/                 # Shell principal (AppLayout, Header, Footer)
    │   └── ui/                     # Primitivos de Design System (button, dialog, dropdown-menu, input, select, ImageCropper, RichTextEditor)
    ├── lib/
    │   ├── sheet-dsl/              # Compilador SGM-SDL (lexer, parser, analyzer DAG, diceEngine, editorIntelligence, presets, types)
    │   ├── db.ts / saveHelpers.ts  # Banco Dexie (IndexedDB), auto-save com debounce e backup .json
    │   ├── dice*.ts                # Síntese de áudio, háptica, registry DOM e configuração da bandeja de dados
    │   └── spotify*.ts / *Importer # Integração de playlists e reprodução no Soundpad
    ├── store/                      # 20 stores Zustand especializadas por domínio
    ├── hooks/                      # Hooks customizados React
    └── types/                      # Contratos de tipos TypeScript do domínio
```

### Detalhamento por Domínio

- **`src/canvas/`**: `StageMap.tsx`, `GridLayer.tsx`, `BackgroundLayer.tsx`, `ZoneLayer.tsx`, `FogLayer.tsx`, `TokenLayer.tsx`, `MarkerLayer.tsx` e `DrawingLayer.tsx` — suporta zoom centrado no cursor, seleção em área (`marquee`), arrasto em lote de tokens e renderização de zonas/marcadores com alta taxa de quadros.
- **`src/components/master-panel/`**: Orquestrado por `MasterPanelOverlay.tsx` e `MasterPanelMenu.tsx`, permite distribuir os subpainéis `diary/`, `scenes/`, `soundpad/` (`YouTube` e `Spotify`), `notes/`, `rules/`, `tables/`, `roulettes/` e `inventory/` nas colunas esquerda, central e direita sem duplicação de módulos.
- **`src/lib/sheet-dsl/` & `src/components/modular-sheet/`**: Implementa a linguagem declarativa **SGM-SDL** (`lexer.ts`, `parser.ts`, `analyzer.ts`, `diceEngine.ts`, `presets.ts`) com múltiplos layouts, abas, páginas lógicas compartilhadas, editor com destaque sintático/autocomplete (`SheetDSLEditor.tsx`) e fluxo guiado de subida de nível (`ProgressionUpgradeModal.tsx`).
- **`src/store/`**: 20 stores Zustand — `useCampaignStore`, `useZoneStore`, `useTokenStore`, `useMasterPanelStore`, `useModularSheetStore`, `useDiceTrayStore`, `useFogStore`, `useSoundpadStore`, `useScenesStore`, `useDiaryStore`, `useNotesStore`, `useRulesStore`, `useTablesStore`, `useRoulettesStore`, `useInventoryStore`, `useTimerStore`, `useLoadingStore`, `useMultiplayerStore`, `usePlayerAudioStore` e `usePlayerHandoutsStore`.
- **`src/lib/`**: Persistência *offline-first* (`db.ts`, `saveHelpers.ts`), motor de áudio/háptica de dados (`diceAudio.ts`, `diceHaptics.ts`, `diceShake.ts`, `diceSoundConfig.ts`, `diceDOMRegistry.ts`), utilitários de mídia/importação (`mediaUpload.ts`, `playlistImporter.ts`, `spotifyAuth.ts`, `spotifyPlayer.ts`) e infraestrutura auxiliar (`roomRole.ts`, `socket.ts`, `soundpadBroadcast.ts`, `uuid.ts`, `utils.ts`).

---

## 5. Stack Tecnológica & Como Rodar Localmente

### Dependências Principais (`package.json`)

- **Core & Runtime**: `react` (`^19.2.7`), `react-dom` (`^19.2.7`), `typescript` (`~6.0.2`), `vite` (`^8.1.1`), `@vitejs/plugin-react` (`^6.0.3`), `@types/node` (`^24.13.2`), `@types/react` (`^19.2.17`), `@types/react-dom` (`^19.2.3`)
- **Canvas & Drag-and-Drop**: `konva` (`^10.3.0`), `react-konva` (`^19.2.5`), `use-image` (`^1.1.4`), `@dnd-kit/core` (`^6.3.1`), `@dnd-kit/sortable` (`^10.0.0`), `@dnd-kit/utilities` (`^3.2.2`)
- **Estado & Persistência Local**: `zustand` (`^5.0.14`), `dexie` (`^4.4.4`), `dexie-react-hooks` (`^4.4.0`)
- **UI, Estilização & Mídia**: `tailwindcss` (`^3.4.19`), `postcss` (`^8.5.16`), `autoprefixer` (`^10.5.2`), `@base-ui/react` (`^1.6.0`), `shadcn` (`^4.13.0`), `class-variance-authority` (`^0.7.1`), `clsx` (`^2.1.1`), `tailwind-merge` (`^3.6.0`), `tw-animate-css` (`^1.4.0`), `lucide-react` (`^1.23.0`), `@fontsource-variable/geist` (`^5.2.9`), `react-youtube` (`^10.1.0`)
- **Servidor Auxiliar (Camada em Desacoplamento)**: `express` (`^4.21.2`), `cors` (`^2.8.5`), `socket.io` (`^4.8.3`), `socket.io-client` (`^4.8.3`), `@types/cors` (`^2.8.17`), `@types/express` (`^5.0.0`)
- **Qualidade, Execução & Build**: `oxlint` (`^1.71.0`), `prettier` (`^3.9.6`), `tsx` (`^4.19.3`), `concurrently` (`^10.0.5`)

### Pré-requisitos

- **Node.js** 18+ (recomendado Node 20+ / 24+)
- **npm**

### Instalação e Execução

```bash
# 1. Clonar o repositório
git clone https://github.com/Prd225/Sistema-Gerenciador-de-Mesas--SGM-.git
cd Sistema-Gerenciador-de-Mesas--SGM-

# 2. Instalar dependências
npm install

# 3. Rodar apenas a aplicação frontend (modo recomendado / offline-first)
npm run dev:client
```

A aplicação estará disponível em `http://localhost:5173`.

> **Nota:** Caso deseje subir também o servidor auxiliar legado em `server/` junto ao frontend, utilize `npm run dev`.

### Scripts Disponíveis

| Comando                | Descrição                                                                       |
| :--------------------- | :------------------------------------------------------------------------------ |
| `npm run dev:client`   | Inicia o servidor de desenvolvimento Vite apenas para o frontend (`src/`).      |
| `npm run dev`          | Sobe frontend (Vite) e servidor auxiliar (`tsx watch server/src/index.ts`).     |
| `npm run dev:server`   | Inicia somente o servidor auxiliar em `server/src/index.ts`.                    |
| `npm run build`        | Executa checagem TypeScript (`tsc -b`) e gera o bundle de produção (`dist/`).   |
| `npm run preview`      | Pré-visualiza localmente o build gerado em `dist/`.                             |
| `npm run typecheck`    | Valida tipos TypeScript sem emitir arquivos (`tsc -b --noEmit`).                |
| `npm run lint`         | Executa análise estática com **Oxlint**.                                        |
| `npm run format`       | Formata o código do repositório com **Prettier**.                               |
| `npm run format:check` | Verifica conformidade de formatação com **Prettier**.                           |
| `npm run dev:tunnel`   | Sobe cliente, servidor auxiliar e túnel (`scripts/tunnel.js`) simultaneamente.  |
