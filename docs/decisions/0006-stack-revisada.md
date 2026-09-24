# 0006. Stack revisada

- Status: Aceita
- Data: 2026-09-24
- Substitui: [0004](0004-stack-definida.md)

## Contexto

A stack da decisão 0004 funcionava, mas mantinha partes críticas escritas à mão (auth, SQL, servidor HTTP sem validação integrada) e não tinha estrutura de monorepo, rotas nem infraestrutura de entrega. O objetivo agora é uma base robusta e padronizada, com bibliotecas consolidadas em tudo, **exceto na camada de tempo real**, que continua escrita pela equipe sobre Socket.io para manter liberdade de desenho.

## Decisão

Lista fechada. Biblioteca fora dela exige nova decisão antes de ser instalada.

### Monorepo e ferramentas

| Uso                      | Escolha                                                                                                        |
| :----------------------- | :------------------------------------------------------------------------------------------------------------- |
| Runtime                  | Node.js 24 LTS (`.nvmrc` e `engines`)                                                                          |
| Gerenciador e monorepo   | npm workspaces (`apps/*`, `packages/*`)                                                                        |
| Linguagem                | TypeScript estrito, `tsconfig.base.json` compartilhado                                                         |
| Lint e formatação        | `oxlint`, `prettier`                                                                                           |
| Fronteiras entre módulos | `dependency-cruiser`                                                                                           |
| Testes                   | `vitest` (unidade e integração), `@testing-library/react`, `fake-indexeddb`, `@playwright/test` (E2E e visual) |
| Catálogo de componentes  | Storybook (builder Vite)                                                                                       |
| Containers               | Docker (multi-stage), Docker Compose                                                                           |
| CI/CD                    | GitHub Actions, GHCR, `release-please`, Dependabot. Detalhes em [`../specs/ci-cd.md`](../specs/ci-cd.md)       |

### Contratos e regras (`packages/`)

| Uso                       | Escolha    |
| :------------------------ | :--------- |
| Schemas                   | `zod` (v4) |
| Estado imutável no engine | `immer`    |

### Servidor (`apps/server`)

| Uso             | Escolha                                                                                                                 | No lugar de                     |
| :-------------- | :---------------------------------------------------------------------------------------------------------------------- | :------------------------------ |
| HTTP            | `fastify` + `fastify-type-provider-zod`                                                                                 | Express                         |
| Plugins HTTP    | `@fastify/cors`, `@fastify/helmet`, `@fastify/rate-limit`, `@fastify/multipart`, `@fastify/static`, `@fastify/sensible` | `cors`, `multer`                |
| Autenticação    | `better-auth` (e-mail e senha, Google OAuth, sessão em cookie)                                                          | Auth feito à mão com `bcryptjs` |
| Banco           | PostgreSQL 17 + `drizzle-orm` + `drizzle-kit` (migrações)                                                               | `pg` com SQL à mão              |
| Tempo real      | `socket.io`, **camada escrita pela equipe** (sem Colyseus ou similar)                                                   | —                               |
| Imagens         | `sharp`                                                                                                                 | —                               |
| Logs e métricas | `pino` (logger nativo do Fastify), `prom-client`                                                                        | —                               |

### Cliente (`apps/web`)

| Uso                | Escolha                                                                                 |
| :----------------- | :-------------------------------------------------------------------------------------- |
| UI                 | React 19, Vite                                                                          |
| Rotas              | `@tanstack/react-router` (rotas tipadas por arquivo)                                    |
| Dados HTTP         | `@tanstack/react-query`                                                                 |
| Estado local       | `zustand`                                                                               |
| Persistência local | `dexie`                                                                                 |
| Tempo real         | `socket.io-client`                                                                      |
| Canvas             | `konva`, `react-konva`, `use-image`                                                     |
| Estilo             | Tailwind CSS v4, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css` |
| Componentes        | shadcn/ui sobre `@base-ui/react`, `lucide-react`, `sonner`, `vaul`                      |
| Formulários        | `react-hook-form`, `@hookform/resolvers`                                                |
| Listas             | `@dnd-kit/*`, `@tanstack/react-virtual`                                                 |
| Robustez           | `react-error-boundary`, `dompurify`                                                     |
| Mídia externa      | `react-youtube`, SDK do Spotify                                                         |
| Fonte              | `@fontsource-variable/geist`                                                            |

### Remover

`express`, `cors`, `pg` (direto), `bcryptjs` e os respectivos `@types/*`.

## Consequências

- Auth, acesso a banco e validação HTTP passam a ser feitos por bibliotecas maduras, o que reduz a superfície onde o código gerado por agentes costuma errar.
- Tipos de ponta a ponta: schema Zod em `@sgm/shared` → rota Fastify → cliente TanStack Query.
- A camada de tempo real continua sob controle total da equipe e é a parte que exige mais cuidado e testes.
- Troca de Express, `pg` e auth é uma reescrita do servidor HTTP. Como não há compatibilidade retroativa ([0005](0005-sem-compatibilidade-retroativa.md)), os dados de usuários existentes podem ser descartados.
- Versões: biblioteca nova entra na última versão estável, e quem instala lê a documentação daquela versão antes de usar.
