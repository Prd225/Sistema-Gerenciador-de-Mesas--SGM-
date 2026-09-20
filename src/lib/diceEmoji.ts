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
    svgHtml: `<svg viewBox="0 0 28 28" width="1.8em" height="1.8em" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: -0.36em; display: inline-block;">
      <defs>
        <linearGradient id="g-d4" x1="14" y1="2" x2="14" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#fbbf24"/>
          <stop offset="100%" stop-color="#b45309"/>
        </linearGradient>
      </defs>
      <polygon points="14,2 26.5,24 1.5,24" fill="url(#g-d4)" stroke="#fef08a" stroke-width="1.8" stroke-linejoin="round"/>
      <polygon points="14,2 14,16.5 1.5,24" fill="rgba(0,0,0,0.18)"/>
      <polygon points="14,2 26.5,24 14,16.5" fill="rgba(255,255,255,0.12)"/>
      <polygon points="1.5,24 14,16.5 26.5,24" fill="rgba(0,0,0,0.3)"/>
      <line x1="14" y1="2" x2="14" y2="16.5" stroke="#fef08a" stroke-width="1.2" stroke-opacity="0.8"/>
      <line x1="1.5" y1="24" x2="14" y2="16.5" stroke="#fef08a" stroke-width="1.2" stroke-opacity="0.8"/>
      <line x1="26.5" y1="24" x2="14" y2="16.5" stroke="#fef08a" stroke-width="1.2" stroke-opacity="0.8"/>
      <text x="14" y="14" font-size="10.5" font-weight="900" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle" dominant-baseline="central" fill="#ffffff" stroke="#000000" stroke-width="0.8" paint-order="stroke fill" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.9))">4</text>
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
    svgHtml: `<svg viewBox="0 0 28 28" width="1.8em" height="1.8em" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: -0.36em; display: inline-block;">
      <!-- Top Face -->
      <polygon points="14,2 25,8.5 14,15 3,8.5" fill="#38bdf8" stroke="#bae6fd" stroke-width="1.6" stroke-linejoin="round"/>
      <!-- Left Face -->
      <polygon points="3,8.5 14,15 14,26 3,19.5" fill="#0284c7" stroke="#bae6fd" stroke-width="1.6" stroke-linejoin="round"/>
      <!-- Right Face -->
      <polygon points="14,15 25,8.5 25,19.5 14,26" fill="#0369a1" stroke="#bae6fd" stroke-width="1.6" stroke-linejoin="round"/>
      <!-- Central number -->
      <text x="14" y="14.5" font-size="11.5" font-weight="900" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle" dominant-baseline="central" fill="#ffffff" stroke="#000000" stroke-width="0.8" paint-order="stroke fill" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.9))">6</text>
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
    svgHtml: `<svg viewBox="0 0 28 28" width="1.8em" height="1.8em" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: -0.36em; display: inline-block;">
      <defs>
        <linearGradient id="g-d8" x1="14" y1="1.5" x2="14" y2="26.5" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#34d399"/>
          <stop offset="100%" stop-color="#065f46"/>
        </linearGradient>
      </defs>
      <polygon points="14,1.5 25.5,14 14,26.5 2.5,14" fill="url(#g-d8)" stroke="#a7f3d0" stroke-width="1.8" stroke-linejoin="round"/>
      <!-- Front triangle face -->
      <polygon points="14,6.5 21.5,17 6.5,17" fill="rgba(255,255,255,0.15)" stroke="#a7f3d0" stroke-width="1.2" stroke-linejoin="round"/>
      <line x1="14" y1="1.5" x2="14" y2="6.5" stroke="#a7f3d0" stroke-width="1.2"/>
      <line x1="2.5" y1="14" x2="6.5" y2="17" stroke="#a7f3d0" stroke-width="1.2"/>
      <line x1="25.5" y1="14" x2="21.5" y2="17" stroke="#a7f3d0" stroke-width="1.2"/>
      <line x1="6.5" y1="17" x2="14" y2="26.5" stroke="#a7f3d0" stroke-width="1.2"/>
      <line x1="21.5" y1="17" x2="14" y2="26.5" stroke="#a7f3d0" stroke-width="1.2"/>
      <text x="14" y="13.5" font-size="11" font-weight="900" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle" dominant-baseline="central" fill="#ffffff" stroke="#000000" stroke-width="0.8" paint-order="stroke fill" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.9))">8</text>
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
    svgHtml: `<svg viewBox="0 0 28 28" width="1.8em" height="1.8em" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: -0.36em; display: inline-block;">
      <defs>
        <linearGradient id="g-d10" x1="14" y1="1.5" x2="14" y2="26.5" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#a78bfa"/>
          <stop offset="100%" stop-color="#5b21b6"/>
        </linearGradient>
      </defs>
      <polygon points="14,1.5 25,10 21,21.5 14,26.5 7,21.5 3,10" fill="url(#g-d10)" stroke="#ddd6fe" stroke-width="1.8" stroke-linejoin="round"/>
      <line x1="14" y1="1.5" x2="14" y2="16" stroke="#ddd6fe" stroke-width="1.2"/>
      <line x1="14" y1="16" x2="3" y2="10" stroke="#ddd6fe" stroke-width="1.2"/>
      <line x1="14" y1="16" x2="25" y2="10" stroke="#ddd6fe" stroke-width="1.2"/>
      <line x1="14" y1="16" x2="7" y2="21.5" stroke="#ddd6fe" stroke-width="1.2"/>
      <line x1="14" y1="16" x2="21" y2="21.5" stroke="#ddd6fe" stroke-width="1.2"/>
      <line x1="14" y1="16" x2="14" y2="26.5" stroke="#ddd6fe" stroke-width="1.2"/>
      <text x="14" y="12.5" font-size="10" font-weight="900" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle" dominant-baseline="central" fill="#ffffff" stroke="#000000" stroke-width="0.8" paint-order="stroke fill" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.9))">10</text>
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
    svgHtml: `<svg viewBox="0 0 28 28" width="1.8em" height="1.8em" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: -0.36em; display: inline-block;">
      <defs>
        <linearGradient id="g-d12" x1="14" y1="1.5" x2="14" y2="26.5" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#f472b6"/>
          <stop offset="100%" stop-color="#9d174d"/>
        </linearGradient>
      </defs>
      <!-- Outer pentagon -->
      <polygon points="14,1.5 26,10 21.5,24.5 6.5,24.5 2,10" fill="url(#g-d12)" stroke="#fbcfe8" stroke-width="1.8" stroke-linejoin="round"/>
      <!-- Inner inverted pentagon -->
      <polygon points="14,19.5 8.5,15.5 10.5,9.5 17.5,9.5 19.5,15.5" fill="rgba(255,255,255,0.18)" stroke="#fbcfe8" stroke-width="1.2" stroke-linejoin="round"/>
      <line x1="14" y1="1.5" x2="10.5" y2="9.5" stroke="#fbcfe8" stroke-width="1.2"/>
      <line x1="14" y1="1.5" x2="17.5" y2="9.5" stroke="#fbcfe8" stroke-width="1.2"/>
      <line x1="26" y1="10" x2="19.5" y2="15.5" stroke="#fbcfe8" stroke-width="1.2"/>
      <line x1="21.5" y1="24.5" x2="14" y2="19.5" stroke="#fbcfe8" stroke-width="1.2"/>
      <line x1="6.5" y1="24.5" x2="14" y2="19.5" stroke="#fbcfe8" stroke-width="1.2"/>
      <line x1="2" y1="10" x2="8.5" y2="15.5" stroke="#fbcfe8" stroke-width="1.2"/>
      <text x="14" y="14" font-size="10" font-weight="900" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle" dominant-baseline="central" fill="#ffffff" stroke="#000000" stroke-width="0.8" paint-order="stroke fill" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.9))">12</text>
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
    svgHtml: `<svg viewBox="0 0 28 28" width="1.8em" height="1.8em" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: -0.36em; display: inline-block;">
      <defs>
        <linearGradient id="g-d20" x1="14" y1="1.5" x2="14" y2="26.5" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#a855f7"/>
          <stop offset="50%" stop-color="#8257e5"/>
          <stop offset="100%" stop-color="#581c87"/>
        </linearGradient>
      </defs>
      <!-- Outer regular hexagon -->
      <polygon points="14,1.5 25.5,8 25.5,20 14,26.5 2.5,20 2.5,8" fill="url(#g-d20)" stroke="#e9d5ff" stroke-width="1.8" stroke-linejoin="round"/>
      <!-- Central triangle face -->
      <polygon points="14,7.5 22,19.5 6,19.5" fill="rgba(255,255,255,0.22)" stroke="#e9d5ff" stroke-width="1.2" stroke-linejoin="round"/>
      <!-- Facet lines connecting to vertices -->
      <line x1="14" y1="1.5" x2="14" y2="7.5" stroke="#e9d5ff" stroke-width="1.2"/>
      <line x1="25.5" y1="8" x2="14" y2="7.5" stroke="#e9d5ff" stroke-width="1.2"/>
      <line x1="25.5" y1="8" x2="22" y2="19.5" stroke="#e9d5ff" stroke-width="1.2"/>
      <line x1="25.5" y1="20" x2="22" y2="19.5" stroke="#e9d5ff" stroke-width="1.2"/>
      <line x1="14" y1="26.5" x2="22" y2="19.5" stroke="#e9d5ff" stroke-width="1.2"/>
      <line x1="14" y1="26.5" x2="6" y2="19.5" stroke="#e9d5ff" stroke-width="1.2"/>
      <line x1="2.5" y1="20" x2="6" y2="19.5" stroke="#e9d5ff" stroke-width="1.2"/>
      <line x1="2.5" y1="8" x2="6" y2="19.5" stroke="#e9d5ff" stroke-width="1.2"/>
      <line x1="2.5" y1="8" x2="14" y2="7.5" stroke="#e9d5ff" stroke-width="1.2"/>
      <!-- Central number 20 -->
      <text x="14" y="14.8" font-size="10.2" font-weight="900" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle" dominant-baseline="central" fill="#ffffff" stroke="#000000" stroke-width="0.8" paint-order="stroke fill" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.95))">20</text>
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
    svgHtml: `<svg viewBox="0 0 28 28" width="1.8em" height="1.8em" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: -0.36em; display: inline-block;">
      <defs>
        <linearGradient id="g-d100" x1="14" y1="1.5" x2="14" y2="26.5" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#f87171"/>
          <stop offset="100%" stop-color="#991b1b"/>
        </linearGradient>
      </defs>
      <polygon points="14,1.5 25,10 21,21.5 14,26.5 7,21.5 3,10" fill="url(#g-d100)" stroke="#fecaca" stroke-width="1.8" stroke-linejoin="round"/>
      <line x1="14" y1="1.5" x2="14" y2="16" stroke="#fecaca" stroke-width="1.2"/>
      <line x1="14" y1="16" x2="3" y2="10" stroke="#fecaca" stroke-width="1.2"/>
      <line x1="14" y1="16" x2="25" y2="10" stroke="#fecaca" stroke-width="1.2"/>
      <line x1="14" y1="16" x2="7" y2="21.5" stroke="#fecaca" stroke-width="1.2"/>
      <line x1="14" y1="16" x2="21" y2="21.5" stroke="#fecaca" stroke-width="1.2"/>
      <line x1="14" y1="16" x2="14" y2="26.5" stroke="#fecaca" stroke-width="1.2"/>
      <text x="14" y="12.5" font-size="8.8" font-weight="900" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle" dominant-baseline="central" fill="#ffffff" stroke="#000000" stroke-width="0.75" paint-order="stroke fill" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.9))">100</text>
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
  const actualKey: DiceType =
    normalizedKey === '%'
      ? 'd100'
      : (normalizedKey.startsWith('d') ? normalizedKey : `d${normalizedKey}`) as DiceType;
  const info = DICE_CONFIG[actualKey] || DICE_CONFIG.d20;

  return `<span class="rpg-dice-badge" contenteditable="false" data-dice="${info.type}" style="display:inline-flex;align-items:center;justify-content:center;vertical-align:-0.36em;margin:0 0.18em;line-height:1;user-select:none;cursor:default;">${info.svgHtml}</span>`;
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
