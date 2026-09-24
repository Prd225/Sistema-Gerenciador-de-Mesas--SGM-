# Design System

## Situação atual

O app tem **apenas tema escuro**. Não existe alternador de tema e a classe `.dark` não é aplicada em lugar nenhum.

As cores são valores hexadecimais fixos nas classes Tailwind dos componentes (`bg-[#121214]`, `text-[#a8a8b3]`...). As variáveis de `src/index.css` e as cores de `tailwind.config.js` (`background`, `primary`, `muted`...) são o padrão gerado pelo shadcn e quase não são usadas fora de `src/components/ui/`.
As cores são valores hexadecimais fixos nas classes Tailwind dos componentes (`bg-[#121214]`, `text-[#a8a8b3]`...). As variáveis de `apps/web/src/index.css` e as cores de `tailwind.config.js` (`background`, `primary`, `muted`...) são o padrão gerado pelo shadcn e quase não são usadas fora de `apps/web/src/components/ui/`.

## Paleta em uso

Use exatamente estes valores. Não introduza hexadecimais novos.

| Papel                       | Cor                            | Classe típica                      |
| :-------------------------- | :----------------------------- | :--------------------------------- |
| Fundo da aplicação          | `#121214`                      | `bg-[#121214]`                     |
| Superfície (cards, painéis) | `#202024`                      | `bg-[#202024]`                     |
| Superfície alternativa      | `#1a1a1e`, `#18181b`           | `bg-[#1a1a1e]`                     |
| Borda e fundo de controles  | `#323238`                      | `border-[#323238]`, `bg-[#323238]` |
| Texto principal             | `#e1e1e6`                      | `text-[#e1e1e6]`                   |
| Texto secundário            | `#a8a8b3`                      | `text-[#a8a8b3]`                   |
| Texto apagado               | `#7c7c8a`, `#7a7a80`           | `text-[#7c7c8a]`                   |
| Marca (roxo)                | `#8257e5`, hover `#9466ff`     | `bg-[#8257e5] hover:bg-[#9466ff]`  |
| Destaque (dourado)          | `#ffd700`                      | `text-[#ffd700]`                   |
| Sucesso (verde)             | `#04d361`                      | `text-[#04d361]`                   |
| Perigo                      | Tailwind `red-400` / `red-500` | `text-red-400`, `bg-red-500`       |

Pendência (sem data): transformar essa paleta em variáveis CSS e classes semânticas no `tailwind.config.js`, e trocar os hexadecimais pelos nomes. Até isso acontecer, siga a tabela acima.

## Componentes

- Primitivos em `src/components/ui/` gerados pelo shadcn (`components.json`) sobre `@base-ui/react`: `button`, `dialog`, `dropdown-menu`, `input`, `select`.
- Primitivos em `apps/web/src/components/ui/` gerados pelo shadcn (`components.json`) sobre `@base-ui/react`: `button`, `dialog`, `dropdown-menu`, `input`, `select`.
- Componentes próprios no mesmo diretório: `ImageCropper`, `RichTextEditor`.
- Ícones: `lucide-react`.
- Fonte: Geist (`@fontsource-variable/geist`).
- Camadas e z-index: ver `frontend-guidelines.md`, seção 3.

Pendência: o projeto usa Tailwind v3, mas `shadcn` v4 e `tw-animate-css` pressupõem Tailwind v4. Ao gerar componentes novos com a CLI do shadcn, confira se o resultado compila e se as cores seguem a paleta acima.
