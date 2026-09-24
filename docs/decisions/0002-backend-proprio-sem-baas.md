# 0002. Backend construído pela equipe, sem BaaS

- Status: Aceita
- Data: 2026-09-24

## Contexto

Supabase ou Firebase entregariam auth, storage e banco prontos e reduziriam o código de backend.

## Decisão

Construir auth, sincronização em tempo real, uploads e persistência com Express, Socket.io e Postgres.

## Consequências

- A equipe entende e controla cada parte do sistema, o que também é um objetivo de aprendizado.
- Sem dependência de fornecedor nem custo por uso.
- Mais código para manter e testar, principalmente em auth. Isso é mitigado mantendo o desenho simples (ver 0003) e cobrindo com testes.
- Uploads ficam em disco local até haver necessidade medida de outra solução.
