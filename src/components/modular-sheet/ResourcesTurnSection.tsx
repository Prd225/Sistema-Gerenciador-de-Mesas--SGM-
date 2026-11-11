import { Plus, Minus, RotateCcw, Dices, ArrowRightLeft } from 'lucide-react';
import { useModularSheetStore } from '@/store/useModularSheetStore';
import { isTabMatching, type CompiledSheet, type ModuleDisplayStyle } from '@/lib/sheet-dsl';
import { resolveColorToHex } from './theme';
import type { OnExecuteRoll } from './types';

interface ResourcesTurnSectionProps {
  sheetId: string;
  sheet: CompiledSheet;
  activeTab?: string;
  mode?: 'both' | 'res' | 'turn';
  displayOverride?: ModuleDisplayStyle;
  blockId?: string;
  titleOverride?: string;
  cols?: number;
  isTall?: boolean;
  onExecuteRoll?: OnExecuteRoll;
  isMobilePortrait?: boolean;
}

interface ResourceVisualStyle {
  barClassName: string;
  barStyle?: React.CSSProperties;
  borderStyle?: React.CSSProperties;
  trackActiveStyle?: React.CSSProperties;
}

function getResourceVisualStyle(color?: string): ResourceVisualStyle {
  if (!color || !color.trim()) {
    // Sem cor específica na linha do recurso: herda a cor do módulo @res ou do tema da ficha
    return {
      barClassName: '',
      barStyle: {
        backgroundColor: 'var(--sheet-accent, #10b981)',
      },
      borderStyle: {
        borderColor: 'var(--sheet-accent-border, rgba(16, 185, 129, 0.3))',
      },
      trackActiveStyle: {
        backgroundColor: 'var(--sheet-accent, #8257e5)',
        borderColor: 'var(--sheet-accent, #996dff)',
      },
    };
  }

  const c = color.trim().toLowerCase();

  if (c === 'red' || c === 'vermelho' || c === 'crimson' || c === 'sangue' || c === 'rose') {
    return {
      barClassName: 'bg-gradient-to-r from-rose-600 to-red-500',
      borderStyle: { borderColor: 'rgba(244, 63, 94, 0.35)' },
      trackActiveStyle: { backgroundColor: '#e11d48', borderColor: '#f43f5e' },
    };
  }
  if (c === 'blue' || c === 'azul') {
    return {
      barClassName: 'bg-gradient-to-r from-blue-600 to-sky-400',
      borderStyle: { borderColor: 'rgba(56, 189, 248, 0.35)' },
      trackActiveStyle: { backgroundColor: '#2563eb', borderColor: '#38bdf8' },
    };
  }
  if (c === 'cyan' || c === 'ciano') {
    return {
      barClassName: 'bg-gradient-to-r from-cyan-600 to-cyan-400',
      borderStyle: { borderColor: 'rgba(34, 211, 238, 0.35)' },
      trackActiveStyle: { backgroundColor: '#0891b2', borderColor: '#22d3ee' },
    };
  }
  if (c === 'amber' || c === 'yellow' || c === 'gold' || c === 'amarelo' || c === 'dourado' || c === 'orange' || c === 'laranja') {
    return {
      barClassName: 'bg-gradient-to-r from-amber-500 to-yellow-400',
      borderStyle: { borderColor: 'rgba(245, 158, 11, 0.35)' },
      trackActiveStyle: { backgroundColor: '#d97706', borderColor: '#fbbf24' },
    };
  }
  if (c === 'purple' || c === 'violet' || c === 'roxo' || c === 'violeta') {
    return {
      barClassName: 'bg-gradient-to-r from-[#8257e5] to-purple-400',
      borderStyle: { borderColor: 'rgba(130, 87, 229, 0.4)' },
      trackActiveStyle: { backgroundColor: '#8257e5', borderColor: '#a855f7' },
    };
  }
  if (c === 'green' || c === 'emerald' || c === 'verde' || c === 'esmeralda') {
    return {
      barClassName: 'bg-gradient-to-r from-emerald-600 to-teal-400',
      borderStyle: { borderColor: 'rgba(16, 185, 129, 0.35)' },
      trackActiveStyle: { backgroundColor: '#059669', borderColor: '#10b981' },
    };
  }
  if (c === 'pink' || c === 'rosa') {
    return {
      barClassName: 'bg-gradient-to-r from-pink-600 to-rose-400',
      borderStyle: { borderColor: 'rgba(236, 72, 153, 0.35)' },
      trackActiveStyle: { backgroundColor: '#db2777', borderColor: '#f472b6' },
    };
  }

  const resolvedHex = resolveColorToHex(color) ?? color;
  return {
    barClassName: '',
    barStyle: {
      backgroundColor: resolvedHex,
    },
    borderStyle: {
      borderColor: `${resolvedHex}55`,
    },
    trackActiveStyle: {
      backgroundColor: resolvedHex,
      borderColor: resolvedHex,
    },
  };
}

