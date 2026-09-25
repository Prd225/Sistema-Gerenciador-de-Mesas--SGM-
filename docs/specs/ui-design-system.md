# Design System

Alvo da interface. Hoje: `docs/architecture/design-system.md`. Prioridades: padronização, responsividade, estabilidade.

## 1. Bibliotecas

Tailwind v4 (tokens em `@theme`), shadcn/ui sobre `@base-ui/react` (única fonte de primitivos), `lucide-react`, `sonner` (toasts), `vaul` (drawer), `react-hook-form` + Zod, `@tanstack/react-virtual` (listas com mais de 100 itens), `react-error-boundary`, `dompurify` (obrigatório antes de `dangerouslySetInnerHTML`), Playwright, fonte Geist (`tabular-nums` em números). Nenhuma outra biblioteca de componentes (MUI, Mantine, Chakra).

## 2. Tokens

Proibido em código novo ou migrado: hexadecimal solto, `text-[Npx]`, `z-[N]`. Tokens em CSS (`@theme`) e em `ui/tokens.ts` (para o Konva). As variáveis do shadcn (`--background`, `--primary`...) apontam para eles.

| Token | Valor | Uso |
| :--- | :--- | :--- |
| `canvas` | `#0d0d0f` | Fundo do mapa |
| `bg` | `#121214` | Fundo do app |
| `surface` | `#202024` | Cards, painéis, menus |
| `surface-sunken` | `#1a1a1e` | Campos, áreas internas (também substitui `#18181b`) |
| `border` / `control` | `#323238` | Bordas; fundo de botões secundários |
| `text` | `#e1e1e6` | Texto principal |
| `text-muted` | `#a8a8b3` | Secundário |
| `text-subtle` | `#7c7c8a` | Só placeholder e legenda (contraste baixo; substitui `#7a7a80`) |
| `primary` / `primary-hover` | `#8257e5` / `#9466ff` | Ação principal, seleção, foco |
| `accent` | `#ffd700` | Destaque (turno atual) |
| `success` / `warning` | `#04d361` / `#facc15` | Confirmação / alerta |
| `danger` / `danger-hover` | `#ef4444` / `#dc2626` | Destrutivo, dano, erro |
| `element-sangue/morte/conhecimento/energia/medo` | `#ef4444` / `#9ca3af` / `#eab308` / `#a855f7` / `#ffffff` | Via componente `ElementBadge` (texto na cor, borda 30%, fundo 10%) |

- **Tipografia**: `text-xs` 12 (mínimo do app), `sm` 14 (padrão), `base` 16 (leitura e inputs no celular), `lg` 18, `xl` 20, `2xl` 24. Pesos 400/500/600.
- **Espaço** múltiplo de 4 px. **Raio**: sm 4 (badge), md 6 (botão, campo), lg 8 (card, menu), xl 12 (modal). **Sombra**: só `shadow-sm` e `shadow-lg`.
- **Z-index** (`z-(--z-nome)`): map-ui 10, sidebar 20, header 30, panel 40, overlay 50, dialog 60, popover 70, toast 80. Modal aberto de dentro de um painel sempre fica acima dele.
- **Movimento**: 150 ms (hover, foco) e 250 ms (abrir/fechar). `prefers-reduced-motion` desliga animações, inclusive o pulso do ping.

## 3. Componentes

Só primitivos de `ui/`. Se faltar, adicione via shadcn antes de usar.

- **Ações**: `Button` (primary, secondary, ghost, danger, icon), `Toggle`, `ToggleGroup`.
- **Entrada**: `Input`, `Textarea`, `NumberInput`, `Select`, `Combobox`, `Checkbox`, `Switch`, `Slider`, `Form`.
- **Sobreposição**: `Dialog`, `AlertDialog`, `Sheet`, `Drawer`, `Popover`, `Tooltip`, `DropdownMenu`, `ContextMenu`.
- **Feedback e estrutura**: `Toast`, `Skeleton`, `Progress`, `Badge`, `EmptyState`, `Card`, `Tabs`, `ScrollArea`, `Separator`, `Collapsible`, `ResponsivePanel`.
- **Domínio**: `ElementBadge`, `StatBar` (PV, PE, SAN, PD), `ConditionChip`, `TokenAvatar`, `DiceResult`.

Substituições: `alert`/`confirm`/`prompt` (28 usos) → `Toast`/`AlertDialog`/`Dialog`; `title="..."` (127) → `Tooltip`; menu de contexto manual do `AppLayout` → `ContextMenu` com alternativa por toque; overlays `fixed inset-0` → `Dialog`/`Sheet`/`Drawer`; mapas de cor de elemento duplicados → `ElementBadge`; barras de vida soltas → `StatBar`.

Regras: tela não define cor, borda ou raio próprio; variantes via `cva` no primitivo; todo interativo tem hover, foco visível, desabilitado e carregando; toda lista tem vazio e carregando; botão só com ícone tem `aria-label` e `Tooltip`; textos curtos, botões no infinitivo.

## 4. Responsividade

| Região | Celular (< 768) | Tablet (768–1279) | Desktop (≥ 1280) |
| :--- | :--- | :--- | :--- |
| Mapa | Tela cheia | Tela cheia | Centro |
| Toolbar | Barra inferior com ações do papel | Vertical flutuante | Vertical flutuante |
| Sidebars | `Drawer` inferior | `Sheet` sobre o mapa | Fixas |
| Painel do mestre | Tela cheia, subpainéis empilhados numa coluna com rolagem | Subpainéis empilhados numa coluna com rolagem | Três colunas (duas até 1279) |
| Modais | `Drawer` | `Dialog` | `Dialog` |

Modo TV: só mapa e iniciativa. Iniciativa sempre em faixa horizontal com rolagem.

- `ResponsivePanel` decide `Drawer`/`Dialog`/`Sheet`; telas não escolhem.
- `h-dvh`, nunca `h-screen`. Respeitar `safe-area-inset`.
- Alvo de toque: 44 px no celular, 36 px nos demais. Toda ação tem caminho por toque (nada só por hover, clique direito ou atalho).
- Painéis usam `@container`. Stage Konva redimensiona com `ResizeObserver`.
- Sem rolagem horizontal da página.

## 5. Estabilidade e pronto

- Error boundary na raiz, no mapa, em cada sidebar, subpainel e modal, com botão para recarregar só a região.
- Dado de save ou rede com formato inesperado é descartado com aviso, nunca derruba a tela.
- Um dono por dado (store ou `useState`); sem copiar store para estado local fora de formulários.
- Playwright tira screenshot das telas principais em 390×844, 1024×768 e 1440×900; diferença acima do limite falha o CI.
- Guarda no CI contra hexadecimal, `text-[Npx]`, `z-[N]`, `alert(`, `confirm(`, `prompt(` em `apps/web/src` (lista de exceções só diminui).
- Acessibilidade: foco visível, Esc fecha modais (Base UI já faz), cor nunca é o único indicador, `alt` com o nome do personagem.

Tela pronta = só primitivos e tokens, funciona nas três faixas, tem error boundary, tem screenshot, passa na guarda do CI.
