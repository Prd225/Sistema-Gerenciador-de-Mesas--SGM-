# SGM — Instruções para Agentes

Regras para qualquer agente de IA. `CLAUDE.md` e `GEMINI.md` só importam este arquivo.

SGM é um Virtual Tabletop de RPG (mapa 2D, painel do mestre, multiplayer). Software proprietário.

## Estrutura

```
apps/web/          @sgm/web     React 19 + Vite (alias @/ -> apps/web/src/)
apps/server/       @sgm/server  Node: Express + Socket.io (vira Fastify na Fase 4)
packages/shared/   @sgm/shared  schemas Zod (domain, protocol, api)
packages/engine/   @sgm/engine  regras do jogo, funções puras
docs/              índice em docs/README.md
```

Não edite: `dist/`, `node_modules/`, `LICENSE`.

## Comandos

- `npm run dev`: web (5173) e server (3001).
- `npm run check`: formatação, lint, tipos, fronteiras, testes e build. **Rode antes de entregar.**
- Durante o trabalho, rode só o necessário (`npm run typecheck`, o teste do módulo).

## Antes de entregar

1. `npm run check` passando.
2. Se mexeu em `apps/web`: abra o app, confira o console sem erros e faça o roteiro de 4 passos de `docs/architecture/frontend-guidelines.md`.
3. Resumo curto: o que mudou, o que você rodou e o que não conseguiu testar. Não diga que testou algo que não rodou.

## Como trabalhar

- Siga a fase atual de `docs/plans/modernizacao-arquitetural.md`. Uma fase por vez, sem adiantar itens.
- Leia o arquivo inteiro antes de editar. Faça edições pontuais, não reescreva arquivos.
- Ao atualizar docs, **substitua** a linha antiga. Nunca deixe a versão velha e a nova lado a lado.
- Docs curtos: tabelas e tópicos, sem repetir o que já está em outro doc. Leia só os docs da tarefa atual. Limite de **50 mil tokens** somando `AGENTS.md`, `README.md` e `docs/` (hoje ~29 mil). O `npm run check` falha se passar.
- Se o spec não bater com o código, pare e explique.

## Onde ler

| Assunto                                     | Documento                                  |
| :------------------------------------------ | :----------------------------------------- |
| Estrutura, camadas, onde colocar arquivos   | `docs/specs/code-architecture.md`          |
| Servidor, protocolo, permissões, segurança  | `docs/specs/system-design.md`              |
| Docker, CI, deploy                          | `docs/specs/ci-cd.md`                      |
| UI, cores, componentes, responsividade      | `docs/specs/ui-design-system.md`           |
| Bibliotecas permitidas                      | `docs/decisions/0006-stack-revisada.md`    |
| Código React (regras tiradas de bugs reais) | `docs/architecture/frontend-guidelines.md` |

`docs/architecture/` = código de hoje. `docs/specs/` = alvo.

## Regras

- **Bibliotecas**: só as da decisão 0006. Auth, SQL e hash usam biblioteca (Better Auth, Drizzle). Só o tempo real (Socket.io) é escrito à mão, sem Colyseus.
- **Sem compatibilidade retroativa** (decisão 0005): pode mudar saves e schemas sem migração.
- **Contratos**: tipos compartilhados ficam em `@sgm/shared`. Nenhum import entre `apps/web` e `apps/server`.
- **Dexie**: mudou o schema, incremente a versão.
- **Multiplayer (até a Fase 6)**: funções `*FromRemote` nunca emitem evento de socket. Evento novo vai em `packages/shared/src/protocol/` e em `apps/server/src/handlers/socketHandlers.ts`. Nada de imagem em Base64.
- **Código**: TypeScript estrito, sem `any` nem `@ts-ignore`. `import type` para tipos. Confira que ícones e APIs existem na versão instalada.
- **UI**: sem hexadecimal novo, `z-[9999]`, `alert`, `confirm` ou `prompt`. Use os primitivos de `apps/web/src/components/ui/`.
- **Git** (GitHub Flow, decisão 0008): comece com `git switch next && git pull && git switch -c tipo/nome` (`feat/`, `fix/`, `refactor/`, `chore/`, `docs/`). Commits em Conventional Commits, **sem `Co-Authored-By` de IA**. **Nunca mexa na `master`**: é a versão do Pedro. Sem push nem PR sem pedido. Não altere `LICENSE` nem o campo `license`. Sem emojis em código, commits e docs.
- **Hooks** (`.githooks/`, ativados pelo `npm install`): bloqueiam commit na `master`/`next`, mensagem fora do padrão, coautoria de IA e push com `npm run check` falhando. **Nunca use `--no-verify`**; se um hook falhar, corrija a causa.
