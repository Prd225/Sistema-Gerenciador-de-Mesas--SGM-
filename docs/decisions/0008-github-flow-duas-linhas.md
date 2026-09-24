# 0008. GitHub Flow com duas linhas (master e next)

- Status: Aceita
- Data: 2026-09-24

## Contexto
Duas pessoas com visões diferentes: o Pedro continua usando e evoluindo a v7 do jeito dele; o Ronald conduz a modernização (v8), que reestrutura o projeto inteiro.

## Decisão
- `master`: v7 do Pedro, sempre funcionando. Versões boas ganham tag (`v7.1.0`). A tag `v7.0-pedro-stable` guarda a versão de 2026-09-20, anterior à modernização.
- `next`: v8 (antiga `feat/multiplayer-server`). Agentes trabalham aqui.
- Toda tarefa: branch curta a partir da linha (`feat/`, `fix/`, `refactor/`, `chore/`, `docs/`), PR para a mesma linha, CI verde, squash merge, branch apagada.
- Correções da `master` que ainda valem vão para a `next` por `git cherry-pick`. A `next` só entra na `master` quando os dois combinarem a v8. Depois disso, só a `master` (GitHub Flow puro).
- Sem aprovação obrigatória nos PRs (o GitHub não deixa aprovar o próprio PR).

## Consequências
- Cada um trabalha sem quebrar a versão do outro.
- Quanto mais tempo as linhas ficarem separadas, mais caro portar funcionalidades da `master` para a `next`. Vale combinar a data da v8.
- `master` e `next` usam o mesmo banco local no navegador (IndexedDB por origem): não rode as duas no mesmo perfil de navegador, porque a `next` pode alterar ou descartar os dados (decisão 0005).
