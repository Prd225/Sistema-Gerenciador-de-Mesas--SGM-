import React from 'react';

export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

export interface DiceInfo {
  type: DiceType;
  label: string;
  name: string;
  shortcode: string;
  aliases?: string[];
  color: string;
  borderColor: string;
  bgColor: string;
  svgHtml: string;
}

export const DICE_CONFIG: Record<DiceType, DiceInfo> = {
  d4: {
    type: 'd4',
    label: 'd4',
    name: 'Dado de 4 faces (Tetraedro)',
    shortcode: ':d4:',
    color: '#f59e0b',
    borderColor: '#fbbf24',
    bgColor: 'rgba(245, 158, 11, 0.22)',
    svgHtml: `<svg viewBox="0 0 24 24" width="1.25em" height="1.25em" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: -0.22em; display: inline-block;">
      <polygon points="12,2.5 21.5,20.5 2.5,20.5" fill="rgba(245,158,11,0.22)" stroke="#f59e0b" stroke-width="1.6" stroke-linejoin="round"/>
      <line x1="12" y1="2.5" x2="12" y2="14.5" stroke="#fbbf24" stroke-width="1" stroke-opacity="0.8"/>
      <line x1="2.5" y1="20.5" x2="12" y2="14.5" stroke="#fbbf24" stroke-width="1" stroke-opacity="0.8"/>
      <line x1="21.5" y1="20.5" x2="12" y2="14.5" stroke="#fbbf24" stroke-width="1" stroke-opacity="0.8"/>
      <text x="12" y="11.5" font-size="7" font-weight="900" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle" dominant-baseline="central" fill="#ffffff" paint-order="stroke" stroke="#18181b" stroke-width="1.6">4</text>
    </svg>`,
  },
  d6: {
    type: 'd6',
    label: 'd6',
    name: 'Dado de 6 faces (Cubo)',
    shortcode: ':d6:',
    color: '#0ea5e9',
    borderColor: '#38bdf8',
    bgColor: 'rgba(14, 165, 233, 0.22)',
    svgHtml: `<svg viewBox="0 0 24 24" width="1.25em" height="1.25em" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: -0.22em; display: inline-block;">
      <polygon points="12,2.5 21,7.5 12,12.5 3,7.5" fill="rgba(14,165,233,0.35)" stroke="#38bdf8" stroke-width="1.4" stroke-linejoin="round"/>
      <polygon points="3,7.5 12,12.5 12,21.5 3,16.5" fill="rgba(14,165,233,0.2)" stroke="#38bdf8" stroke-width="1.4" stroke-linejoin="round"/>
      <polygon points="12,12.5 21,7.5 21,16.5 12,21.5" fill="rgba(14,165,233,0.5)" stroke="#38bdf8" stroke-width="1.4" stroke-linejoin="round"/>
      <text x="12" y="12" font-size="8" font-weight="900" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle" dominant-baseline="central" fill="#ffffff" paint-order="stroke" stroke="#0f172a" stroke-width="1.6">6</text>
    </svg>`,
  },
  d8: {
    type: 'd8',
    label: 'd8',
    name: 'Dado de 8 faces (Octaedro)',
    shortcode: ':d8:',
    color: '#10b981',
    borderColor: '#34d399',
    bgColor: 'rgba(16, 185, 129, 0.22)',
    svgHtml: `<svg viewBox="0 0 24 24" width="1.25em" height="1.25em" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: -0.22em; display: inline-block;">
      <polygon points="12,2 21.5,12 12,22 2.5,12" fill="rgba(16,185,129,0.22)" stroke="#10b981" stroke-width="1.5" stroke-linejoin="round"/>
      <polygon points="12,6 18,14.5 6,14.5" fill="rgba(16,185,129,0.4)" stroke="#34d399" stroke-width="1" stroke-linejoin="round"/>
      <line x1="12" y1="2" x2="12" y2="6" stroke="#34d399" stroke-width="1"/>
      <line x1="2.5" y1="12" x2="6" y2="14.5" stroke="#34d399" stroke-width="1"/>
      <line x1="21.5" y1="12" x2="18" y2="14.5" stroke="#34d399" stroke-width="1"/>
      <line x1="6" y1="14.5" x2="12" y2="22" stroke="#34d399" stroke-width="1"/>
      <line x1="18" y1="14.5" x2="12" y2="22" stroke="#34d399" stroke-width="1"/>
      <text x="12" y="11.8" font-size="7.5" font-weight="900" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle" dominant-baseline="central" fill="#ffffff" paint-order="stroke" stroke="#064e3b" stroke-width="1.6">8</text>
    </svg>`,
  },
  d10: {
    type: 'd10',
    label: 'd10',
    name: 'Dado de 10 faces (Trapezoedro)',
    shortcode: ':d10:',
    color: '#8b5cf6',
    borderColor: '#a78bfa',
    bgColor: 'rgba(139, 92, 246, 0.22)',
    svgHtml: `<svg viewBox="0 0 24 24" width="1.25em" height="1.25em" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: -0.22em; display: inline-block;">
      <polygon points="12,2 20.5,9 17.5,18 12,22 6.5,18 3.5,9" fill="rgba(139,92,246,0.25)" stroke="#8b5cf6" stroke-width="1.5" stroke-linejoin="round"/>
      <line x1="12" y1="2" x2="12" y2="13.5" stroke="#a78bfa" stroke-width="1"/>
      <line x1="12" y1="13.5" x2="3.5" y2="9" stroke="#a78bfa" stroke-width="1"/>
      <line x1="12" y1="13.5" x2="20.5" y2="9" stroke="#a78bfa" stroke-width="1"/>
      <line x1="12" y1="13.5" x2="6.5" y2="18" stroke="#a78bfa" stroke-width="1"/>
      <line x1="12" y1="13.5" x2="17.5" y2="18" stroke="#a78bfa" stroke-width="1"/>
      <line x1="12" y1="13.5" x2="12" y2="22" stroke="#a78bfa" stroke-width="1"/>
      <text x="12" y="11" font-size="6.8" font-weight="900" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle" dominant-baseline="central" fill="#ffffff" paint-order="stroke" stroke="#2e1065" stroke-width="1.6">10</text>
    </svg>`,
  },
  d12: {
    type: 'd12',
    label: 'd12',
    name: 'Dado de 12 faces (Dodecaedro)',
    shortcode: ':d12:',
    color: '#ec4899',
    borderColor: '#f472b6',
    bgColor: 'rgba(236, 72, 153, 0.22)',
    svgHtml: `<svg viewBox="0 0 24 24" width="1.25em" height="1.25em" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: -0.22em; display: inline-block;">
      <polygon points="12,2 21.5,8.9 17.9,20.5 6.1,20.5 2.5,8.9" fill="rgba(236,72,153,0.22)" stroke="#ec4899" stroke-width="1.5" stroke-linejoin="round"/>
      <polygon points="12,16.5 7.5,13.2 9.2,7.8 14.8,7.8 16.5,13.2" fill="rgba(236,72,153,0.4)" stroke="#f472b6" stroke-width="1" stroke-linejoin="round"/>
      <line x1="12" y1="2" x2="9.2" y2="7.8" stroke="#f472b6" stroke-width="1"/>
      <line x1="12" y1="2" x2="14.8" y2="7.8" stroke="#f472b6" stroke-width="1"/>
      <line x1="21.5" y1="8.9" x2="16.5" y2="13.2" stroke="#f472b6" stroke-width="1"/>
      <line x1="17.9" y1="20.5" x2="12" y2="16.5" stroke="#f472b6" stroke-width="1"/>
      <line x1="6.1" y1="20.5" x2="12" y2="16.5" stroke="#f472b6" stroke-width="1"/>
      <line x1="2.5" y1="8.9" x2="7.5" y2="13.2" stroke="#f472b6" stroke-width="1"/>
      <text x="12" y="12" font-size="7" font-weight="900" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle" dominant-baseline="central" fill="#ffffff" paint-order="stroke" stroke="#500724" stroke-width="1.6">12</text>
    </svg>`,
  },
  d20: {
    type: 'd20',
    label: 'd20',
    name: 'Dado de 20 faces (Icosaedro)',
    shortcode: ':d20:',
    color: '#8257e5',
    borderColor: '#a855f7',
    bgColor: 'rgba(130, 87, 229, 0.25)',
    svgHtml: `<svg viewBox="0 0 24 24" width="1.25em" height="1.25em" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: -0.22em; display: inline-block;">
      <polygon points="12,2 21,7.2 21,16.8 12,22 3,16.8 3,7.2" fill="rgba(130,87,229,0.25)" stroke="#8257e5" stroke-width="1.5" stroke-linejoin="round"/>
      <polygon points="12,7 18.5,16.2 5.5,16.2" fill="rgba(130,87,229,0.5)" stroke="#a855f7" stroke-width="1" stroke-linejoin="round"/>
      <line x1="12" y1="2" x2="12" y2="7" stroke="#a855f7" stroke-width="1"/>
      <line x1="21" y1="7.2" x2="12" y2="7" stroke="#a855f7" stroke-width="1"/>
      <line x1="21" y1="7.2" x2="18.5" y2="16.2" stroke="#a855f7" stroke-width="1"/>
      <line x1="21" y1="16.8" x2="18.5" y2="16.2" stroke="#a855f7" stroke-width="1"/>
      <line x1="12" y1="22" x2="18.5" y2="16.2" stroke="#a855f7" stroke-width="1"/>
      <line x1="12" y1="22" x2="5.5" y2="16.2" stroke="#a855f7" stroke-width="1"/>
      <line x1="3" y1="16.8" x2="5.5" y2="16.2" stroke="#a855f7" stroke-width="1"/>
      <line x1="3" y1="7.2" x2="5.5" y2="16.2" stroke="#a855f7" stroke-width="1"/>
      <line x1="3" y1="7.2" x2="12" y2="7" stroke="#a855f7" stroke-width="1"/>
      <text x="12" y="12.5" font-size="6.8" font-weight="900" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle" dominant-baseline="central" fill="#ffffff" paint-order="stroke" stroke="#2e1065" stroke-width="1.6">20</text>
    </svg>`,
  },
  d100: {
    type: 'd100',
    label: 'd100',
    name: 'Dado Percentual (d100 / d%)',
    shortcode: ':d100:',
    aliases: [':d%:'],
    color: '#ef4444',
    borderColor: '#f87171',
    bgColor: 'rgba(239, 68, 68, 0.25)',
    svgHtml: `<svg viewBox="0 0 24 24" width="1.25em" height="1.25em" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: -0.22em; display: inline-block;">
      <polygon points="12,2 20.5,9 17.5,18 12,22 6.5,18 3.5,9" fill="rgba(239,68,68,0.25)" stroke="#ef4444" stroke-width="1.5" stroke-linejoin="round"/>
      <line x1="12" y1="2" x2="12" y2="13.5" stroke="#f87171" stroke-width="1"/>
      <line x1="12" y1="13.5" x2="3.5" y2="9" stroke="#f87171" stroke-width="1"/>
      <line x1="12" y1="13.5" x2="20.5" y2="9" stroke="#f87171" stroke-width="1"/>
      <line x1="12" y1="13.5" x2="6.5" y2="18" stroke="#f87171" stroke-width="1"/>
      <line x1="12" y1="13.5" x2="17.5" y2="18" stroke="#f87171" stroke-width="1"/>
      <line x1="12" y1="13.5" x2="12" y2="22" stroke="#f87171" stroke-width="1"/>
      <text x="12" y="11" font-size="5.8" font-weight="900" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle" dominant-baseline="central" fill="#ffffff" paint-order="stroke" stroke="#450a0a" stroke-width="1.5">100</text>
    </svg>`,
  },
};

