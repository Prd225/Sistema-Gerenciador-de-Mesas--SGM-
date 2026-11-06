import { memo, type RefObject, type MutableRefObject } from 'react';
import { type DieFaceCount } from '@/store/useDiceTrayStore';

// ---------------------------------------------------------------------------
// Geometria declarativa de cada dado (viewBox 0..100)
// ---------------------------------------------------------------------------
type Tone = 'light' | 'dark';
interface Facet {
  pts: string;
  tone: Tone;
  op: number;
}
interface NumPos {
  x: number;
  y: number;
  rot?: number;
}
interface DieGeometry {
  outline: string; // path d
  facets: Facet[];
  face: string; // path d da face principal (frontal)
  faceOp: number;
  ridges: string; // path d com as arestas internas
  main: NumPos & { size: number };
  sides: NumPos[];
  sideSize: number;
}

const poly = (pts: string) => `M${pts.trim().split(/\s+/).join(' L')} Z`;
const lines = (segs: [string, string][]) => segs.map(([a, b]) => `M${a} L${b}`).join(' ');

// D4 — Tetraedro
const D4: DieGeometry = {
  outline: poly('50,6 94,88 6,88'),
  facets: [
    { pts: '50,6 50,60 6,88', tone: 'light', op: 0.5 },
    { pts: '50,6 94,88 50,60', tone: 'dark', op: 0.42 },
  ],
  face: poly('6,88 50,60 94,88'),
  faceOp: 0.22,
  ridges: lines([
    ['50,6', '50,60'],
    ['6,88', '50,60'],
    ['94,88', '50,60'],
  ]),
  main: { x: 50, y: 77, size: 19 },
  sides: [
    { x: 35, y: 52, rot: -28 },
    { x: 65, y: 52, rot: 28 },
  ],
  sideSize: 11,
};

// D6 — Cubo
const D6: DieGeometry = {
  outline: 'M24,8 H76 Q92,8 92,24 V76 Q92,92 76,92 H24 Q8,92 8,76 V24 Q8,8 24,8 Z',
  facets: [],
  face: 'M27,15 H73 Q85,15 85,27 V73 Q85,85 73,85 H27 Q15,85 15,73 V27 Q15,15 27,15 Z',
  faceOp: 0.16,
  ridges: '',
  main: { x: 50, y: 51, size: 32 },
  sides: [],
  sideSize: 0,
};

// D8 — Octaedro (diamante)
const D8: DieGeometry = {
  outline: poly('50,4 94,50 50,96 6,50'),
  facets: [
    { pts: '50,4 94,50 76,68 50,22', tone: 'dark', op: 0.32 },
    { pts: '50,4 50,22 24,68 6,50', tone: 'light', op: 0.3 },
    { pts: '94,50 50,96 76,68', tone: 'dark', op: 0.48 },
    { pts: '6,50 24,68 50,96', tone: 'light', op: 0.18 },
    { pts: '24,68 76,68 50,96', tone: 'dark', op: 0.3 },
  ],
  face: poly('50,22 76,68 24,68'),
  faceOp: 0.42,
  ridges: lines([
    ['50,4', '50,22'],
    ['94,50', '76,68'],
    ['6,50', '24,68'],
    ['50,96', '24,68'],
    ['50,96', '76,68'],
  ]),
  main: { x: 50, y: 54, size: 22 },
  sides: [
    { x: 73, y: 42, rot: 40 },
    { x: 27, y: 42, rot: -40 },
    { x: 50, y: 80 },
  ],
  sideSize: 9,
};

// D10 / D100 — Deltoedro (pipa)
const D10: DieGeometry = {
  outline: poly('50,4 92,48 50,96 8,48'),
  facets: [
    { pts: '50,4 28,48 8,48', tone: 'light', op: 0.34 },
    { pts: '50,4 92,48 72,48', tone: 'dark', op: 0.34 },
    { pts: '28,48 50,80 50,96 8,48', tone: 'light', op: 0.16 },
    { pts: '72,48 92,48 50,96 50,80', tone: 'dark', op: 0.46 },
  ],
  face: poly('50,4 72,48 50,80 28,48'),
  faceOp: 0.4,
  ridges: lines([
    ['50,80', '50,96'],
    ['28,48', '8,48'],
    ['72,48', '92,48'],
  ]),
  main: { x: 50, y: 47, size: 22 },
  sides: [
    { x: 29, y: 35, rot: -42 },
    { x: 71, y: 35, rot: 42 },
    { x: 32, y: 66, rot: -28 },
    { x: 68, y: 66, rot: 28 },
  ],
  sideSize: 9,
};

