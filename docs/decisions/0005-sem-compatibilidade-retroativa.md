# 0005. Sem compatibilidade retroativa durante o desenvolvimento

- Status: Aceita
- Data: 2026-09-24

## Contexto

O SGM ainda não tem usuários com dados que precisem ser preservados. Manter compatibilidade com saves, schemas e contratos antigos adiciona código de migração e casos especiais justamente durante a reestruturação.

## Decisão

Até o primeiro lançamento público:

- Formatos de save (Dexie e JSON de campanha), schema do Postgres e contratos de socket podem mudar livremente.
- Não escrever migrações de dados, shims nem código que aceite formatos antigos.
- Ao mudar o schema do Dexie, incrementar a versão e descartar os dados antigos. No Postgres, as migrações numeradas podem recriar tabelas.

## Consequências

- Refatorações mais rápidas e código mais limpo.
- Quem estiver testando perde campanhas salvas quando o formato mudar.
- **Antes do lançamento público**, esta decisão deve ser substituída por uma que defina versionamento de saves (`schema_version`) e migrações.
