import { Plus, Minus, RotateCcw } from 'lucide-react';
import { useModularSheetStore } from '@/store/useModularSheetStore';
import { isTabMatching, type CompiledSheet, type ModuleDisplayStyle } from '@/lib/sheet-dsl';

interface ResourcesTurnSectionProps {
  sheetId: string;
  sheet: CompiledSheet;
  activeTab?: string;
  mode?: 'both' | 'res' | 'turn';
  displayOverride?: ModuleDisplayStyle;
}

function getResourceColorClasses(color?: string, id?: string) {
  const c = (color || '').toLowerCase();
  const upperId = (id || '').toUpperCase();

  if (
    c.includes('red') ||
    c.includes('crimson') ||
    upperId === 'PV' ||
    upperId === 'VIDA' ||
    upperId === 'HARM'
  ) {
    return {
      bar: 'bg-gradient-to-r from-rose-600 to-red-500',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      stroke: '#f43f5e',
    };
  }
  if (
    c.includes('blue') ||
    c.includes('cyan') ||
    upperId === 'PM' ||
    upperId === 'MANA'
  ) {
    return {
      bar: 'bg-gradient-to-r from-blue-600 to-sky-400',
      text: 'text-sky-400',
      border: 'border-sky-500/30',
      stroke: '#38bdf8',
    };
  }
  if (
    c.includes('amber') ||
    c.includes('yellow') ||
    c.includes('gold') ||
    upperId === 'PE'
  ) {
    return {
      bar: 'bg-gradient-to-r from-amber-500 to-yellow-400',
      text: 'text-amber-300',
      border: 'border-amber-500/30',
      stroke: '#fbbf24',
    };
  }
  if (c.includes('purple') || c.includes('violet') || upperId === 'SAN') {
    return {
      bar: 'bg-gradient-to-r from-[#8257e5] to-purple-400',
      text: 'text-[#c4b5fd]',
      border: 'border-[#8257e5]/40',
      stroke: '#a855f7',
    };
  }
  return {
    bar: 'bg-gradient-to-r from-emerald-600 to-teal-400',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    stroke: '#10b981',
  };
}

export function ResourcesTurnSection({
  sheetId,
  sheet,
  activeTab,
  mode = 'both',
  displayOverride,
}: ResourcesTurnSectionProps) {
  const { setResourceCurrent, setTurnSlotCurrent, resetTurnSlots } =
    useModularSheetStore();

  const resList =
    mode === 'turn'
      ? []
      : Object.values(sheet.resources).filter((r) => isTabMatching(r.tab, activeTab));

  const turnSlots = mode === 'res' ? [] : Object.values(sheet.turn.slots);
  const customTitle = mode === 'turn' ? sheet.blockTitles.turn : sheet.blockTitles.resources;
  const resLayout = sheet.moduleLayouts.find((m) => m.kind === 'res');
  const display = displayOverride ?? resLayout?.display ?? 'cards';

  if (resList.length === 0 && turnSlots.length === 0) return null;

  return (
    <div className="space-y-2.5">
      {customTitle && (
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#a8a8b3] px-0.5">
          {customTitle}
        </h3>
      )}

      {/* Grid de Barras e Recursos Centrais */}
      {resList.length > 0 && (
        <div
          className={
            display === 'stacked' || display === 'list' || display === 'divided'
              ? 'flex flex-col gap-2'
              : resLayout?.placement === 'full'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5'
                : 'grid grid-cols-1 sm:grid-cols-2 gap-2.5'
          }
        >
          {resList.map((res) => {
            const palette = getResourceColorClasses(res.color, res.id);
            const maxVal = Math.max(1, res.max);
            const pct = Math.max(0, Math.min(100, Math.round((res.current / maxVal) * 100)));

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
                  className="rounded-xl border p-3 flex flex-col justify-between transition-colors"
                  style={{
                    backgroundColor: 'var(--sheet-card-bg, #18181b)',
                    borderColor: 'var(--sheet-card-border, #29292e)',
                  }}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#e1e1e6] uppercase">
                      {res.label || res.id}
                    </span>
                    <span className="font-mono text-[#8d8d99]">
                      {res.current}/{res.max}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {boxes.map((boxState, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const stateIdx = states.indexOf(boxState);
                          const nextState = states[(stateIdx + 1) % states.length] ?? '.';
                          const nextBoxes = [...boxes];
                          nextBoxes[idx] = nextState;
                          const newCurrent = nextBoxes.filter((b) => b !== (states[0] ?? '.')).length;
                          setResourceCurrent(sheetId, res.id, newCurrent);
                        }}
                        className={`w-7 h-7 rounded border font-mono text-xs font-bold flex items-center justify-center transition-colors ${boxState !== (states[0] ?? '.')
                          ? 'bg-[#8257e5] border-[#996dff] text-white'
                          : 'bg-[#18181b] border-[#323238] text-[#71717a] hover:border-[#8257e5]'
                          }`}
                      >
                        {boxState === (states[0] ?? '.') ? '' : boxState}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }

            // Recurso padrão tipo 'bar' ou 'counter'
            return (
              <div
                key={res.id}
                className={`rounded-xl border ${palette.border} p-3 flex flex-col justify-between space-y-2 transition-colors`}
                style={{
                  backgroundColor: 'var(--sheet-card-bg, #18181b)',
                }}
              >
                {/* Cabeçalho centralizado com Nome e Valor */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#e1e1e6] uppercase">
                      {res.label || res.id}
                    </span>
                    {res.temp > 0 && (
                      <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                        +{res.temp}
                      </span>
                    )}
                  </div>

                  {/* Valor Atual / Max com Controles Compactos - e + */}
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

                {/* Barra Visual */}
                <div
                  className="h-2.5 w-full rounded-full border overflow-hidden transition-colors"
                  style={{
                    backgroundColor: 'var(--sheet-item-bg, #121214)',
                    borderColor: 'var(--sheet-item-border, #29292e)',
                  }}
                >
                  <div
                    className={`h-full transition-all duration-300 ${palette.bar}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ações de Turno / Economia de Ações */}
      {turnSlots.length > 0 && (
        <div
          className="rounded-xl border p-2.5 flex flex-wrap items-center justify-between gap-2 transition-colors"
          style={{
            backgroundColor: 'var(--sheet-card-bg, #18181b)',
            borderColor: 'var(--sheet-card-border, #29292e)',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8d8d99]">
              Ações do Turno:
            </span>

            <div className="flex flex-wrap items-center gap-1.5">
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
                    className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${isReady
                      ? 'border-[#8257e5]/50 bg-[#8257e5]/20 text-[#c4b5fd] hover:bg-[#8257e5]/30'
                      : 'border-[#323238] bg-[#18181b] text-[#71717a] line-through'
                      }`}
                  >
                    <span>{slot.label || slot.id}</span>
                    <span className="font-mono text-[10px] font-bold">
                      {cur}/{max}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => resetTurnSlots(sheetId)}
            title="Resetar ações da rodada"
            className="p-1.5 rounded hover:bg-[#202024] text-[#8d8d99] hover:text-[#e1e1e6] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