export const DICE_LIST: DiceInfo[] = Object.values(DICE_CONFIG);

export const DICE_SHORTCODE_REGEX = /:d(4|6|8|10|12|20|100|%):/gi;

/**
 * Creates the inline HTML badge for a given dice type.
 */
export function getDiceBadgeHtml(diceType: DiceType | string): string {
  const normalizedKey = diceType.toLowerCase().replace(/[:]/g, '');
  const actualKey: DiceType = normalizedKey === '%' ? 'd100' : (normalizedKey.startsWith('d') ? normalizedKey : `d${normalizedKey}`) as DiceType;
  const info = DICE_CONFIG[actualKey] || DICE_CONFIG.d20;

  return `<span class="rpg-dice-badge" contenteditable="false" data-dice="${info.type}" title="${info.label} (${info.name})" style="display:inline-flex;align-items:center;justify-content:center;vertical-align:-0.22em;margin:0 0.15em;line-height:1;user-select:none;cursor:default;">${info.svgHtml}</span>`;
}

/**
 * Replaces all occurrences of :d4:, :d6:, :d8:, :d10:, :d12:, :d20:, :d100:, :d%:
 * with an inline SVG badge.
 */
export function replaceDiceShortcodesWithHtml(html: string): string {
  if (!html) return html;
  return html.replace(DICE_SHORTCODE_REGEX, (match) => {
    const rawType = match.slice(1, -1);
    return getDiceBadgeHtml(rawType);
  });
}

/**
 * Helper to split plain text containing :d20:, etc. into React nodes with inline HTML dice.
 */
export function renderDiceText(text?: string | null): React.ReactNode {
  if (!text) return text;
  const parts = text.split(DICE_SHORTCODE_REGEX);
  if (parts.length === 1) return text;

  const nodes: React.ReactNode[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      if (parts[i]) nodes.push(parts[i]);
    } else {
      const rawType = parts[i];
      nodes.push(
        React.createElement('span', {
          key: i,
          dangerouslySetInnerHTML: { __html: getDiceBadgeHtml(rawType) },
          style: { display: 'inline' },
        }),
      );
    }
  }

  return React.createElement(React.Fragment, null, ...nodes);
}

