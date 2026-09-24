# 2. Modelo de dados

## Campanha, mesa e painel

A campanha é dividida em duas partes, porque elas têm regras diferentes:

- **Mesa** (`table`): cenas, tokens, zonas, marcadores, fundos, iniciativa. É o que os jogadores veem numa sala. Toda mudança passa pelo engine como comando.
- **Painel** (`panel`): diário, notas, regras, tabelas, roletas e trilha sonora do mestre. Nunca vai para os jogadores. É salvo direto (Dexie no modo local, `PATCH` HTTP no modo nuvem), sem engine.

Essa divisão deixa o engine pequeno: ele só conhece a mesa.

```mermaid
classDiagram
    direction LR
    class Campaign {
        id
        name
        updatedAt
    }
    class TableState {
        version
        activeSceneId
        round
        turn
    }
    class Scene {
        id
        name
    }
    class Token {
        id
        name
        x, y: null = fora do mapa
        imageRef
        ownerMemberId: null = só mestre
        visibility: all | gm
    }
    class Stats {
        type: player | threat
        AGI FOR INT PRE VIG
        PV PE SAN PD: atual e máximo
        ataques, habilidades, resistências
    }
    class Condition {
        name
        type
        durationTurns
    }
    class Zone {
        id
        type: rect | ellipse | polygon
        x, y, w, h, points
    }
    class ZoneData {
        title, desc
        pontos de interesse
        ameaças, itens, NPCs, diário, missões
    }
    class Marker {
        id
        x, y
        iconType
        hidden
    }
    class Background {
        id
        imageRef
        x, y, scale, rotation
    }
    class Initiative {
        order: lista de tokenId
        values
    }
    class PanelData {
        diary
        notes
        rules
        tables
        roulettes
        soundpad
    }

    Campaign *-- "1" TableState : table
    Campaign *-- "1" PanelData : panel
    TableState *-- "1..*" Scene
    Scene *-- "*" Token
    Scene *-- "*" Zone
    Scene *-- "*" Marker
    Scene *-- "*" Background
    Scene *-- "1" Initiative
    Token *-- "1" Stats
    Token *-- "*" Condition
    Zone *-- "1" ZoneData
```

Coleções ficam como `Record<id, item>` (não arrays): achar, atualizar e remover por id fica simples e sem ambiguidade.

Hoje o código ainda está no formato antigo: `tokens` e `bgImages` em arrays, iniciativa como fila, `round`/`turn` no `useCampaignStore` e o painel espalhado em seis stores. A troca acontece nos blocos 2 e 3 do plano.

## Sala e membros (só modo nuvem)

Uma **sala é uma campanha aberta ao vivo**. Ela não tem estado próprio: o estado é a `table` da campanha, que o servidor mantém em memória enquanto a sala está aberta e grava no banco a cada 2 segundos.

```mermaid
classDiagram
    direction LR
    class Room {
        code: 6 caracteres
        status: open | closed
    }
    class Member {
        id: UUID estável
        displayName
        role: gm | player | spectator
        color
        online
    }
    class User {
        id
        email
    }
    Room --> "1" Campaign : abre
    Room *-- "*" Member
    Member --> "0..1" User : conta, convidado não tem
    Campaign --> "1" User : dono
```

- O papel `gm` é só do dono da campanha. Nunca por ordem de chegada.
- Convidado não tem conta: recebe um `memberToken` guardado no navegador. Ao voltar, o token devolve a mesma identidade.
- O `socket.id` nunca é identidade, porque muda a cada reconexão.

## O que é segredo

Antes de enviar qualquer coisa para um jogador ou para a TV, o servidor aplica `projectFor(table, member)`:

| Removido para jogador e TV | Campo |
| :-- | :-- |
| Outras cenas | Só a cena ativa é enviada |
| Tokens escondidos | `visibility: 'gm'` |
| Ficha de ameaça | `stats` de `type: 'threat'` (ficam nome, imagem, posição e condições) |
| Marcadores escondidos | `hidden: true` |
| Itens de zona não revelados | `isRevealed: false` e `isFound: false` |
| Painel inteiro | Nunca entra na sala |

## Banco do servidor (Postgres)

```mermaid
erDiagram
    user ||--o{ campaigns : "é dono"
    user ||--o{ media : "enviou"
    campaigns ||--o{ rooms : "aberta como"
    rooms ||--o{ room_members : "tem"
    user |o--o{ room_members : "é (opcional)"

    user {
        text id PK
        text email
        text name
    }
    campaigns {
        uuid id PK
        text owner_id FK
        text name
        jsonb table_state
        jsonb panel
        int version
        timestamptz updated_at
    }
    rooms {
        uuid id PK
        text code UK
        uuid campaign_id FK
        text status
        timestamptz created_at
        timestamptz closed_at
    }
    room_members {
        uuid id PK
        uuid room_id FK
        text user_id FK "null para convidado"
        text token_hash "só convidado"
        text display_name
        text role
        text color
        timestamptz last_seen_at
    }
    media {
        text hash PK "sha256"
        text owner_id FK
        text mime
        int bytes
        int width
        int height
    }
```

As tabelas `user`, `session`, `account` e `verification` são criadas pelo Better Auth. O projeto não cria tabela própria de usuário.

Campanha e cenas ficam em `jsonb`, não em tabelas normalizadas: o jogo sempre carrega e grava a campanha inteira, e o schema Zod em `@sgm/shared` garante o formato.

## Banco do navegador (Dexie)

| Tabela | Chave | Conteúdo |
| :-- | :-- | :-- |
| `campaigns` | `id` | Campanhas locais (`table` e `panel`) |
| `media` | `hash` | Imagens das campanhas locais, como Blob |

Imagens são referenciadas por hash: `local:<hash>` no modo local e `/media/<hash>.webp` no servidor. Ao salvar na nuvem, as imagens locais sobem e as referências são trocadas.

Hoje o Dexie tem outro formato (`campaignSlots` com 50 slots fixos, `activeScenes` e `sessionState`), e as imagens ficam em Base64 dentro do estado. Isso some no bloco 2.
