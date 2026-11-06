import type { SheetTheme, CustomThemeHexColors } from '@/lib/sheet-dsl';

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

export const MODULE_COLOR_PALETTE: Array<{ id: string; label: string; hex: string }> = [
  { id: 'purple', label: 'Roxo', hex: '#8257e5' },
  { id: 'red', label: 'Rubi', hex: '#e11d48' },
  { id: 'amber', label: 'Âmbar', hex: '#d97706' },
  { id: 'emerald', label: 'Esmeralda', hex: '#059669' },
  { id: 'blue', label: 'Azul', hex: '#0284c7' },
  { id: 'cyan', label: 'Ciano', hex: '#06b6d4' },
  { id: 'pink', label: 'Rosa', hex: '#db2777' },
  { id: 'dark', label: 'Neutro', hex: '#52525b' },
];

const NAMED_COLOR_TO_HEX: Record<string, string> = {
  purple: '#8257e5',
  roxo: '#8257e5',
  violet: '#7c3aed',
  violeta: '#7c3aed',
  red: '#e11d48',
  vermelho: '#e11d48',
  rose: '#f43f5e',
  rubi: '#e11d48',
  blue: '#0284c7',
  azul: '#0284c7',
  sky: '#0ea5e9',
  cyan: '#06b6d4',
  ciano: '#06b6d4',
  green: '#059669',
  verde: '#059669',
  emerald: '#10b981',
  esmeralda: '#10b981',
  amber: '#d97706',
  ambar: '#d97706',
  'âmbar': '#d97706',
  gold: '#eab308',
  dourado: '#eab308',
  yellow: '#eab308',
  amarelo: '#eab308',
  orange: '#ea580c',
  laranja: '#ea580c',
  pink: '#db2777',
  rosa: '#db2777',
  dark: '#52525b',
  zinc: '#52525b',
  cinza: '#52525b',
};

export function resolveColorToHex(raw?: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  if (NAMED_COLOR_TO_HEX[trimmed]) return NAMED_COLOR_TO_HEX[trimmed];
  const cleanHex = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
  if (/^[0-9a-f]{3}$/.test(cleanHex)) {
    return `#${cleanHex[0]}${cleanHex[0]}${cleanHex[1]}${cleanHex[1]}${cleanHex[2]}${cleanHex[2]}`;
  }
  if (/^[0-9a-f]{6}$/.test(cleanHex)) {
    return `#${cleanHex}`;
  }
  return null;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const resolved = resolveColorToHex(hex);
  if (!resolved) return null;
  const num = parseInt(resolved.slice(1), 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function mixHexColors(hex1: string, hex2: string, ratio1: number): string {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  if (!c1 || !c2) return hex1;
  const r = Math.round(c1.r * ratio1 + c2.r * (1 - ratio1));
  const g = Math.round(c1.g * ratio1 + c2.g * (1 - ratio1));
  const b = Math.round(c1.b * ratio1 + c2.b * (1 - ratio1));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function getThemeRootVars(
  themeId?: SheetTheme,
  customColors?: CustomThemeHexColors,
): React.CSSProperties {
  const t = SHEET_THEMES[themeId ?? 'purple'] || SHEET_THEMES.purple;

  const customAccentHex = resolveColorToHex(customColors?.accent);
  const rgb = customAccentHex ? hexToRgb(customAccentHex) : null;

  const appBg =
    resolveColorToHex(customColors?.bg) ??
    (customAccentHex ? mixHexColors(customAccentHex, '#0b0b0e', 0.08) : t.appBg);
  const headerBg =
    resolveColorToHex(customColors?.headerBg) ??
    (customAccentHex ? mixHexColors(customAccentHex, '#121216', 0.14) : t.headerBg);
  const headerBorder = customAccentHex
    ? mixHexColors(customAccentHex, '#1f1f26', 0.28)
    : t.headerBorder;
  const cardBg =
    resolveColorToHex(customColors?.cardBg) ??
    (customAccentHex ? mixHexColors(customAccentHex, '#141418', 0.14) : t.cardBg);
  const cardBorder =
    resolveColorToHex(customColors?.cardBorder) ??
    (customAccentHex ? mixHexColors(customAccentHex, '#222228', 0.34) : t.cardBorder);
  const cardHover = customAccentHex
    ? mixHexColors(customAccentHex, '#27272e', 0.45)
    : t.cardHover;
  const itemBg =
    resolveColorToHex(customColors?.itemBg) ??
    (customAccentHex ? mixHexColors(customAccentHex, '#0f0f13', 0.09) : t.itemBg);
  const itemBorder =
    resolveColorToHex(customColors?.itemBorder) ??
    (customAccentHex ? mixHexColors(customAccentHex, '#1e1e24', 0.25) : t.itemBorder);
  const itemHover = customAccentHex
    ? mixHexColors(customAccentHex, '#1a1a20', 0.22)
    : t.itemHover;
  const codeBg = customAccentHex
    ? mixHexColors(customAccentHex, '#08080b', 0.06)
    : t.codeBg;
  const accent = customAccentHex ?? t.accent;
  const accentText =
    resolveColorToHex(customColors?.text) ??
    (customAccentHex ? mixHexColors(customAccentHex, '#ffffff', 0.55) : t.accentText);
  const accentSubtle = rgb
    ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.18)`
    : t.accentSubtle;

  return {
    '--sheet-bg': appBg,
    '--sheet-header-bg': headerBg,
    '--sheet-header-border': headerBorder,
    '--sheet-sidebar-bg': headerBg,
    '--sheet-sidebar-border': headerBorder,
    '--sheet-card-bg': cardBg,
    '--sheet-card-border': cardBorder,
    '--sheet-card-hover': cardHover,
    '--sheet-item-bg': itemBg,
    '--sheet-item-border': itemBorder,
    '--sheet-item-hover': itemHover,
    '--sheet-code-bg': codeBg,
    '--sheet-accent': accent,
    '--sheet-accent-subtle': accentSubtle,
    '--sheet-accent-border': cardBorder,
    '--sheet-accent-text': accentText,
  } as React.CSSProperties;
}

export function getModuleColorVars(rawColor?: string): React.CSSProperties | undefined {
  const hex = resolveColorToHex(rawColor);
  if (!hex) return undefined;
  const rgb = hexToRgb(hex);
  return {
    '--sheet-accent': hex,
    '--sheet-accent-text': mixHexColors(hex, '#ffffff', 0.55),
    '--sheet-accent-subtle': rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.18)` : undefined,
    '--sheet-card-bg': mixHexColors(hex, '#141418', 0.14),
    '--sheet-card-border': mixHexColors(hex, '#242429', 0.36),
    '--sheet-item-bg': mixHexColors(hex, '#0f0f13', 0.09),
    '--sheet-item-border': mixHexColors(hex, '#1f1f25', 0.26),
  } as React.CSSProperties;
}
