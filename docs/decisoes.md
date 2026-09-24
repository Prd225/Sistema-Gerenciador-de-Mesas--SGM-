# Decisões

Decisão aceita não é editada: se mudar, adicione uma nova que substitui a antiga. Os textos longos das decisões 0001 a 0008 estão no histórico do git.

| Nº | Decisão | Motivo |
| :-- | :-- | :-- |
| 0001 | Node/React/TypeScript em tudo, sem core em Go, Redis, MinIO ou microsserviços | Uma linguagem, um processo Node aguenta 20 jogadores por sala num VPS pequeno |
| 0002 | Backend próprio, sem BaaS (Supabase, Firebase) | Controle e aprendizado da equipe |
| 0003 | Servidor é a autoridade da sala: valida, aplica e projeta cada comando. Sem CRDT | Hoje qualquer jogador sobrescreve o mapa e vê segredos |
| 0005 | Sem compatibilidade retroativa até o lançamento público: saves, schemas e protocolo mudam sem migração. Dexie: incrementar a versão e descartar dados | Refatorar rápido. Antes do lançamento, criar decisão com `schema_version` e migrações |
| 0006 | Stack fechada (abaixo). Biblioteca fora dela exige decisão nova | Padronização e menos erro de agente |
| 0007 | Monorepo com `@sgm/engine` puro, usado pelo servidor (autoridade), pelo cliente (previsão) e pelo modo local. A UI fala com `RoomConnection` local ou remota | Uma regra em um lugar; local e nuvem no mesmo código |
| 0008 | GitHub Flow com duas linhas: `master` = v7 do Pedro, `next` = v8. Branch curta, PR, CI verde, squash. Correção da `master` vai para a `next` por cherry-pick. Tag `v7.0-pedro-stable` = 2026-09-20 | O Pedro usa a v7 enquanto a v8 é reescrita. Não rode as duas no mesmo perfil de navegador (mesmo IndexedDB) |
| 0009 | Dois modos: **local** (sem conta, campanha no Dexie, grátis) e **nuvem** (conta, campanha no Postgres, salas com jogadores). Uma campanha tem um dono por vez: "Salvar na nuvem" move, "Baixar cópia" exporta JSON. Sem sincronização nos dois sentidos | O Pedro usa o local; o produto é a nuvem. Sync bidirecional é a maior fonte de conflito |
| 0010 | Simplificações: sem Storybook, CodeQL, release-please, staging, log de eventos (`room_events`) e métricas por enquanto. Um ambiente de produção, deploy da imagem por SHA | Duas pessoas; entra quando houver necessidade real |

## Stack (0006, ajustada pela 0010)

| Área | Bibliotecas |
| :-- | :-- |
| Base | Node 24, npm workspaces, TypeScript estrito, oxlint, prettier, dependency-cruiser |
| Testes | vitest, @testing-library/react, fake-indexeddb, @playwright/test |
| Entrega | Docker multi-stage, Docker Compose, Caddy, GitHub Actions, GHCR, Dependabot |
| Contratos e engine | zod v4, immer |
| Servidor | fastify, fastify-type-provider-zod, @fastify/cors, helmet, rate-limit, multipart, static, sensible; better-auth; Postgres 17, drizzle-orm, drizzle-kit; socket.io (camada escrita à mão, sem Colyseus); sharp; pino |
| Cliente | React 19, Vite, @tanstack/react-router, @tanstack/react-query, zustand, dexie, socket.io-client, konva, react-konva, use-image |
| UI | Tailwind v4, class-variance-authority, clsx, tailwind-merge, tw-animate-css, shadcn sobre @base-ui/react, lucide-react, sonner, vaul, react-hook-form, @hookform/resolvers, @dnd-kit, @tanstack/react-virtual, react-error-boundary, dompurify, react-youtube, SDK do Spotify, Geist |
| Remover | express, cors, pg direto, bcryptjs e seus @types |

Biblioteca nova entra na última versão estável; leia a documentação daquela versão antes de usar.
