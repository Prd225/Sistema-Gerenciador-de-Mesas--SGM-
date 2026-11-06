import React from 'react';
import { Minus, Plus } from 'lucide-react';
import type { EvaluatedCounterBlock, EvaluatedCounterItem } from '@/lib/sheet-dsl';

interface CountersSectionProps {
  blocks: EvaluatedCounterBlock[];
  onSetCounterCurrent: (counterKey: string, current: number) => void;
}

const COLOR_STYLES: Record<
  string,
  {
    fill: string;
    border: string;
    svgFill: string;
    svgStroke: string;
    text: string;
  }
> = {
  amber: {
    fill: 'bg-amber-400',
    border: 'border-amber-400',
    svgFill: '#fbbf24',
    svgStroke: '#f59e0b',
    text: 'text-amber-300',
  },
  gold: {
    fill: 'bg-amber-400',
    border: 'border-amber-400',
    svgFill: '#fbbf24',
    svgStroke: '#f59e0b',
    text: 'text-amber-300',
  },
  yellow: {
    fill: 'bg-yellow-400',
    border: 'border-yellow-400',
    svgFill: '#facc15',
    svgStroke: '#eab308',
    text: 'text-yellow-300',
  },
  red: {
    fill: 'bg-rose-500',
    border: 'border-rose-500',
    svgFill: '#f43f5e',
    svgStroke: '#e11d48',
    text: 'text-rose-300',
  },
  green: {
    fill: 'bg-emerald-400',
    border: 'border-emerald-400',
    svgFill: '#34d399',
    svgStroke: '#10b981',
    text: 'text-emerald-300',
  },
  emerald: {
    fill: 'bg-emerald-400',
    border: 'border-emerald-400',
    svgFill: '#34d399',
    svgStroke: '#10b981',
    text: 'text-emerald-300',
  },
  blue: {
    fill: 'bg-sky-400',
    border: 'border-sky-400',
    svgFill: '#38bdf8',
    svgStroke: '#0284c7',
    text: 'text-sky-300',
  },
  cyan: {
    fill: 'bg-cyan-400',
    border: 'border-cyan-400',
    svgFill: '#22d3ee',
    svgStroke: '#06b6d4',
    text: 'text-cyan-300',
  },
  purple: {
    fill: 'bg-violet-400',
    border: 'border-violet-400',
    svgFill: '#a78bfa',
    svgStroke: '#7c3aed',
    text: 'text-violet-300',
  },
  violet: {
    fill: 'bg-violet-400',
    border: 'border-violet-400',
    svgFill: '#a78bfa',
    svgStroke: '#7c3aed',
    text: 'text-violet-300',
  },
  pink: {
    fill: 'bg-pink-400',
    border: 'border-pink-400',
    svgFill: '#f472b6',
    svgStroke: '#db2777',
    text: 'text-pink-300',
  },
  orange: {
    fill: 'bg-orange-400',
    border: 'border-orange-400',
    svgFill: '#fb923c',
    svgStroke: '#ea580c',
    text: 'text-orange-300',
  },
};

function getPalette(color?: string) {
  return COLOR_STYLES[(color || 'amber').toLowerCase()] ?? COLOR_STYLES.amber;
}

