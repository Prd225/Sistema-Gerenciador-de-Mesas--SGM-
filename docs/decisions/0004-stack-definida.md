# 0004. Stack definida (bibliotecas aprovadas)

- Status: Substituída por [0006](0006-stack-revisada.md)
- Data: 2026-09-24

## Contexto

Agentes de IA diferentes trabalham no repositório. Sem uma lista fechada, cada um resolve o mesmo problema com uma biblioteca diferente, e a interface e o servidor perdem consistência. O objetivo é padronização, responsividade e estabilidade. Bibliotecas grandes são aceitáveis.

## Decisão

Esta é a lista completa. Qualquer biblioteca fora dela exige uma nova decisão aqui antes de ser instalada.

### Cliente

| Uso                         | Biblioteca                                                                                             |
| :-------------------------- | :----------------------------------------------------------------------------------------------------- |
| UI                          | React 19, TypeScript, Vite                                                                             |
| Estilo                      | Tailwind CSS v4 (migrar da v3), `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css` |
| Componentes                 | shadcn/ui sobre `@base-ui/react`, `lucide-react`, `sonner`, `vaul`                                     |
| Formulários                 | `react-hook-form`, `@hookform/resolvers`, `zod`                                                        |
| Estado                      | `zustand` (com `useShallow` para seletores de objeto)                                                  |
| Persistência local          | `dexie`, `dexie-react-hooks`                                                                           |
| Tempo real                  | `socket.io-client`                                                                                     |
| Canvas                      | `konva`, `react-konva`, `use-image`                                                                    |
| Arrastar e soltar em listas | `@dnd-kit/*`                                                                                           |
| Listas longas               | `@tanstack/react-virtual`                                                                              |
| Erros                       | `react-error-boundary`                                                                                 |
| HTML de usuário             | `dompurify`                                                                                            |
| Mídia externa               | `react-youtube`, SDK do Spotify (já integrados)                                                        |
| Fonte                       | `@fontsource-variable/geist`                                                                           |

### Servidor

| Uso             | Biblioteca                                                                                                            |
| :-------------- | :-------------------------------------------------------------------------------------------------------------------- |
| Runtime         | Node.js 22 LTS, TypeScript, `tsx` em desenvolvimento                                                                  |
| HTTP            | `express` (subir para v5, alinhando com `@types/express` v5), `cors`, `helmet`, `cookie-parser`, `express-rate-limit` |
| Tempo real      | `socket.io`                                                                                                           |
| Validação       | `zod` (schemas em `shared/`)                                                                                          |
| Banco           | `pg` com SQL escrito à mão e migrações numeradas em `server/migrations/` (sem ORM)                                    |
| Senhas          | `bcrypt` nativo. Compatível com os hashes gerados pelo `bcryptjs`, sem migração                                       |
| Upload e imagem | `multer`, `sharp`                                                                                                     |
| Logs e métricas | `pino`, `pino-http`, `prom-client`                                                                                    |

### Ferramentas

| Uso                              | Ferramenta                                           |
| :------------------------------- | :--------------------------------------------------- |
| Lint e formatação                | `oxlint`, `prettier`                                 |
| Testes unitários e de integração | `vitest`, `@testing-library/react`, `fake-indexeddb` |
| Ponta a ponta e regressão visual | `@playwright/test`                                   |
| Catálogo de componentes          | Storybook (builder Vite)                             |
| Ambiente local e deploy          | Docker Compose (Node, Postgres, Caddy)               |

### Remover

- `better-sqlite3` e `@types/better-sqlite3` (não usados).
- `bcryptjs` e `@types/bcryptjs` (substituídos por `bcrypt`).
- `shadcn` sai de `dependencies` e vai para `devDependencies`.

## Consequências

- Um problema, uma biblioteca. Agentes não precisam escolher.
- Sem ORM: o SQL fica explícito e fácil de entender, ao custo de escrever as queries e migrações à mão.
- Tailwind v4 e Express v5 são migrações com quebra de compatibilidade e devem ser feitas em PRs próprios, não junto com funcionalidades.
- Versões: manter as já instaladas. Biblioteca nova entra na última versão estável, e quem instala lê a documentação daquela versão antes de usar.
