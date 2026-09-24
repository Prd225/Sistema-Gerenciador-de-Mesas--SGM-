# SGM — Instruções para Agentes de IA

Fonte única de regras para qualquer agente (Claude, Gemini, Cursor, Copilot, Codex). `CLAUDE.md` e `GEMINI.md` apenas importam este arquivo. Não duplique regras neles.

## O que é

Sistema Gerenciador de Mesas (SGM v7): Virtual Tabletop para RPG com battlemap 2D, painel do mestre e multiplayer em tempo real. Frontend React e servidor Node no mesmo repositório, um único `package.json`.

## Comandos

| Comando                                     | Uso                                                                                      |
| :------------------------------------------ | :--------------------------------------------------------------------------------------- |
| `npm run dev`                               | Cliente (Vite, porta 5173) e servidor (tsx watch, porta 3001) juntos                     |
| `npm run dev:client` / `npm run dev:server` | Só um dos lados                                                                          |
| `npm run typecheck`                         | Checa cliente **e** servidor (`tsc -b` com `tsconfig.app.json` e `tsconfig.server.json`) |
| `npm run lint`                              | Oxlint                                                                                   |
| `npm run format` / `npm run format:check`   | Prettier                                                                                 |
| `npm run build`                             | Build de produção do cliente                                                             |

Antes de concluir qualquer tarefa: `npm run format:check && npm run lint && npm run typecheck && npm run build`. Ainda não existem testes automatizados (ver plano, Fase 1).

**Mudou algo em `src/`?** Os comandos acima não bastam. Abra o app no navegador, confira que o console não mostra erros novos e rode o roteiro de fumaça de `docs/architecture/frontend-guidelines.md`. Se não conseguir testar no navegador, diga isso na entrega em vez de declarar a tarefa concluída.

## Mapa do repositório

```
src/                  Frontend React 19 (alias @/ -> src/)
  canvas/             Battlemap Konva: StageMap e camadas
  components/         UI por domínio (master-panel/, modals/, sidebar/, ui/ ...)
  store/              14 stores Zustand, um por domínio
  lib/                db.ts (Dexie), saveHelpers.ts (autosave), socket.ts, Spotify
  types/              Tipos do domínio. O servidor também importa daqui
server/src/           Servidor Node: Express (/api/auth) + Socket.io + RoomManager
docs/                 Documentação (índice em docs/README.md)
```

Não edite: `client/`, `shared/` (pastas órfãs de build antigo, serão removidas), `dist/`, `server/dist/`, `node_modules/`.

## O que ler antes de cada tipo de tarefa

| Se a tarefa envolve...                                  | Leia                                                                                  |
| :------------------------------------------------------ | :------------------------------------------------------------------------------------ |
| Mapa, tokens, zonas, zoom, coordenadas                  | `docs/architecture/canvas.md`                                                         |
| Stores, autosave, IndexedDB, slots de campanha          | `docs/architecture/state-and-persistence.md`                                          |
| Eventos de socket, salas, sincronização, servidor, auth | `docs/architecture/multiplayer-and-server.md`                                         |
| Qualquer mudança em componentes React ou stores         | `docs/architecture/frontend-guidelines.md` (obrigatório)                              |
| Cores, componentes de UI, layout, responsividade        | `docs/specs/ui-design-system.md` (alvo) e `docs/architecture/design-system.md` (hoje) |
| Servidor, protocolo, salas, permissões, segurança       | `docs/specs/system-design.md`                                                         |
| Instalar ou trocar biblioteca                           | `docs/decisions/0004-stack-definida.md`                                               |
| Refatoração estrutural ou mudança de arquitetura        | `docs/plans/modernizacao-arquitetural.md` e `docs/decisions/`                         |
| Nova funcionalidade de produto                          | `docs/plans/roadmap-features.md`                                                      |

`docs/architecture/` descreve o código **de hoje**. `docs/specs/` descreve o **alvo**. Código novo segue o spec; código antigo que você não está migrando continua como está.

## Como trabalhar

1. **Entenda antes de editar.** Leia os documentos da tabela acima e os arquivos que vai alterar por inteiro, não só o trecho. Procure com `grep` quem mais usa a função, o tipo ou o evento que você vai mudar.
2. **Escopo pequeno.** Uma tarefa, um PR, uma fase do plano por vez. Não aproveite para refatorar o que não foi pedido.
3. **Edite, não reescreva.** Faça mudanças pontuais. Reescrever um arquivo inteiro para mudar um trecho apaga código que você não leu.
4. **Verifique.** Rode os comandos da seção "Comandos" e, se mexeu em `src/`, teste no navegador (roteiro em `docs/architecture/frontend-guidelines.md`).
5. **Relate com honestidade.** Diga o que foi feito, o que foi verificado e como, e o que ficou pendente ou não foi testado. Nunca declare concluído algo que não rodou.
6. **Na dúvida, pare.** Se o plano ou o spec não fizer sentido diante do código, explique o conflito em vez de improvisar uma solução.