function buildPieSlicePath(
  cx: number,
  cy: number,
  r: number,
  startAngleDeg: number,
  endAngleDeg: number,
): string {
  const startRad = ((startAngleDeg - 90) * Math.PI) / 180;
  const endRad = ((endAngleDeg - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const largeArc = endAngleDeg - startAngleDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

export const CountersSection: React.FC<CountersSectionProps> = ({
  blocks,
  onSetCounterCurrent,
}) => {
  if (blocks.length === 0) return null;

  const handleSegmentClick = (
    counterKey: string,
    index: number,
    current: number,
  ) => {
    const target = index + 1;
    const next = current === target ? index : target;
    onSetCounterCurrent(counterKey, next);
  };

  const renderCounterCard = (blockId: string, item: EvaluatedCounterItem) => {
    const counterKey = `${blockId}.${item.id}`;
    const palette = getPalette(item.color);
    const total = Math.max(1, Math.min(24, item.max));

    if (item.style === 'pie') {
      const size = 96;
      const cx = size / 2;
      const cy = size / 2;
      const r = 40;
      const stepDeg = 360 / total;

      return (
        <div
          key={counterKey}
          className="rounded-xl border p-3 flex flex-col items-center justify-between gap-2.5 transition-colors"
          style={{
            backgroundColor: 'var(--sheet-card-bg, #18181b)',
            borderColor: 'var(--sheet-card-border, #29292e)',
          }}
        >
          <div className="w-full flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-zinc-200 break-words leading-snug">
              {item.label}
            </span>
            <span className={`text-[11px] font-mono font-bold ${palette.text}`}>
              {item.current}/{item.max}
            </span>
          </div>

          <div className="relative flex items-center justify-center py-1">
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              className="overflow-visible select-none"
            >
              {total === 1 ? (
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={item.current >= 1 ? palette.svgFill : '#09090b'}
                  stroke="#3f3f46"
                  strokeWidth={2.5}
                  className="cursor-pointer transition-colors hover:opacity-90"
                  onClick={() => handleSegmentClick(counterKey, 0, item.current)}
                />
              ) : (
                Array.from({ length: total }).map((_, idx) => {
                  const startDeg = idx * stepDeg;
                  const endDeg = (idx + 1) * stepDeg;
                  const isFilled = idx < item.current;
                  return (
                    <path
                      key={idx}
                      d={buildPieSlicePath(cx, cy, r, startDeg, endDeg)}
                      fill={isFilled ? palette.svgFill : '#09090b'}
                      stroke="#27272a"
                      strokeWidth={2.5}
                      strokeLinejoin="round"
                      className="cursor-pointer transition-opacity hover:opacity-85"
                      onClick={() =>
                        handleSegmentClick(counterKey, idx, item.current)
                      }
                    >
                      <title>{`${item.label}: ${idx + 1}/${item.max}`}</title>
                    </path>
                  );
                })
              )}
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke="#52525b"
                strokeWidth={2}
                className="pointer-events-none"
              />
            </svg>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                onSetCounterCurrent(counterKey, Math.max(0, item.current - 1))
              }
              disabled={item.current <= 0}
              className="p-1 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-30"
              title="Subtrair 1"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() =>
                onSetCounterCurrent(
                  counterKey,
                  Math.min(item.max, item.current + 1),
                )
              }
              disabled={item.current >= item.max}
              className="p-1 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-30"
              title="Adicionar 1"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      );
    }

    if (item.style === 'dots') {
      return (
        <div
          key={counterKey}
          className="rounded-xl border p-3 flex flex-col justify-between gap-2.5 transition-colors"
          style={{
            backgroundColor: 'var(--sheet-card-bg, #18181b)',
            borderColor: 'var(--sheet-card-border, #29292e)',
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-zinc-200 break-words leading-snug">
              {item.label}
            </span>
            <span className={`text-[11px] font-mono font-bold ${palette.text}`}>
              {item.current}/{item.max}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 py-1.5">
            {Array.from({ length: total }).map((_, idx) => {
              const isFilled = idx < item.current;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    handleSegmentClick(counterKey, idx, item.current)
                  }
                  title={`${item.label}: ${idx + 1}/${item.max}`}
                  className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${isFilled
                      ? `${palette.fill} ${palette.border} scale-100`
                      : 'bg-zinc-950 border-zinc-700 hover:border-zinc-500 scale-95'
                    }`}
                />
              );
            })}
          </div>
        </div>
      );
    }

    // Default: 'segments' (barra retangular dividida em segmentos clicáveis)
    return (
      <div
        key={counterKey}
        className="rounded-xl border p-3 flex flex-col justify-between gap-2.5 transition-colors"
        style={{
          backgroundColor: 'var(--sheet-card-bg, #18181b)',
          borderColor: 'var(--sheet-card-border, #29292e)',
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-zinc-200 break-words leading-snug">
            {item.label}
          </span>
          <span className={`text-[11px] font-mono font-bold ${palette.text}`}>
            {item.current}/{item.max}
          </span>
        </div>

        <div
          className="flex items-stretch h-6 rounded-lg overflow-hidden border-2 divide-x-2 divide-[var(--sheet-card-border)] transition-colors"
          style={{
            borderColor: 'var(--sheet-card-border, #3f3f46)',
            backgroundColor: 'var(--sheet-item-bg, #121214)',
          }}
        >
          {Array.from({ length: total }).map((_, idx) => {
            const isFilled = idx < item.current;
            return (
              <button
                key={idx}
                type="button"
                onClick={() =>
                  handleSegmentClick(counterKey, idx, item.current)
                }
                title={`${item.label}: ${idx + 1}/${item.max}`}
                className={`flex-1 transition-all cursor-pointer ${isFilled
                    ? palette.fill
                    : 'bg-transparent hover:bg-white/10'
                  }`}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {blocks.map((block) => {
        if (block.items.length === 0) return null;
        const hasPie = block.items.some((i) => i.style === 'pie');

        return (
          <div key={block.id} className="space-y-2">
            {block.title && (
              <div className="px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  {block.title}
                </span>
              </div>
            )}

            <div
              className={
                block.display === 'list' || block.display === 'stacked'
                  ? 'space-y-2.5'
                  : hasPie && block.items.length > 1
                    ? 'grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-stretch'
                    : 'grid grid-cols-1 sm:grid-cols-2 gap-2.5'
              }
            >
              {block.items.map((item) => renderCounterCard(block.id, item))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

