# 🎲 Sistema Gerenciador de Mesas (SGM v7.0)

> **Virtual Tabletop (VTT) & Ferramenta do Mestre para RPG de Mesa**  
> Uma plataforma moderna, rápida, colaborativa e em tempo real para mestres e jogadores gerenciarem combates, mapas táticos, anotações e fichas com fluidez.

---

## 🚀 Visão Geral

O **SGM v7.0** é uma ferramenta pensada para mestres que precisam de agilidade na preparação e condução de sessões de RPG de mesa. O projeto combina um **Battlemap 2D interativo** com um **Painel do Mestre completo**, com suporte a **Sincronização Multiplayer em Tempo Real (WebSockets)** e persistência local via IndexedDB.

---

## ✨ Funcionalidades Principais

### 🌐 Multiplayer & Sincronização em Tempo Real (NOVO)

- **Salas com Código Rápido**: O Mestre cria a sala e compartilha um código de 6 caracteres (ex: `SGM-7X2A`).
- **Sincronização de Tokens**: Movimentação, adição, remoção e alteração de HP refletem instantaneamente nas telas de todos os jogadores na mesma sala.
- **Iniciativa Compartilhada**: Passagem de turnos e ordem do combate atualizados ao vivo para o grupo.
- **Pings Táticos**: Clique no mapa com `Alt + Clique` ou botão do meio do mouse para emitir um ping com onda animada e seu nome para alertar o grupo.
- **Lista de Jogadores Online**: Indicador de presença e papéis (Mestre vs Jogador).

### 🗺️ Battlemap & Grid Tático

- **Renderização em Canvas com Konva**: Zoom, pan suave, grid quadrado configurável e medição de distâncias.
- **Camadas Independentes**:
  - **Fundo**: Upload e ajuste de mapas de batalha e imagens de cenário.
  - **Tokens**: Movimentação, rotação, barras de vida, condições/status e context menu rápido.
  - **Zonas de Efeito**: Desenho de áreas retangulares, circulares e poligonais com cores e opacidades customizáveis.
  - **Desenho Livre & Marcadores**: Anotações e marcações táticas em tempo real.

### ⚔️ Gestão de Combate & Iniciativa

- **Barra de Iniciativa Dinâmica**: Controle visual de turnos e rounds.
- **Tracking de Condições & Status**: Aplicação de estados (atordoado, caído, envenenado, etc.) diretamente nos tokens.
- **Modal de Ordenação**: Reorganização fácil da fila de iniciativa durante o combate.

### 🧙‍♂️ Painel do Mestre (Master Panel)

- 📖 **Diário de Campanha**: Registro narrativo de sessões com editor de texto rico e paginação.
- 📝 **Notas Rápidas**: Cartões de anotações (estilo post-it) para NPCs, ganchos e lembretes imediatos.
- 🎯 **Roletas Personalizadas**: Roletas visuais com animação acelerada por hardware para sorteios aleatórios.
- 🎲 **Tabelas Roláveis**: Criação e rolagem de tabelas de encontros, itens e eventos.
- 📜 **Compêndio de Regras**: Consulta rápida a resumos de regras do sistema de jogo.

### 💾 Persistência Offline-First & Nuvem Híbrida

- **Banco IndexedDB via Dexie.js**: Suporte a até 50 slots de salvamento independentes no navegador.
- **Auto-Save Inteligente**: Salvamento automático periódico (a cada 10 minutos) e atalho global `Ctrl + S`.
- **Exportação/Importação**: Salve ou restaure campanhas completas em arquivos `.json`.

---

## 🛠️ Stack Tecnológica

