# Registros de Decisão

Cada decisão de arquitetura relevante vira um arquivo curto e numerado. Decisões não são editadas depois de aceitas: se mudarem, crie uma nova que substitui a anterior e marque a antiga como "Substituída por NNNN".

| Nº                                               | Decisão                                                                  | Status               |
| :----------------------------------------------- | :----------------------------------------------------------------------- | :------------------- |
| [0001](0001-manter-stack-node.md)                | Manter a stack Node/React, sem core em Go                                | Aceita               |
| [0002](0002-backend-proprio-sem-baas.md)         | Backend construído pela equipe, sem BaaS                                 | Aceita               |
| [0003](0003-servidor-autoritativo.md)            | Servidor como autoridade das salas multiplayer                           | Aceita               |
| [0004](0004-stack-definida.md)                   | Stack definida: lista fechada de bibliotecas                             | Substituída por 0006 |
| [0005](0005-sem-compatibilidade-retroativa.md)   | Sem compatibilidade retroativa durante o desenvolvimento                 | Aceita               |
| [0006](0006-stack-revisada.md)                   | Stack revisada: Fastify, Drizzle, Better Auth, TanStack, monorepo, CI/CD | Aceita               |
| [0007](0007-arquitetura-engine-compartilhada.md) | Monorepo com engine compartilhada entre cliente e servidor               | Aceita               |

## Modelo

```markdown
# NNNN. Título curto

- Status: Proposta | Aceita | Substituída por NNNN
- Data: AAAA-MM-DD

## Contexto

O problema e as restrições.

## Decisão

O que foi escolhido.

## Consequências

O que fica mais fácil, o que fica mais difícil e o que foi descartado.
```
