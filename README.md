# Sistema Gerenciador de Mesas (SGM)

Mesa virtual de RPG: mapa 2D com tokens, zonas e iniciativa, painel do mestre (diário, notas, regras, tabelas, roletas, trilha sonora) e, na v8, salas online com jogadores pelo celular.

Dois modos ([guia](docs/guia/1-visao-geral.md)): **local**, sem conta, com tudo no navegador, e **nuvem**, com conta, campanha no servidor e jogadores entrando por código ou QR.

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
docs/guia/         Guia para humanos, com diagramas UML
docs/              Specs, plano e decisões (para agentes de IA)
```

Para entender o sistema, comece pelo [guia](docs/guia/README.md). Plano atual: [modernização](docs/plans/modernizacao-arquitetural.md). Instruções para agentes de IA: [`AGENTS.md`](AGENTS.md).

## Como trabalhamos (Git)

GitHub Flow com duas linhas ([decisão 0008](docs/decisoes.md)). Ninguém commita direto em `master` nem em `next`: tudo entra por PR.

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
