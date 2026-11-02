import type { SheetTheme } from '@/lib/sheet-dsl';

export type { SheetTheme };

export interface ThemeColors {
  id: SheetTheme;
  name: string;
  dotColor: string;
  tabActive: string;
  tabGlow: string;
  accentText: string;
  accentBorder: string;
  headerIcon: string;
  buttonActive: string;

  // Discord-style surfaces & ambient backgrounds
  appBg: string;
  headerBg: string;
  headerBorder: string;
  sidebarBg: string;
  sidebarBorder: string;
  cardBg: string;
  cardBorder: string;
  cardHover: string;
  itemBg: string;
  itemBorder: string;
  itemHover: string;
  codeBg: string;
  accent: string;
  accentSubtle: string;
}

export const SHEET_THEMES: Record<SheetTheme, ThemeColors> = {
  dark: {
    id: 'dark',
    name: 'Clássico',
    dotColor: '#71717a',
    tabActive: 'bg-zinc-800 text-white border border-zinc-700',
    tabGlow: '',
    accentText: '#d4d4d8',
    accentBorder: 'border-zinc-700',
    headerIcon: 'text-zinc-400',
    buttonActive: 'bg-zinc-800 text-white border-zinc-700',

    appBg: '#111214',
    headerBg: '#1e1f22',
    headerBorder: '#2b2d31',
    sidebarBg: '#1e1f22',
    sidebarBorder: '#2b2d31',
    cardBg: '#1e1f22',
    cardBorder: '#2b2d31',
    cardHover: '#3b3e45',
    itemBg: '#121214',
    itemBorder: '#2b2d31',
    itemHover: '#26282d',
    codeBg: '#0e0e10',
    accent: '#71717a',
    accentSubtle: 'rgba(113, 113, 122, 0.18)',
  },
  purple: {
    id: 'purple',
    name: 'Roxo',
    dotColor: '#8257e5',
    tabActive: 'bg-[#8257e5] text-white border border-[#9d77f3]',
    tabGlow: '',
    accentText: '#c4b5fd',
    accentBorder: 'border-[#8257e5]/50',
    headerIcon: 'text-[#a78bfa]',
    buttonActive: 'bg-[#8257e5] text-white border-[#8257e5]',

    appBg: '#0f0c1b',
    headerBg: '#171329',
    headerBorder: '#342557',
    sidebarBg: '#171329',
    sidebarBorder: '#342557',
    cardBg: '#1d1633',
    cardBorder: '#3b2a63',
    cardHover: '#523a8a',
    itemBg: '#130f23',
    itemBorder: '#2f2250',
    itemHover: '#241c3d',
    codeBg: '#0c0916',
    accent: '#8257e5',
    accentSubtle: 'rgba(130, 87, 229, 0.22)',
  },
  red: {
    id: 'red',
    name: 'Vermelho',
    dotColor: '#e11d48',
    tabActive: 'bg-rose-600 text-white border border-rose-500',
    tabGlow: '',
    accentText: '#fda4af',
    accentBorder: 'border-rose-500/50',
    headerIcon: 'text-rose-400',
    buttonActive: 'bg-rose-600 text-white border-rose-500',

    appBg: '#14080d',
    headerBg: '#1e0d13',
    headerBorder: '#481622',
    sidebarBg: '#1e0d13',
    sidebarBorder: '#481622',
    cardBg: '#251018',
    cardBorder: '#521a28',
    cardHover: '#78253a',
    itemBg: '#180a10',
    itemBorder: '#421520',
    itemHover: '#2d131d',
    codeBg: '#10050a',
    accent: '#e11d48',
    accentSubtle: 'rgba(225, 29, 72, 0.22)',
  },
  blue: {
    id: 'blue',
    name: 'Azul',
    dotColor: '#0284c7',
    tabActive: 'bg-sky-600 text-white border border-sky-500',
    tabGlow: '',
    accentText: '#7dd3fc',
    accentBorder: 'border-sky-500/50',
    headerIcon: 'text-sky-400',
    buttonActive: 'bg-sky-600 text-white border-sky-500',

    appBg: '#071019',
    headerBg: '#0c1927',
    headerBorder: '#173752',
    sidebarBg: '#0c1927',
    sidebarBorder: '#173752',
    cardBg: '#102334',
    cardBorder: '#1e476c',
    cardHover: '#2d6599',
    itemBg: '#0a1622',
    itemBorder: '#183754',
    itemHover: '#152c42',
    codeBg: '#050c14',
    accent: '#0284c7',
    accentSubtle: 'rgba(2, 132, 199, 0.22)',
  },
  green: {
    id: 'green',
    name: 'Verde Escuro',
    dotColor: '#059669',
    tabActive: 'bg-emerald-700 text-white border border-emerald-600',
    tabGlow: '',
    accentText: '#6ee7b7',
    accentBorder: 'border-emerald-600/50',
    headerIcon: 'text-emerald-400',
    buttonActive: 'bg-emerald-700 text-white border-emerald-600',

    appBg: '#06130d',
    headerBg: '#0a1e15',
    headerBorder: '#1a4530',
    sidebarBg: '#0a1e15',
    sidebarBorder: '#1a4530',
    cardBg: '#0e271c',
    cardBorder: '#1d563a',
    cardHover: '#297952',
    itemBg: '#081711',
    itemBorder: '#17432d',
    itemHover: '#133526',
    codeBg: '#040f0a',
    accent: '#059669',
    accentSubtle: 'rgba(5, 150, 105, 0.22)',
  },
  amber: {
    id: 'amber',
    name: 'Âmbar',
    dotColor: '#d97706',
    tabActive: 'bg-amber-600 text-white border border-amber-500',
    tabGlow: '',
    accentText: '#fcd34d',
    accentBorder: 'border-amber-500/50',
    headerIcon: 'text-amber-400',
    buttonActive: 'bg-amber-600 text-white border-amber-500',

    appBg: '#140f06',
    headerBg: '#1e170a',
    headerBorder: '#4a3816',
    sidebarBg: '#1e170a',
    sidebarBorder: '#4a3816',
    cardBg: '#261e0e',
    cardBorder: '#564019',
    cardHover: '#7a5a22',
    itemBg: '#181207',
    itemBorder: '#423214',
    itemHover: '#302611',
    codeBg: '#0e0b04',
    accent: '#d97706',
    accentSubtle: 'rgba(217, 119, 6, 0.22)',
  },
};

export function getThemeRootVars(themeId?: SheetTheme): React.CSSProperties {
  const t = SHEET_THEMES[themeId ?? 'purple'] || SHEET_THEMES.purple;
  return {
    '--sheet-bg': t.appBg,
    '--sheet-header-bg': t.headerBg,
    '--sheet-header-border': t.headerBorder,
    '--sheet-sidebar-bg': t.sidebarBg,
    '--sheet-sidebar-border': t.sidebarBorder,
    '--sheet-card-bg': t.cardBg,
    '--sheet-card-border': t.cardBorder,
    '--sheet-card-hover': t.cardHover,
    '--sheet-item-bg': t.itemBg,
    '--sheet-item-border': t.itemBorder,
    '--sheet-item-hover': t.itemHover,
    '--sheet-code-bg': t.codeBg,
    '--sheet-accent': t.accent,
    '--sheet-accent-subtle': t.accentSubtle,
    '--sheet-accent-border': t.cardBorder,
    '--sheet-accent-text': t.accentText,
  } as React.CSSProperties;
}
