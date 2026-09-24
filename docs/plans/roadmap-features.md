# Roadmap de Funcionalidades

Features de produto para depois da modernização. **Nenhuma foi iniciada**: tipos e presets citados em versões antigas deste documento não existem no código. Ao implementar, siga a estrutura de `docs/specs/code-architecture.md` (cada uma vira uma pasta em `apps/web/src/features/`).

## 1. Galeria de cards (`features/card-gallery`)

Compêndio visual dos tokens (jogadores e ameaças) em cards, com busca e filtros, para puxar para o mapa.

- Grade de cards (e modo lista) com retrato, tipo, elemento, vitais (PV, PE, SAN) e atributos. Atalho `C`.
- Busca por nome e texto. Filtros por tipo, elemento, presença no mapa, NEX/VD e favoritos.
- Arrastar card para o mapa (drop converte tela para mundo com a matriz inversa do stage) ou botão "enviar ao centro". Recolher para a reserva (`x: null`).
- Ações rápidas: abrir ficha, ajustar PV/PE/SAN, duplicar ameaça (sufixo `#2`, `#3`), favoritar.
- Lista virtualizada (`@tanstack/react-virtual`). Busca em menos de 16 ms com 150 tokens.

## 2. Starter pack (`features/starter-pack`)

Campanha de demonstração pronta em um clique, para testar ou começar em menos de 10 segundos.

- Conteúdo: 4 heróis (guerreiro, ladino, mago, clérigo), 3 ameaças (goblin, zumbi, dragão) e o mapa "Cripta dos Ecos Ancestrais" com 3 salas, marcadores e posições iniciais.
- Dados como JSON validado pelos schemas de `@sgm/shared`.
- Carregar como campanha nova, substituir a atual ou só adicionar fichas e mapa à campanha aberta.
- Oferecido automaticamente quando o banco local está vazio.

## 3. OCR de mapas (`features/map-ocr`)

Ler números de sala impressos em mapas e criar zonas e marcadores automaticamente.

- Roda num Web Worker com `tesseract.js` (exige nova decisão de stack) para não travar o canvas.
- Pré-processamento: escala de cinza, contraste, binarização (Otsu), ampliação dos dígitos.
- Tesseract em modo de texto esparso, com lista de caracteres permitidos e confiança mínima de 50%.
- Para cada rótulo: um marcador no centro e uma zona ao redor (encaixe no grid, depois detecção de parede).
- Assistente de revisão: o mestre desmarca falsos positivos antes de gerar.
- Metas: imagem Full HD em menos de 4 s e 80% de acerto em números impressos.

## 4. Ideias futuras (fora do plano)

### 4.1 Importação de fichas por foto (OCR + LLM)

O jogador fotografa a ficha de papel e o SGM monta ficha, token e iniciativa.

- Serviço próprio `apps/ocr-worker` (provavelmente Python, container separado). Regras em `docs/specs/code-architecture.md`, seção 7.
- Extrai para o schema Zod da ficha de cada sistema, nunca texto livre.
- Revisão humana obrigatória, com campos incertos destacados.
- Comparar Tesseract + LLM contra um modelo de visão que devolve JSON direto. Testar com fichas manuscritas.
- Modelo local (sem custo, privado, exige GPU) contra API (mais precisa, custo por ficha).
- Depois: gerar encontros e cenas a partir das fichas.
