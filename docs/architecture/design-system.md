# Design System

## Situação atual

O app tem **apenas tema escuro** (sem alternador). Tailwind v4, tokens em `@theme` (`apps/web/src/index.css`), Vite plugin `@tailwindcss/vite` (sem `tailwind.config.js` nem PostCSS). Os mesmos valores existem em `apps/web/src/ui/tokens.ts` para uso fora do CSS (Konva).

As variáveis do shadcn (`--background`, `--primary`, `--border`...) ficam fixas em `:root`, todas derivadas dos tokens SGM. Não existe classe `.dark`.

## Tokens

Nomes e valores: ver `docs/specs/ui-design-system.md`, seção 2 (é a fonte única; não repetido aqui).

Decisão de nomenclatura: o shadcn usa `--accent` para o hover de menus/itens (mapeado para `control`, `#323238`). O "destaque" do spec (`#ffd700`, turno atual) é um token à parte, `--color-highlight` / `colorTokens.highlight`, para não colidir com o `--accent` do shadcn.

## Primitivos

Todos em `apps/web/src/ui/` (movidos de `apps/web/src/components/ui/`), gerados via `npx shadcn add ...` (style `base-nova`, sobre `@base-ui/react`), exceto os marcados "manual".

| Categoria | Componentes |
| :-- | :-- |
| Ações | `button`, `toggle`, `toggle-group` |
| Entrada | `input`, `textarea`, `number-input` (manual), `select`, `combobox`, `checkbox`, `switch`, `slider`, `form` (manual, react-hook-form) |
| Sobreposição | `dialog`, `alert-dialog`, `sheet`, `drawer` (vaul via base-ui), `popover`, `tooltip`, `dropdown-menu`, `context-menu` |
| Feedback/estrutura | `sonner` (Toaster), `skeleton`, `progress`, `badge`, `empty-state` (manual), `card`, `tabs`, `scroll-area`, `separator`, `collapsible`, `responsive-panel` (manual) |
| Domínio | `element-badge`, `stat-bar`, `condition-chip`, `token-avatar`, `dice-result` |
| Estabilidade | `region-boundary` (error boundary reutilizável) |
| Próprios (não shadcn) | `ImageCropper`, `RichTextEditor`, `label` |

`Button`: variantes `primary`, `secondary`, `ghost`, `danger` (mais `default`/`outline`/`destructive`/`link` como aliases, mantidos só para as telas antigas ainda não migradas — não usar em código novo). Tamanho `icon`/`icon-sm`/`icon-lg` cobre o caso "botão só com ícone".

`ResponsivePanel`: decide Drawer (< 768px) vs Sheet ou Dialog (`desktopVariant`, padrão Sheet) via `useMediaQuery` (`apps/web/src/hooks/useMediaQuery.ts`, com limpeza no `useEffect`).

`Toaster` (sonner) montado em `App.tsx`. Tema fixo `dark` (sem `next-themes`, fora da stack).

## Estabilidade

- `apps/web/src/ui/region-boundary.tsx`: error boundary com botão "Recarregar" que reseta só a região (usa `react-error-boundary`).
- `apps/web/src/lib/sanitize.ts` (`sanitizeHtml`, DOMPurify): todo `dangerouslySetInnerHTML` do app passa por ela.

## Guarda de CI

`npm run ui:guard` (`scripts/check-ui-guard.mjs`), parte do `npm run check`. Procura em `apps/web/src` hexadecimal solto, `text-[Npx]`, `z-[N]`, `alert(`, `confirm(`, `prompt(`. Exceções por arquivo/violação em `scripts/ui-guard-exceptions.json` (contagem atual das telas ainda não migradas); falha em arquivo novo ou contagem maior, avisa quando uma contagem cai.

## Pendências

- Telas ainda não usam os primitivos nem só os tokens (próxima etapa). Até lá, a lista de exceções da guarda cobre o código existente.
- Ícones: `lucide-react`. Fonte: Geist (`@fontsource-variable/geist`).