- **Monorepo**: npm workspaces (`@sgm/shared`, `@sgm/client`, `@sgm/server`)
- **Frontend (`client/`)**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/), [Konva](https://konvajs.org/), [Zustand](https://zustand.docs.pmnd.rs/), [Tailwind CSS](https://tailwindcss.com/)
- **Backend (`server/`)**: [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), [Socket.io](https://socket.io/), [TSX](https://github.com/privatenumber/tsx)
- **Tipos Compartilhados (`shared/`)**: TypeScript types contratos estritos de WebSocket e modelos de dados
- **Linter & Formatador**: [Oxlint](https://oxc.rs/) & [Prettier](https://prettier.io/)

---

## 🏁 Como Rodar Localmente

### Pré-requisitos

- **Node.js** (versão 18 ou superior recomendada)
- **npm** (versão 7+ com suporte a workspaces)

### 1. Clonar e Instalar

```bash
git clone https://github.com/Prd225/Sistema-Gerenciador-de-Mesas--SGM-.git
cd Sistema-Gerenciador-de-Mesas--SGM-
npm install
```

### 2. Executar o Projeto Completo (Frontend + Servidor WebSocket)

```bash
npm run dev
```

- O Frontend (Vite) iniciará em `http://localhost:5173`
- O Servidor WebSocket iniciará em `ws://localhost:3001`

---

## 📜 Scripts Disponíveis (Executados na Raiz)

| Comando                | Descrição                                                                                     |
| :--------------------- | :-------------------------------------------------------------------------------------------- |
| `npm run dev`          | Inicia o client (Vite) e o server (Socket.io) em paralelo via `concurrently`.                 |
| `npm run dev:client`   | Inicia apenas o frontend React/Vite.                                                          |
| `npm run dev:server`   | Inicia apenas o servidor de WebSockets.                                                       |
| `npm run build`        | Compila os pacotes `@sgm/shared`, `@sgm/server` e gera o bundle de produção em `@sgm/client`. |
| `npm run typecheck`    | Executa a validação de tipos TypeScript em todos os pacotes.                                  |
| `npm run lint`         | Executa a análise estática com **Oxlint**.                                                    |
| `npm run format`       | Formata todo o repositório com **Prettier**.                                                  |
| `npm run format:check` | Verifica a formatação do código com **Prettier**.                                             |
| `npm run preview`      | Pré-visualiza localmente o build gerado de produção.                                          |

---

## 📁 Estrutura do Monorepo

```text
Sistema-Gerenciador-de-Mesas--SGM-/
├── client/                     # 🎨 Aplicação Frontend (React + Vite + Konva)
│   ├── src/
│   │   ├── canvas/             # Camadas do mapa Konva (StageMap, Grid, Tokens, Zonas, etc.)
│   │   ├── components/         # Componentes React (layout, iniciativa, mestre, modais)
│   │   ├── store/              # Stores Zustand (useTokenStore, useMultiplayerStore, etc.)
│   │   └── lib/                # Socket.io client, Dexie DB e helpers
│   ├── public/                 # Assets estáticos
│   ├── index.html              # Shell HTML
│   ├── package.json            # @sgm/client
│   ├── tailwind.config.js      # Estilização Tailwind
│   └── vite.config.ts          # Configuração do Vite
├── server/                     # ⚡ Servidor Backend WebSocket (Node.js + Socket.io)
│   ├── src/
│   │   ├── handlers/           # Listeners de eventos de socket (token, sala, ping)
│   │   ├── roomManager.ts      # Gerenciamento de salas e presença em memória
│   │   └── index.ts            # Ponto de entrada do servidor HTTP/WS (porta 3001)
│   ├── package.json            # @sgm/server
│   └── tsconfig.json
├── shared/                     # 📦 Pacote de Tipos Compartilhados
│   ├── src/
│   │   ├── types/
│   │   │   ├── game.ts         # Tokens, Zonas, Atributos, Iniciativa
│   │   │   ├── room.ts         # Membros, Salas, Presença, Pings
│   │   │   └── socketEvents.ts # Contrato estrito ClientToServer / ServerToClient
│   │   └── index.ts
│   ├── package.json            # @sgm/shared
│   └── tsconfig.json
├── legacy/                     # 📁 Versão histórica v6.x (HTML/JS legado)
│   └── v6/
├── .github/workflows/ci.yml    # Pipeline de CI (build, lint, typecheck, prettier)
├── .prettierrc                 # Regras do Prettier
└── package.json                # Orquestrador raiz do Monorepo
```

---

## 🤝 Padrões de Desenvolvimento & Contribuição

Para manter o repositório organizado entre múltiplos desenvolvedores:

### Padrão de Branches

- `feat/nome-da-feature`: Novas funcionalidades.
- `fix/nome-do-bug`: Correção de bugs.
- `chore/descricao`: Manutenção, infraestrutura e documentação.

### Padrão de Commits

Utilize **Conventional Commits**:

- `feat: adiciona sincronização de pings no mapa`
- `fix: corrige dessincronização de iniciativa`
- `chore: adiciona monorepo e socket.io`