function renderResourceClockSvg(current: number, max: number, activeColor: string) {
  const total = Math.max(2, Math.min(24, max || 4));
  const filled = Math.max(0, Math.min(total, current));
  const cx = 20;
  const cy = 20;
  const r = 16;

  return (
    <svg width={40} height={40} viewBox="0 0 40 40" className="shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="#121214" stroke="#3f3f46" strokeWidth={1.5} />
      {Array.from({ length: total }, (_, idx) => {
        const startAngle = (idx / total) * Math.PI * 2 - Math.PI / 2;
        const endAngle = ((idx + 1) / total) * Math.PI * 2 - Math.PI / 2;
        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);
        const largeArc = 1 / total > 0.5 ? 1 : 0;
        const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
        const isActive = idx < filled;
        return (
          <path
            key={idx}
            d={d}
            fill={isActive ? activeColor : 'transparent'}
            stroke="#27272a"
            strokeWidth={1}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#52525b" strokeWidth={1.2} />
    </svg>
  );
}

export function ResourcesTurnSection({
  sheetId,
  sheet,
  activeTab,
  mode = 'both',
  displayOverride,
  blockId,
  titleOverride,
  cols,
  isTall = false,
  onExecuteRoll,
  isMobilePortrait = false,
}: ResourcesTurnSectionProps) {
  const {
    setResourceCurrent,
    cycleTrackBox,
    setTurnSlotCurrent,
    applyTurnConversion,
    resetTurnSlots,
  } = useModularSheetStore();

  const resList =
    mode === 'turn'
      ? []
      : Object.values(sheet.resources).filter(
          (r) =>
            isTabMatching(r.tab, activeTab) &&
            (!blockId || r.blockId === blockId),
        );

  const turnSlots = mode === 'res' ? [] : Object.values(sheet.turn.slots);
  const turnConversions = mode === 'res' ? [] : sheet.turn.conversions ?? [];

  const resLayout = sheet.moduleLayouts.find((m) =>
    blockId ? m.id === blockId : m.kind === 'res',
  );
  const customTitle =
    titleOverride ??
    (mode === 'turn'
      ? sheet.blockTitles.turn
      : resLayout?.title ?? sheet.blockTitles.resources);
  const display = displayOverride ?? resLayout?.display ?? 'cards';

  if (resList.length === 0 && turnSlots.length === 0 && turnConversions.length === 0) {
    return null;
  }

  const useStacked =
    display === 'stacked' ||
    display === 'list' ||
    display === 'divided' ||
    (isTall && !cols) ||
    isMobilePortrait;

  const gridStyle: React.CSSProperties | undefined = useStacked
    ? undefined
    : cols && cols > 0
      ? { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }
      : { gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' };

  const resolveTurnSlot = (slotRef: string) => {
    if (sheet.turn.slots[slotRef]) return sheet.turn.slots[slotRef];
    const low = slotRef.toLowerCase();
    return turnSlots.find(
      (s) => s.id.toLowerCase() === low || (s.label || '').toLowerCase() === low,
    );
  };

  const resetPolicyLabel =
    sheet.turn.reset === 'scene' || sheet.turn.reset === 'cena'
      ? 'Cena'
      : sheet.turn.reset === 'session' || sheet.turn.reset === 'sessao'
        ? 'Sessão'
        : sheet.turn.reset === 'turn' || sheet.turn.reset === 'turno'
          ? 'Turno'
          : 'Rodada';

  return (
    <div
      className={`space-y-2.5 w-full min-w-0 ${
        isTall && !isMobilePortrait ? 'flex-1 flex flex-col' : ''
      }`}
    >
      {customTitle && (
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#a8a8b3] px-0.5">
          {customTitle}
        </h3>
      )}

      {/* Grid de Barras, Trilhas, Relógios, Pools e Recursos */}
      {resList.length > 0 && (
        <div
          className={useStacked ? 'flex flex-col gap-2 flex-1' : 'grid gap-2.5 flex-1 content-start'}
          style={gridStyle}
        >
          {resList.map((res) => {
            const palette = getResourceVisualStyle(res.color);
            const maxVal = Math.max(1, res.max);
            const pct = Math.max(0, Math.min(100, Math.round((res.current / maxVal) * 100)));
            const activeHex =
              (res.color ? resolveColorToHex(res.color) : undefined) ??
              'var(--sheet-accent, #8257e5)';

            if (res.kind === 'track') {
              const states = res.states && res.states.length > 0 ? res.states : ['.', '/', 'X'];
              const boxes =
                res.boxes ??
                Array.from({ length: Math.max(0, res.max) }, (_, i) =>
                  i < res.current ? (states[1] ?? '/') : (states[0] ?? '.'),
                );

              return (
                <div
                  key={res.id}
                  className="rounded-xl border p-3 flex flex-col justify-between gap-2 transition-colors min-w-0"
                  style={{
                    backgroundColor: 'var(--sheet-card-bg, #18181b)',
                    borderColor: 'var(--sheet-card-border, #29292e)',
                    ...palette.borderStyle,
                  }}
                >
                  <div className="flex items-center justify-between gap-2 text-xs min-w-0">
                    <span className="font-semibold text-[#e1e1e6] uppercase truncate" title={res.label || res.id}>
                      {res.label || res.id}
                    </span>
                    <span className="font-mono text-[#8d8d99] shrink-0">
                      {res.current}/{res.max}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {boxes.map((boxState, idx) => {
                      const isFilled = boxState !== (states[0] ?? '.');
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            cycleTrackBox(sheetId, res.id, idx, boxes, states)
                          }
                          title={`Alternar estado (${states.join(' → ')})`}
                          className={`w-7 h-7 rounded border font-mono text-xs font-bold flex items-center justify-center transition-colors ${
                            isFilled
                              ? 'text-white'
                              : 'bg-[#18181b] border-[#323238] text-[#71717a] hover:border-[var(--sheet-accent)]'
                          }`}
                          style={isFilled ? palette.trackActiveStyle : undefined}
                        >
                          {boxState === (states[0] ?? '.') ? '' : boxState}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }

            if (res.kind === 'clock') {
              return (
                <div
                  key={res.id}
                  className="rounded-xl border p-3 flex items-center justify-between gap-3 transition-colors min-w-0"
                  style={{
                    backgroundColor: 'var(--sheet-card-bg, #18181b)',
                    borderColor: 'var(--sheet-card-border, #29292e)',
                    ...palette.borderStyle,
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setResourceCurrent(
                        sheetId,
                        res.id,
                        res.current >= res.max ? res.min : res.current + 1,
                      )
                    }
                    title="Clique para avançar o relógio"
                    className="hover:scale-105 transition-transform shrink-0"
                  >
                    {renderResourceClockSvg(res.current, res.max, activeHex)}
                  </button>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="text-xs font-bold text-[#e1e1e6] uppercase truncate" title={res.label || res.id}>
                      {res.label || res.id}
                    </div>
                    <div className="flex items-center gap-1 font-mono text-xs font-bold">
                      <button
                        type="button"
                        onClick={() =>
                          setResourceCurrent(sheetId, res.id, Math.max(res.min, res.current - 1))
                        }
                        className="w-5 h-5 rounded hover:bg-[#202024] border border-[#323238] text-[#a8a8b3] hover:text-white flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-white px-1">
                        {res.current}
                        <span className="text-[#71717a] font-normal"> / {res.max}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setResourceCurrent(sheetId, res.id, Math.min(res.max, res.current + 1))
                        }
                        className="w-5 h-5 rounded hover:bg-[#202024] border border-[#323238] text-[#a8a8b3] hover:text-white flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            if (res.kind === 'slots') {
              const slotCount = Math.max(1, Math.min(20, res.max));
              return (
                <div
                  key={res.id}
                  className="rounded-xl border p-3 flex flex-col justify-between gap-2 transition-colors min-w-0"
                  style={{
                    backgroundColor: 'var(--sheet-card-bg, #18181b)',
                    borderColor: 'var(--sheet-card-border, #29292e)',
                    ...palette.borderStyle,
                  }}
                >
                  <div className="flex items-center justify-between gap-2 text-xs min-w-0">
                    <span className="font-bold text-[#e1e1e6] uppercase truncate" title={res.label || res.id}>
                      {res.label || res.id}
                    </span>
                    <span className="font-mono text-[#8d8d99] shrink-0">
                      {res.current}/{res.max}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {Array.from({ length: slotCount }, (_, idx) => {
                      const active = idx < res.current;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            setResourceCurrent(
                              sheetId,
                              res.id,
                              idx + 1 === res.current ? idx : idx + 1,
                            )
                          }
                          className={`w-5 h-5 rounded-full border transition-colors ${
                            active
                              ? ''
                              : 'bg-[#121214] border-[#323238] hover:border-[var(--sheet-accent)]'
                          }`}
                          style={active ? palette.trackActiveStyle : undefined}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            }

            if (res.kind === 'pool') {
              const dieSuffix = res.poolDie ?? 'd6';
              const poolFormula = `${Math.max(1, res.current)}${dieSuffix}`;
              return (
                <div
                  key={res.id}
                  className="rounded-xl border p-3 flex flex-col justify-between gap-2 transition-colors min-w-0"
                  style={{
                    backgroundColor: 'var(--sheet-card-bg, #18181b)',
                    borderColor: 'var(--sheet-card-border, #29292e)',
                    ...palette.borderStyle,
                  }}
                >
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="text-xs font-bold text-[#e1e1e6] uppercase truncate" title={res.label || res.id}>
                      {res.label || res.id}
                    </span>
                    <div className="flex items-center gap-1 font-mono text-xs font-bold shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setResourceCurrent(sheetId, res.id, Math.max(res.min, res.current - 1))
                        }
                        className="w-5 h-5 rounded hover:bg-[#202024] border border-[#323238] text-[#a8a8b3] hover:text-white flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-white px-1">
                        {res.current}
                        {dieSuffix}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setResourceCurrent(
                            sheetId,
                            res.id,
                            Math.min(Math.max(res.max, 20), res.current + 1),
                          )
                        }
                        className="w-5 h-5 rounded hover:bg-[#202024] border border-[#323238] text-[#a8a8b3] hover:text-white flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  {onExecuteRoll && (
                    <button
                      type="button"
                      disabled={res.current <= 0}
                      onClick={() =>
                        onExecuteRoll(
                          res.label || res.id,
                          poolFormula,
                          `Reserva de Dados (${poolFormula})`,
                        )
                      }
                      className="h-7 px-2.5 rounded-md border border-[#323238] bg-[#121214] hover:border-[var(--sheet-accent)] text-xs font-semibold text-[#e1e1e6] disabled:opacity-40 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Dices className="w-3.5 h-3.5 text-[var(--sheet-accent-text,#c4b5fd)]" />
                      <span>Rolar {res.current > 0 ? poolFormula : `0${dieSuffix}`}</span>
                    </button>
                  )}
                </div>
              );
            }

            if (res.kind === 'counter' && res.unbounded) {
              return (
                <div
                  key={res.id}
                  className="rounded-xl border p-3 flex items-center justify-between gap-2 transition-colors min-w-0"
                  style={{
                    backgroundColor: 'var(--sheet-card-bg, #18181b)',
                    borderColor: 'var(--sheet-card-border, #29292e)',
                    ...palette.borderStyle,
                  }}
                >
                  <span className="text-xs font-bold text-[#e1e1e6] uppercase truncate" title={res.label || res.id}>
                    {res.label || res.id}
                  </span>
                  <div className="flex items-center gap-1 font-mono text-xs font-bold shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setResourceCurrent(sheetId, res.id, Math.max(res.min, res.current - 1))
                      }
                      className="w-6 h-6 rounded hover:bg-[#202024] border border-[#323238] text-[#a8a8b3] hover:text-white flex items-center justify-center"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm text-white px-2">{res.current}</span>
                    <button
                      type="button"
                      onClick={() => setResourceCurrent(sheetId, res.id, res.current + 1)}
                      className="w-6 h-6 rounded hover:bg-[#202024] border border-[#323238] text-[#a8a8b3] hover:text-white flex items-center justify-center"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            }

            // Recurso padrão tipo 'bar' ou 'counter' com máximo definido
            return (
              <div
                key={res.id}
                className="rounded-xl border p-3 flex flex-col justify-between space-y-2 transition-colors min-w-0"
                style={{
                  backgroundColor: 'var(--sheet-card-bg, #18181b)',
                  borderColor: 'var(--sheet-card-border, #29292e)',
                  ...palette.borderStyle,
                }}
              >
                {/* Cabeçalho com Nome e Controles */}
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="text-xs font-bold text-[#e1e1e6] uppercase truncate"
                      title={res.label || res.id}
                    >
                      {res.label || res.id}
                    </span>
                    {res.temp > 0 && (
                      <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 shrink-0">
                        +{res.temp}
                      </span>
                    )}
                  </div>

                  {/* Valor Atual / Max com Controles Compactos - e + */}
                  <div className="flex items-center gap-1 font-mono text-xs font-bold shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setResourceCurrent(sheetId, res.id, Math.max(res.min, res.current - 1))
                      }
                      className="w-5 h-5 rounded hover:bg-[#202024] border border-[#323238] text-[#a8a8b3] hover:text-white flex items-center justify-center"
                    >
                      <Minus className="w-3 h-3" />
                    </button>

                    <span className="text-white px-1 whitespace-nowrap">
                      {res.current}
                      <span className="text-[#71717a] font-normal"> / {res.max}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setResourceCurrent(sheetId, res.id, Math.min(res.max, res.current + 1))
                      }
                      className="w-5 h-5 rounded hover:bg-[#202024] border border-[#323238] text-[#a8a8b3] hover:text-white flex items-center justify-center"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Barra Visual */}
                <div
                  className="h-2.5 w-full rounded-full border overflow-hidden transition-colors"
                  style={{
                    backgroundColor: 'var(--sheet-item-bg, #121214)',
                    borderColor: 'var(--sheet-item-border, #29292e)',
                  }}
                >
                  <div
                    className={`h-full transition-all duration-300 ${palette.barClassName}`}
                    style={{ width: `${pct}%`, ...palette.barStyle }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ações de Turno / Economia de Ações + Conversões Compostas (convert) */}
      {(turnSlots.length > 0 || turnConversions.length > 0) && (
        <div
          className="rounded-xl border p-2.5 space-y-2 transition-colors"
          style={{
            backgroundColor: 'var(--sheet-card-bg, #18181b)',
            borderColor: 'var(--sheet-card-border, #29292e)',
          }}
        >
          <div className={`flex ${isMobilePortrait ? 'flex-col gap-2.5' : 'flex-wrap items-center justify-between gap-2'}`}>
            <div className={`flex ${isMobilePortrait ? 'flex-col gap-1.5' : 'flex-wrap items-center gap-2'} w-full sm:w-auto`}>
              <div className="flex items-center justify-between w-full sm:w-auto gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8d8d99]">
                  Ações ({resetPolicyLabel}):
                </span>
                {isMobilePortrait && (
                  <button
                    type="button"
                    onClick={() => resetTurnSlots(sheetId)}
                    title={`Resetar ações (${resetPolicyLabel})`}
                    className="px-2 py-0.5 rounded border border-[#323238] bg-[#121214] hover:bg-[#202024] text-[#a8a8b3] hover:text-white text-[10px] font-medium flex items-center gap-1 transition-colors shrink-0"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Resetar</span>
                  </button>
                )}
              </div>

              <div className={`flex flex-wrap items-center gap-1.5 ${isMobilePortrait ? 'w-full' : ''}`}>
                {turnSlots.map((slot) => {
                  const max = slot.max || 1;
                  const cur = slot.current;
                  const isReady = cur > 0;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() =>
                        setTurnSlotCurrent(sheetId, slot.id, cur > 0 ? cur - 1 : max)
                      }
                      className={`${
                        isMobilePortrait ? 'flex-1 min-w-[95px] justify-between' : ''
                      } px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        isReady
                          ? 'hover:opacity-90'
                          : 'border-[#323238] bg-[#18181b] text-[#71717a] line-through'
                      }`}
                      style={
                        isReady
                          ? {
                              borderColor: 'var(--sheet-accent-border, rgba(130, 87, 229, 0.5))',
                              backgroundColor: 'var(--sheet-accent-subtle, rgba(130, 87, 229, 0.2))',
                              color: 'var(--sheet-accent-text, #c4b5fd)',
                            }
                          : undefined
                      }
                    >
                      <span className="truncate">{slot.label || slot.id}</span>
                      <span className="font-mono text-[10px] font-bold shrink-0">
                        {cur}/{max}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {!isMobilePortrait && (
              <button
                type="button"
                onClick={() => resetTurnSlots(sheetId)}
                title={`Resetar ações (${resetPolicyLabel})`}
                className="px-2 py-1 rounded border border-[#323238] bg-[#121214] hover:bg-[#202024] text-[#a8a8b3] hover:text-white text-[11px] font-medium flex items-center gap-1 transition-colors shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Resetar</span>
              </button>
            )}
          </div>

          {turnConversions.length > 0 && (
            <div className={`pt-2 border-t border-[#29292e] flex ${isMobilePortrait ? 'flex-col gap-1.5' : 'flex-wrap items-center gap-1.5'}`}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#71717a] flex items-center gap-1 mr-1">
                <ArrowRightLeft className="w-3 h-3" />
                Compostas:
              </span>
              {turnConversions.map((conv, idx) => {
                const resolvedCosts = conv.consumes.map((c) => ({
                  amount: c.count,
                  slotId: c.slotId,
                  targetSlot: resolveTurnSlot(c.slotId),
                }));
                const canAfford =
                  resolvedCosts.length > 0 &&
                  resolvedCosts.every(
                    (rc) => rc.targetSlot && rc.targetSlot.current >= rc.amount,
                  );
                const costSummary = resolvedCosts
                  .map(
                    (rc) =>
                      `${rc.amount} ${rc.targetSlot?.label || rc.targetSlot?.id || rc.slotId}`,
                  )
                  .join(' + ');

                return (
                  <button
                    key={`${conv.name}-${idx}`}
                    type="button"
                    disabled={!canAfford}
                    onClick={() => {
                      if (!canAfford) return;
                      applyTurnConversion(
                        sheetId,
                        resolvedCosts.map((rc) => ({
                          slotId: rc.targetSlot!.id,
                          currentAvailable: rc.targetSlot!.current,
                          spend: rc.amount,
                        })),
                      );
                    }}
                    title={
                      canAfford
                        ? `Gastar ${costSummary}`
                        : `Requer disponível: ${costSummary}`
                    }
                    className={`${
                      isMobilePortrait ? 'w-full justify-between' : ''
                    } px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      canAfford
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20'
                        : 'border-[#29292e] border-dashed bg-[#121214] text-[#71717a] opacity-60 cursor-not-allowed line-through'
                    }`}
                  >
                    <span>{conv.name}</span>
                    <span className="font-mono text-[10px] opacity-80">
                      (-{costSummary})
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
