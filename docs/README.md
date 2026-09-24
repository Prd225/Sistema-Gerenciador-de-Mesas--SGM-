# Documentação do SGM

Regras para agentes de IA e o mapa do repositório estão em [`/AGENTS.md`](../AGENTS.md).

| Pasta                            | Conteúdo                          | Quando muda                                         |
| :------------------------------- | :-------------------------------- | :-------------------------------------------------- |
| [`architecture/`](architecture/) | Como o sistema funciona **hoje**  | No mesmo commit que altera o comportamento descrito |
| [`specs/`](specs/)               | Como o sistema **deve** funcionar | Quando o alvo muda (junto com uma decisão)          |
| [`plans/`](plans/)               | O que ainda vai ser feito         | Ao concluir ou replanejar itens                     |
| [`decisions/`](decisions/)       | Por que escolhemos X em vez de Y  | Ao tomar uma decisão de arquitetura nova            |

## Arquitetura

- [Visão geral](architecture/overview.md): processos, pastas e fluxo de dados
- [Canvas](architecture/canvas.md): battlemap Konva, camadas e coordenadas
- [Estado e persistência](architecture/state-and-persistence.md): stores Zustand, autosave e IndexedDB
- [Multiplayer e servidor](architecture/multiplayer-and-server.md): Socket.io, salas e autenticação
- [Front-end: regras e verificação](architecture/frontend-guidelines.md): regras tiradas de bugs reais, z-index e roteiro de fumaça
- [Design system](architecture/design-system.md): tokens de cor e componentes de UI

## Especificações (sistema alvo)

- [Arquitetura de código](specs/code-architecture.md): monorepo, pacotes, camadas, estrutura de pastas e fronteiras
- [System design](specs/system-design.md): requisitos, protocolo, modelo de dados, projeção por papel, segurança, falhas e deploy
- [CI/CD e infraestrutura](specs/ci-cd.md): Docker, pipelines, ambientes, release e deploy
- [Design system](specs/ui-design-system.md): bibliotecas, tokens, componentes, responsividade e estabilidade da interface

## Planos

- [Modernização arquitetural](plans/modernizacao-arquitetural.md): ordem das fases, do monorepo ao design system
- [Roadmap de funcionalidades](plans/roadmap-features.md): galeria de cards, starter pack, OCR de mapas e ideias futuras

## Decisões

- [Índice e modelo](decisions/README.md)
