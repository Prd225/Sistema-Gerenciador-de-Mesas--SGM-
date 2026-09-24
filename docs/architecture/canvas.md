# Canvas (Battlemap)

Implementado com React-Konva. Ponto de entrada: `src/canvas/StageMap.tsx`.

## Coordenadas

O stage tem zoom (0.1x a 8x, fator 1.1 por passo da roda) e pan. Toda conversão da posição do ponteiro na tela para coordenadas de mundo usa a matriz inversa:

```ts
const transform = stage.getAbsoluteTransform().copy().invert();
const worldPos = transform.point(stage.getPointerPosition());
```

- O zoom pela roda é centrado no cursor: a posição do stage é ajustada para o ponto sob o cursor ficar fixo.
- Pinch-to-zoom em touch usa o mesmo limite de escala.
- Posições de tokens, zonas e marcadores nos stores e na rede são sempre coordenadas de mundo.

## Camadas

```
Stage
 ├── Layer 1: GridLayer, BackgroundLayer
 ├── Layer 2: ZoneLayer, TokenLayer, MarkerLayer, retângulo de seleção
 └── Layer 3: DrawingLayer (prévia da forma em desenho)
```

| Camada            | Responsabilidade                                     | Observações de performance                                                                                |
| :---------------- | :--------------------------------------------------- | :-------------------------------------------------------------------------------------------------------- |
| `GridLayer`       | Grid tático com células de 40px (`GRID_SIZE`)        | Uma célula desenhada offscreen aplicada como `fillPatternImage` num retângulo grande. `listening={false}` |
| `BackgroundLayer` | Imagens de cenário                                   | Arrastáveis e redimensionáveis só com a ferramenta `edit-bg`                                              |
| `ZoneLayer`       | Zonas (retângulo, elipse, polígono) com rótulo       | Fonte do rótulo escala com o zoom (`scale`)                                                               |
| `TokenLayer`      | Tokens com imagem ou iniciais, status e nome         | Arrasto individual ou em lote. Tokens de ameaça não são arrastáveis para jogadores                        |
| `MarkerLayer`     | Marcadores (pin, espada, baú, caveira, joia) e pings | Pings somem após 3.5s                                                                                     |
| `DrawingLayer`    | Forma sendo desenhada                                | Camada separada para o mousemove não re-renderizar tokens e zonas. `listening={false}`                    |

Regra: interações de alta frequência (desenho, arrasto) não devem provocar re-render das camadas que não mudaram. Prefira atualizar só a camada afetada.

## Ferramentas (`activeTool` em `useZoneStore`)

| Atalho        | Ferramenta                               | Comportamento                                 |
| :------------ | :--------------------------------------- | :-------------------------------------------- |
| `1` ou Espaço | `pan`                                    | Arrasta o stage                               |
| `2` ou `V`    | `select`                                 | Seleção por clique, Shift+clique ou retângulo |
| `3`           | `edit-zone`                              | Edita zonas existentes                        |
| `4`, `5`, `6` | `draw-rect`, `draw-ellipse`, `draw-poly` | Cria zonas                                    |
| `7`           | `add-marker`                             | Cria marcadores                               |
| `8`           | `edit-bg`                                | Edita imagens de fundo                        |

Os atalhos ficam desativados com foco em campos de texto ou com o painel do mestre aberto (`StageMap.tsx`, handler de teclado).

## Pings

`Alt + clique` ou botão do meio: `StageMap` converte para coordenadas de mundo, `useMultiplayerStore.sendPing(x, y)` emite `map:ping`, o servidor adiciona nome e cor do membro e transmite `map:pinged` para todos, e `MarkerLayer` desenha o pulso.
