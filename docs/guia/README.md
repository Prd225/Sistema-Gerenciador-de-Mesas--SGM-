# Guia do SGM

Explicação do sistema para pessoas, com diagramas UML. Os agentes de IA não leem esta pasta e ela não conta no limite de tokens dos docs de IA.

Os diagramas são em Mermaid. No GitHub eles aparecem desenhados. No VS Code, instale a extensão **Markdown Preview Mermaid Support** e abra a pré-visualização com `Ctrl+Shift+V`.

| Documento | O que explica |
| :-- | :-- |
| [1. Visão geral](1-visao-geral.md) | O produto, os modos local e nuvem, quem usa e onde cada parte roda |
| [2. Modelo de dados](2-modelo-de-dados.md) | Campanha, cena, token e sala, o que é segredo e as tabelas do banco |
| [3. Arquitetura do código](3-arquitetura.md) | Pacotes, camadas e a peça central (engine + `RoomConnection`) |

Git e fluxo de trabalho: [README da raiz](../../README.md#como-trabalhamos-git).

O guia descreve o **alvo** (v8). Quando algo ainda não existe no código, o texto avisa.

## Glossário

**RPG**

| Termo | Significado |
| :-- | :-- |
| Mestre (GM) | Prepara a história, narra e controla o mundo e os inimigos. Esconde segredos até a hora certa |
| Jogador | Controla um personagem |
| Sistema | O livro de regras. O SGM segue o Ordem Paranormal (atributos AGI, FOR, INT, PRE, VIG; PV, PE, SAN, PD) |
| Ficha | Os números do personagem ou da ameaça. No SGM fica em `token.stats` |
| Token | Peça no mapa que representa um personagem ou ameaça |
| Ameaça | Inimigo ou criatura controlada pelo mestre. A ficha dela é segredo |
| Iniciativa | Ordem dos turnos no combate. Uma rodada acaba quando todos agiram |
| Cena | Um mapa com o que está nele (tokens, zonas, marcadores, fundos). A campanha tem várias |
| Zona | Área desenhada no mapa (sala, corredor) com descrição, itens, NPCs e segredos |
| Marcador | Alfinete no mapa (baú, caveira, espada) |
| Sessão | Um encontro de jogo, de 3 a 4 horas |
| Campanha | A história inteira, jogada em várias sessões |

**Técnico**

| Termo | Significado |
| :-- | :-- |
| Engine | `@sgm/engine`: as regras do jogo em funções puras, iguais no navegador e no servidor |
| Comando | Pedido de mudança (`token.move`). Pode ser aceito ou rejeitado |
| Evento | Fato que aconteceu (`token.moved`). Só existe se o comando foi aceito |
| Snapshot | O estado inteiro da sala num momento, com número de versão |
| Projeção | O estado filtrado para quem vai receber. O jogador recebe sem os segredos |
| `RoomConnection` | Interface por onde a tela manda comandos. Tem a versão local e a remota |
| Dexie | Biblioteca do banco do navegador (IndexedDB). Guarda as campanhas locais |
| Otimismo | Mostrar o resultado antes da confirmação do servidor e desfazer se ele recusar |