// D12 — Dodecaedro
const D12: DieGeometry = {
  outline: poly('50,4 78,13 95,37 95,67 78,91 50,96 22,91 5,67 5,37 22,13'),
  facets: [
    { pts: '50,19 80,41 95,37 78,13 50,4', tone: 'light', op: 0.22 },
    { pts: '80,41 69,78 78,91 95,67 95,37', tone: 'dark', op: 0.38 },
    { pts: '69,78 31,78 22,91 50,96 78,91', tone: 'dark', op: 0.46 },
    { pts: '31,78 20,41 5,37 5,67 22,91', tone: 'light', op: 0.14 },
    { pts: '20,41 50,19 50,4 22,13 5,37', tone: 'light', op: 0.3 },
  ],
  face: poly('50,19 80,41 69,78 31,78 20,41'),
  faceOp: 0.4,
  ridges: lines([
    ['50,19', '50,4'],
    ['80,41', '95,37'],
    ['69,78', '78,91'],
    ['31,78', '22,91'],
    ['20,41', '5,37'],
  ]),
  main: { x: 50, y: 52, size: 23 },
  sides: [
    { x: 71, y: 24, rot: 36 },
    { x: 83, y: 62, rot: 72 },
    { x: 50, y: 88 },
    { x: 17, y: 62, rot: -72 },
    { x: 29, y: 24, rot: -36 },
  ],
  sideSize: 8,
};

// D20 — Icosaedro
const D20: DieGeometry = {
  outline: poly('50,4 92,26 92,74 50,96 8,74 8,26'),
  facets: [
    { pts: '50,4 92,26 50,20', tone: 'light', op: 0.18 },
    { pts: '50,4 50,20 8,26', tone: 'light', op: 0.34 },
    { pts: '92,26 80,72 50,20', tone: 'dark', op: 0.22 },
    { pts: '92,26 92,74 80,72', tone: 'dark', op: 0.42 },
    { pts: '92,74 50,96 80,72', tone: 'dark', op: 0.5 },
    { pts: '50,96 20,72 80,72', tone: 'dark', op: 0.32 },
    { pts: '50,96 8,74 20,72', tone: 'dark', op: 0.38 },
    { pts: '8,74 8,26 20,72', tone: 'light', op: 0.14 },
    { pts: '8,26 50,20 20,72', tone: 'light', op: 0.26 },
  ],
  face: poly('50,20 80,72 20,72'),
  faceOp: 0.45,
  ridges: lines([
    ['50,4', '50,20'],
    ['92,26', '50,20'],
    ['8,26', '50,20'],
    ['92,26', '80,72'],
    ['92,74', '80,72'],
    ['50,96', '80,72'],
    ['50,96', '20,72'],
    ['8,74', '20,72'],
    ['8,26', '20,72'],
  ]),
  main: { x: 50, y: 55, size: 22 },
  sides: [
    { x: 74, y: 40, rot: 60 },
    { x: 26, y: 40, rot: -60 },
    { x: 50, y: 82 },
  ],
  sideSize: 9,
};

const GEOMETRY: Record<DieFaceCount, DieGeometry> = {
  4: D4,
  6: D6,
  8: D8,
  10: D10,
  12: D12,
  20: D20,
  100: D10,
};

// ---------------------------------------------------------------------------

interface DieShapeSVGProps {
  dieId: string;
  faces: DieFaceCount;
  color: string;
  isCrit: boolean;
  isFumble: boolean;
  isRolling: boolean;
  value: number | string;
  sideFaces?: number[];
  size?: number;
  mainNumRef?: RefObject<SVGTextElement | null>;
  sideNumRefs?: MutableRefObject<(SVGTextElement | null)[]>;
  isSelected?: boolean;
}

