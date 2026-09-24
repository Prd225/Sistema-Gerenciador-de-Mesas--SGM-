# 0001. Manter a stack Node/React, sem core em Go

- Status: Aceita
- Data: 2026-09-24

## Contexto

Uma proposta anterior sugeria reescrever o servidor de salas em Go, separar em microsserviços e adicionar Redis, MinIO e gateway Nginx. Os argumentos eram pausas de GC com mensagens grandes e o event loop bloqueado pelo hash de senha.

## Decisão

Manter React, Vite, Konva, Zustand, Dexie, Socket.io, Express e Postgres num único processo Node.

## Consequências

- Os gargalos citados têm soluções baratas em Node: upload de imagens por HTTP em vez de Base64 no socket, e `bcrypt` nativo em vez de `bcryptjs`.
- A escala real (dezenas de conexões por sala) está muito abaixo do limite de um processo Node.
- Uma linguagem só no stack, com tipos compartilhados entre cliente e servidor.
- Reavaliar apenas se houver gargalo medido em produção.
