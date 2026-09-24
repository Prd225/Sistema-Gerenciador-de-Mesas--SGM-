# 🎲 Sistema Gerenciador de Mesas (SGM v7.0)

> **Virtual Tabletop (VTT) & Ferramenta do Mestre para RPG de Mesa**  
> Uma plataforma moderna, rápida e _offline-first_ para mestres e jogadores gerenciarem combates, mapas táticos, anotações e fichas com fluidez.

---

## 🚀 Visão Geral

O **SGM v7.0** é uma ferramenta pensada para mestres que precisam de agilidade na preparação e condução de sessões de RPG de mesa. O projeto combina um **Battlemap 2D interativo** com um **Painel do Mestre completo**, armazenando tudo localmente no navegador sem depender de servidores externos.

---

## ✨ Funcionalidades Principais

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

### 💾 Persistência Offline-First

- **Banco IndexedDB via Dexie.js**: Suporte a até 50 slots de salvamento independentes.
- **Auto-Save Inteligente**: Salvamento automático periódico (a cada 10 minutos) e atalho global `Ctrl + S`.
- **Exportação/Importação**: Salve ou restaure campanhas completas em arquivos `.json`.

---

## 🛠️ Stack Tecnológica

- **Core**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Canvas 2D**: [Konva](https://konvajs.org/) & [react-konva](https://github.com/konvajs/react-konva)
- **Gerenciamento de Estado**: [Zustand](https://zustand.docs.pmnd.rs/)
- **Estilização & UI**: [Tailwind CSS](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/), [Base UI / Radix](https://base-ui.com/)
- **Banco de Dados Local**: [Dexie.js](https://dexie.org/) (IndexedDB)
- **Linter & Formatador**: [Oxlint](https://oxc.rs/) & [Prettier](https://prettier.io/)

---

## 🏁 Como Rodar Localmente

### Pré-requisitos

- **Node.js** (versão 18 ou superior recomendada)
- **npm** (ou pnpm/yarn)
- **Node.js** (versão 24 ou superior recomendada, consulte `.nvmrc`)
- **npm** (versão 10 ou superior)

### 1. Clonar o repositório

```bash
git clone https://github.com/Prd225/Sistema-Gerenciador-de-Mesas--SGM-.git
cd Sistema-Gerenciador-de-Mesas--SGM-
```

### 2. Instalar as dependências

```bash
npm install
```

### 3. Executar o servidor de desenvolvimento

```bash
npm run dev
```

Abra o navegador em `http://localhost:5173` (ou execute `npm run dev -- --open` para abrir automaticamente).
Abra o navegador em `http://localhost:5173`. O servidor de backend e Socket.io inicia na porta 3001.

---

## 📜 Scripts Disponíveis

| Comando                | Descrição                                                                     |
| :--------------------- | :---------------------------------------------------------------------------- |
| `npm run dev`          | Inicia o servidor Vite para desenvolvimento local com HMR.                    |
| `npm run build`        | Compila o TypeScript (`tsc -b`) e gera o bundle de produção otimizado.        |
| `npm run preview`      | Pré-visualiza localmente o build gerado em `dist/`.                           |
| `npm run typecheck`    | Executa a verificação de tipos do TypeScript sem gerar arquivos.              |
| `npm run lint`         | Executa a análise estática ultrarrápida de código com **Oxlint**.             |
| `npm run format`       | Formata todos os arquivos do projeto de acordo com as regras do **Prettier**. |
| `npm run format:check` | Verifica se há arquivos que não estão formatados com o **Prettier**.          |
| Comando                                     | Descrição                                                                      |
| :------------------------------------------ | :----------------------------------------------------------------------------- |
| `npm run dev`                               | Executa cliente web (`@sgm/web`) e servidor (`@sgm/server`) em paralelo.       |
| `npm run dev:client` / `npm run dev:server` | Executa apenas o cliente ou apenas o servidor.                                 |
| `npm run build`                             | Compila workspaces e gera o bundle de produção do cliente em `apps/web/dist/`. |
| `npm test`                                  | Executa os testes automatizados com **Vitest** em todos os workspaces.         |
| `npm run typecheck`                         | Valida a tipagem estrita com TypeScript (`tsc -b --noEmit`).                   |
| `npm run lint`                              | Executa a análise estática ultrarrápida de código com **Oxlint**.              |
| `npm run format` / `npm run format:check`   | Formata ou verifica formatação de todo o monorepo com **Prettier**.            |
| `npm run depcruise`                         | Valida regras de fronteira arquitetural entre pacotes com dependency-cruiser.  |
| `npm run preview`                           | Pré-visualiza localmente o build do cliente web.                               |

---

## 📁 Estrutura do Projeto

Documentação técnica em [`docs/`](docs/README.md). Instruções para agentes de IA em [`AGENTS.md`](AGENTS.md).

```text
Sistema-Gerenciador-de-Mesas--SGM-/
├── docs/                  # Arquitetura, planos e registros de decisão
├── public/                # Favicons, ícones e assets estáticos
├── server/src/            # Servidor Node (Express + Socket.io)
├── src/
│   ├── assets/            # Imagens e vetores da interface
│   ├── canvas/            # Componentes Konva do Battlemap (StageMap, Grid, Tokens, Zonas, etc.)
│   ├── components/        # Componentes React modulares
│   │   ├── initiative/    # Barra e modal de iniciativa
│   │   ├── layout/        # Shell da aplicação (Header, Footer, Sidebars, AppLayout)
│   │   ├── master-panel/  # Telas do Painel do Mestre (diário, notas, roletas, regras, tabelas)
│   │   ├── modals/        # Modais de ficha, criação de token, save/load
│   │   ├── sidebar/       # Menus retráteis esquerdo e direito
│   │   ├── tokens/        # Gestão de condições e status
│   │   ├── toolbar/       # Barra de ferramentas do mapa
│   │   └── ui/            # Primitivos de UI reutilizáveis (botões, inputs, dialogs)
│   ├── hooks/             # Custom React Hooks
│   ├── lib/               # Instância do Dexie (db.ts), helpers de persistência e UUIDs
│   ├── store/             # Stores Zustand fatiados por domínio
│   ├── types/             # Tipagens TypeScript (campanha, tokens, regras, tabelas, etc.)
│   ├── App.tsx            # Componente raiz da aplicação
│   ├── main.tsx           # Ponto de entrada do React
│   └── index.css          # Configurações globais do Tailwind e temas
├── .oxlintrc.json         # Configuração do Oxlint
├── .prettierrc            # Regras de formatação do Prettier
├── .prettierignore        # Arquivos ignorados pelo Prettier
├── components.json        # Configuração do Shadcn UI
├── index.html             # Shell HTML servido pelo Vite
├── package.json           # Dependências e scripts
├── tailwind.config.js     # Configuração do Tailwind CSS
├── tsconfig.json          # Configuração base do TypeScript
└── vite.config.ts         # Configuração do Vite (com alias @ -> ./src)
├── apps/
│   ├── web/                   # Aplicação frontend React 19 + Konva + Vite (@sgm/web)
│   │   ├── src/               # Código-fonte do cliente (canvas, components, store, lib)
│   │   ├── public/            # Assets estáticos servidos pelo Vite
│   │   ├── index.html         # Shell HTML da aplicação
│   │   ├── vite.config.ts     # Configuração do Vite
│   │   └── package.json       # Dependências e scripts do cliente
│   └── server/                # Servidor Node Express + Socket.io (@sgm/server)
│       ├── src/               # Handlers de socket, rotas auth, RoomManager
│       └── package.json       # Dependências e scripts do servidor
├── packages/
│   ├── shared/                # Contratos, schemas Zod e constantes compartilhadas (@sgm/shared)
│   │   └── src/               # domain/, protocol/, api/, constants/
│   └── engine/                # Regras puras do jogo e autoridade de salas (@sgm/engine)
│       └── src/               # Estado, comandos, eventos e testes
├── docs/                      # Arquitetura, planos e registros de decisão (ADRs)
├── .dependency-cruiser.cjs    # Regras arquiteturais de fronteira entre pacotes
├── .oxlintrc.json             # Configuração do Oxlint
├── .prettierrc                # Regras de formatação do Prettier
├── package.json               # Gerenciador de workspaces npm e scripts orquestradores
├── tsconfig.base.json         # Configuração base do compilador TypeScript
└── tsconfig.json              # Solution tsconfig com project references
```

---

## 🤝 Padrões de Desenvolvimento & Contribuição

Para manter o repositório organizado entre múltiplos desenvolvedores:

### Padrão de Branches

Crie sempre uma branch a partir da `master` para suas alterações:

- `feat/nome-da-feature`: Novas funcionalidades.
- `fix/nome-do-bug`: Correção de bugs.
- `chore/descricao`: Manutenção, documentação, organização de arquivos e tooling.
- `refactor/descricao`: Refatoração sem alteração de comportamento.

### Padrão de Commits

Utilize o padrão **Conventional Commits**:

- `feat: adiciona filtro por tipo na lista de tokens`
- `fix: corrige clique duplo na roleta`
- `style: ajusta espaçamento do painel lateral`
- `chore: adiciona prettier e atualiza readme`