## Erros comuns a evitar

| Erro                                                                  | Como evitar                                                                                            |
| :-------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| Inventar API de biblioteca ou usar a de outra versão                  | Confira a versão em `package.json` e o código em `node_modules/<lib>` ou a documentação daquela versão |
| Usar ícone do `lucide-react` que não existe                           | Confira em `node_modules/lucide-react` antes de importar                                               |
| Importar tipo como valor                                              | `import type { ... }` para tipos                                                                       |
| Deixar código morto, imports não usados ou `console.log` de depuração | Revise o diff antes de entregar. `npm run lint` pega parte disso                                       |
| Editar `client/`, `shared/` ou `dist/` antigos em vez de `src/`       | Veja "Não edite" acima                                                                                 |
| Resolver sobreposição com `z-[9999]` ou overlay manual                | Escala de z-index do design system                                                                     |
| Hexadecimal, `text-[10px]` ou estilo solto na tela                    | Tokens e primitivos de `src/components/ui/`                                                            |
| `alert`, `confirm`, `prompt`                                          | `Toast`, `AlertDialog`, `Dialog`                                                                       |
| Timer, listener ou `socket.on` sem limpeza                            | Retorno de limpeza em todo `useEffect`                                                                 |
| Ler estado antigo dentro de callback assíncrono                       | `useXStore.getState()` no momento da execução                                                          |
| Instalar biblioteca que resolve o mesmo que outra já aprovada         | Lista fechada em `docs/decisions/0004-stack-definida.md`                                               |
| Desligar regra de lint, usar `any` ou `@ts-ignore` para passar no CI  | Corrija o tipo. Se não der, explique na entrega                                                        |
| Arquivo gigante crescendo mais                                        | Extraia um componente novo na mesma pasta                                                              |
| Afirmar que testou sem ter testado                                    | Descreva exatamente o que rodou                                                                        |

## Regras

### Arquitetura

- **Stack fixa**: lista fechada em `docs/decisions/0004-stack-definida.md`. Não introduza biblioteca, framework, banco, serviço externo ou BaaS (Supabase, Firebase) fora dela sem uma nova decisão em `docs/decisions/`.
- **Sem compatibilidade retroativa por enquanto** (`docs/decisions/0005-sem-compatibilidade-retroativa.md`): o projeto está em desenvolvimento. Pode mudar formato de save, schema do Dexie, schema do Postgres e contratos de socket sem migração nem shims. Não escreva código de compatibilidade com formatos antigos.
- **Tipos compartilhados**: alterar `src/types/game.ts` ou `src/types/multiplayer.ts` afeta o servidor. Rode `npm run typecheck` (cobre os dois lados).
- **Dexie**: ao mudar o schema em `src/lib/db.ts`, incremente a versão. Dados antigos podem ser descartados.
- **Canvas**: toda conversão tela -> mundo usa a matriz inversa do stage (detalhes em `docs/architecture/canvas.md`).

### Multiplayer (estado de transição)

O servidor está migrando de "repassador de eventos" para "autoridade da sala" (plano, Fases 2 e 3). Até essa migração:

- Ação local: o store atualiza o estado, chama `triggerAutoSave()` e emite o evento de socket.
- Ação remota: o listener em `useMultiplayerStore` chama `*FromRemote`, que só atualiza o estado. **Uma função `*FromRemote` nunca emite evento de socket.**
- Todo evento novo precisa ser declarado em `ClientToServerEvents` / `ServerToClientEvents` (`src/types/multiplayer.ts`) e tratado em `server/src/handlers/socketHandlers.ts`.
- Não transmita imagens em Base64 em eventos novos. Se precisar, sinalize: o upload por HTTP está no plano (Fase 5).

### Código

- TypeScript estrito. Evite `any` em código novo.
- Imports do cliente usam o alias `@/`.
- Termos técnicos em inglês no código (token, store, payload, layer). Textos da interface em português.
- Sem emojis em código novo, commits e documentação. Não remova emojis já existentes na interface sem pedido.
- Comentários só quando o porquê não é óbvio.

### Git

- Branches: `feat/`, `fix/`, `refactor/`, `chore/`, `docs/` a partir de `master`.
- Commits no padrão Conventional Commits (`feat(canvas): ...`, `fix(persistence): ...`).
- Não faça push, force push ou merge sem pedido explícito.

## Documentação

- `docs/architecture/` descreve o sistema **como ele está hoje**. Se você mudar o comportamento descrito lá, atualize o documento no mesmo commit.
- `docs/plans/` descreve o que ainda vai ser feito. Marque os itens concluídos.
- Decisões de arquitetura novas viram um arquivo em `docs/decisions/` (modelo em `docs/decisions/README.md`).
