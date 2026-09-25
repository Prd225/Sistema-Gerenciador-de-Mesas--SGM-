/**
 * Tokens do design system SGM para uso fora do CSS (Konva, canvas 2D).
 * Mesmos valores de `src/index.css` (@theme). Qualquer mudança aqui exige
 * a mudança equivalente lá, e vice-versa.
 *
 * docs/specs/ui-design-system.md, secao 2.
 */
export const colorTokens = {
  canvas: '#0d0d0f',
  bg: '#121214',
  surface: '#202024',
  surfaceSunken: '#1a1a1e',
  border: '#323238',
  control: '#323238',
  text: '#e1e1e6',
  textMuted: '#a8a8b3',
  textSubtle: '#7c7c8a',
  primary: '#8257e5',
  primaryHover: '#9466ff',
  highlight: '#ffd700',
  success: '#04d361',
  warning: '#facc15',
  danger: '#ef4444',
  dangerHover: '#dc2626',
  elementSangue: '#ef4444',
  elementMorte: '#9ca3af',
  elementConhecimento: '#eab308',
  elementEnergia: '#a855f7',
  elementMedo: '#ffffff',
} as const;

export const radiusTokens = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
} as const;

export const zIndexTokens = {
  mapUi: 10,
  sidebar: 20,
  header: 30,
  panel: 40,
  overlay: 50,
  dialog: 60,
  popover: 70,
  toast: 80,
} as const;

export const durationTokens = {
  fast: 150,
  slow: 250,
} as const;

export type ColorToken = keyof typeof colorTokens;
