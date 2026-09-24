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

## Como rodar

Pré-requisitos: Node.js 24 (`.nvmrc`) e npm 10.

```bash
npm install
npm run dev
```

Cliente em `http://localhost:5173`, servidor e Socket.io na porta 3001.

| Comando         | Faz                                                                |
| :-------------- | :----------------------------------------------------------------- |
| `npm run dev`   | Cliente e servidor juntos (`dev:client` / `dev:server` para um só) |
| `npm run check` | Formatação, lint, tipos, fronteiras, testes e build                |
| `npm test`      | Testes (Vitest)                                                    |
| `npm run build` | Build de produção                                                  |

## Estrutura

```text
apps/web/          Cliente React 19 + Konva + Vite (@sgm/web)
apps/server/       Servidor Express + Socket.io (@sgm/server)
packages/shared/   Schemas Zod compartilhados (@sgm/shared)
packages/engine/   Regras do jogo (@sgm/engine)
docs/              Arquitetura, specs, planos e decisões
```

Documentação em [`docs/`](docs/README.md). Instruções para agentes de IA em [`AGENTS.md`](AGENTS.md).

## Como trabalhamos (Git)

GitHub Flow com duas linhas ([decisão 0008](docs/decisions/0008-github-flow-duas-linhas.md)). Ninguém commita direto em `master` nem em `next`: tudo entra por PR.

| Branch | O que é | Quem usa |
| :--- | :--- | :--- |
| `master` | v7, a versão do Pedro. Sempre funcionando | Pedro |
| `next` | v8, a modernização (este README) | Ronald e agentes de IA |
| tags `v7.*` | Versões congeladas da v7. `v7.0-pedro-stable` = versão de 2026-09-20 | Quem precisar voltar a uma versão exata |

### Passo a passo de uma tarefa

```bash
git switch next && git pull              # partir da linha atualizada (Pedro: master)
git switch -c feat/nome-da-tarefa        # branch curta: feat/, fix/, refactor/, chore/, docs/
# ... trabalhar e commitar ...
git commit -m "feat(tokens): adicionar filtro por tipo"
git push -u origin feat/nome-da-tarefa   # roda npm run check antes de subir
```

Depois, no GitHub: abrir o PR para a mesma linha (`next` ou `master`), esperar o CI ficar verde, fazer **Squash and merge** e apagar a branch.

### Regras

- Commits e títulos de PR em Conventional Commits: `tipo(escopo): descrição`. Tipos: `feat`, `fix`, `refactor`, `chore`, `docs`, `style`, `test`, `perf`, `ci`, `build`, `revert`.
- Sem `Co-Authored-By` de IA nos commits.
- Correção feita na `master` que ainda vale na v8 vai para a `next` com `git cherry-pick <commit>`, numa branch e por PR.
- A `next` só entra na `master` quando os dois combinarem que a v8 substitui a v7.
- Não rode `master` e `next` no mesmo perfil de navegador: as duas usam o mesmo banco local e a `next` pode apagar os dados salvos.

### Proteções automáticas

O `npm install` ativa os hooks de `.githooks/`, que bloqueiam:

| Hook | Bloqueia |
| :--- | :--- |
| `pre-commit` | Commit direto em `master` ou `next` |
| `commit-msg` | Mensagem fora do padrão e coautoria de IA |
| `pre-push` | Push direto em `master` ou `next`, e push com `npm run check` falhando |

No GitHub, todo PR roda o CI (`npm run check`) e a checagem do título. Não use `--no-verify`: se um hook falhar, corrija a causa.

## Licença

Software proprietário. Todos os direitos reservados. Veja [`LICENSE`](LICENSE).