function DieShapeSVG({
  dieId,
  faces,
  color,
  isCrit,
  isFumble,
  isRolling,
  value,
  sideFaces = [],
  size = 84,
  mainNumRef,
  sideNumRefs,
  isSelected,
}: DieShapeSVGProps) {
  const g = GEOMETRY[faces];
  const uid = dieId.replace(/[^a-zA-Z0-9_-]/g, '');
  const gradId = `dg-${uid}`;
  const lightId = `dl-${uid}`;
  const darkId = `dd-${uid}`;
  const glossId = `ds-${uid}`;
  const clipId = `dc-${uid}`;

  const edge = isCrit ? '#fbbf24' : isFumble ? '#ef4444' : 'rgba(255,255,255,0.42)';
  const edgeWidth = isCrit || isFumble ? 2.4 : 1.4;
  const numColor = isCrit ? '#fde047' : isFumble ? '#fca5a5' : '#ffffff';
  const mainSize = faces === 100 ? g.main.size - 4 : g.main.size;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="overflow-visible select-none pointer-events-none"
    >
      <defs>
        <linearGradient id={gradId} x1="15%" y1="10%" x2="85%" y2="90%">
          <stop offset="0%" stopColor={color} stopOpacity={1} />
          <stop offset="55%" stopColor={color} stopOpacity={0.82} />
          <stop offset="100%" stopColor="#0b0b0f" stopOpacity={0.9} />
        </linearGradient>
        <linearGradient id={lightId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.5} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0.05} />
        </linearGradient>
        <linearGradient id={darkId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#000000" stopOpacity={0.15} />
          <stop offset="100%" stopColor="#000000" stopOpacity={0.75} />
        </linearGradient>
        <radialGradient id={glossId} cx="32%" cy="22%" r="45%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.32} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
        </radialGradient>
        <clipPath id={clipId}>
          <path d={g.outline} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        {/* Corpo de resina */}
        <path d={g.outline} fill={`url(#${gradId})`} />

        {/* Facetas laterais */}
        {g.facets.map((f, i) => (
          <polygon
            key={i}
            points={f.pts}
            fill={`url(#${f.tone === 'light' ? lightId : darkId})`}
            opacity={f.op}
          />
        ))}

        {/* Face frontal */}
        <path d={g.face} fill={`url(#${lightId})`} opacity={g.faceOp} />
        <path d={g.face} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1} strokeLinejoin="round" />

        {/* Arestas */}
        {g.ridges && (
          <path d={g.ridges} stroke="rgba(255,255,255,0.28)" strokeWidth={1} fill="none" strokeLinecap="round" />
        )}

        {/* Brilho especular suave */}
        <path d={g.outline} fill={`url(#${glossId})`} />

        {/* Números das faces laterais (mantidos no DOM para evitar mount/unmount durante o início do giro) */}
        {g.sides.map((s, i) => (
          <text
            key={i}
            ref={(el) => {
              if (sideNumRefs) sideNumRefs.current[i] = el;
            }}
            transform={`translate(${s.x} ${s.y}) rotate(${s.rot ?? 0})`}
            textAnchor="middle"
            dominantBaseline="central"
            fill="rgba(255,255,255,0.55)"
            opacity={isRolling ? 1 : 0}
            fontSize={g.sideSize}
            fontWeight={800}
            fontFamily="ui-monospace, monospace"
          >
            {sideFaces[i] ?? ''}
          </text>
        ))}

        {/* Número principal (contorno escuro via paint-order: sem texto duplicado) */}
        <text
          ref={mainNumRef}
          x={g.main.x}
          y={g.main.y}
          textAnchor="middle"
          dominantBaseline="central"
          fill={numColor}
          stroke="rgba(0,0,0,0.55)"
          strokeWidth={3}
          strokeLinejoin="round"
          paintOrder="stroke"
          fontSize={mainSize}
          fontWeight={900}
          fontFamily="ui-monospace, monospace"
        >
          {value}
        </text>
      </g>

      {/* Contorno externo nítido */}
      <path d={g.outline} fill="none" stroke={edge} strokeWidth={edgeWidth} strokeLinejoin="round" />

      {/* Contorno contínuo completo de seleção seguindo fielmente a geometria/formato do dado */}
      {isSelected && (
        <g className="animate-pulse pointer-events-none">
          {/* Brilho difuso externo na cor do dado */}
          <path
            d={g.outline}
            fill="none"
            stroke={color}
            strokeWidth={5}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.4}
            transform="translate(-4, -4) scale(1.08)"
          />
          {/* Linha sólida contínua (borda completa) contornando o formato geométrico */}
          <path
            d={g.outline}
            fill="none"
            stroke={color}
            strokeWidth={2.8}
            strokeLinejoin="round"
            strokeLinecap="round"
            transform="translate(-4, -4) scale(1.08)"
          />
        </g>
      )}
    </svg>
  );
}

export default memo(DieShapeSVG);
