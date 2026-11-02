import { Box, Lock, AlertTriangle, CheckCircle2, Plus, Minus } from 'lucide-react';
import { useModularSheetStore } from '@/store/useModularSheetStore';
import type { CompiledSheet, EvaluatedSlotsBlock, EvaluatedSlotItem } from '@/lib/sheet-dsl';

interface SlotsSectionProps {
  sheetId: string;
  sheet: CompiledSheet;
  activeTab?: string;
}

export function SlotsSection({ sheetId, sheet, activeTab }: SlotsSectionProps) {
  const { cycleSlotState, setSlotCurrent } = useModularSheetStore();

  const blocks = sheet.slots.filter((b) => {
    if (!activeTab || activeTab === 'Geral' || activeTab === 'Principal') return true;
    return !b.tab || b.tab === activeTab;
  });

  if (blocks.length === 0) return null;

  return (
    <div className="space-y-4">
      {blocks.map((block) => (
        <SlotBlockGrid
          key={block.id}
          block={block}
          sheetId={sheetId}
          onCycleSlot={(slot) => cycleSlotState(sheetId, `${block.id}.${slot.id}`, slot.state)}
          onSetCurrent={(slot, current) =>
            setSlotCurrent(sheetId, `${block.id}.${slot.id}`, current)
          }
        />
      ))}
    </div>
  );
}

function SlotBlockGrid({
  block,
  onCycleSlot,
  onSetCurrent,
}: {
  block: EvaluatedSlotsBlock;
  sheetId: string;
  onCycleSlot: (slot: EvaluatedSlotItem) => void;
  onSetCurrent: (slot: EvaluatedSlotItem, current: number) => void;
}) {
  const cols = Math.max(1, Math.min(6, block.cols || 3));

  return (
    <section
      className="rounded-xl border p-3 space-y-2.5 transition-colors"
      style={{
        backgroundColor: 'var(--sheet-card-bg, #18181b)',
        borderColor: 'var(--sheet-card-border, #29292e)',
      }}
    >
      {block.title && (
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#e1e1e6]">
            {block.title}
          </h4>
          <span className="text-[10px] text-[#8d8d99] font-mono">
            {block.slots.filter((s) => s.state === 'filled').length}/{block.slots.length} Ocupados
          </span>
        </div>
      )}

      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        }}
      >
        {block.slots.map((slot) => {
          const isFilled = slot.state === 'filled';
          const isDamaged = slot.state === 'damaged';
          const isLocked = slot.state === 'locked';
          const isEmpty = slot.state === 'empty';

          return (
            <div
              key={slot.id}
              onClick={() => onCycleSlot(slot)}
              className={`group relative rounded-lg border p-2.5 flex flex-col justify-between transition-all cursor-pointer select-none min-h-[74px] ${
                isDamaged
                  ? 'border-rose-500/60 bg-rose-950/20 hover:border-rose-400'
                  : isLocked
                    ? 'opacity-60 hover:opacity-80'
                    : isFilled
                      ? 'hover:border-[var(--sheet-accent)]'
                      : 'border-dashed hover:border-[var(--sheet-accent)]'
              }`}
              style={{
                backgroundColor: isDamaged
                  ? undefined
                  : isLocked
                    ? 'var(--sheet-item-bg, #121214)'
                    : isFilled
                      ? 'var(--sheet-item-bg, #121214)'
                      : 'transparent',
                borderColor: isDamaged
                  ? undefined
                  : isFilled
                    ? 'var(--sheet-card-border, #323238)'
                    : 'var(--sheet-card-border, #29292e)',
              }}
            >
              {/* Header do Slot */}
              <div className="flex items-center justify-between gap-1 text-[11px]">
                <span className="font-semibold truncate text-[#e1e1e6]">
                  {slot.label !== slot.id ? slot.label : isEmpty ? 'Vazio' : slot.id}
                </span>

                <span className="shrink-0">
                  {isDamaged && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                  {isLocked && <Lock className="w-3.5 h-3.5 text-[#8d8d99]" />}
                  {isFilled && (
                    <CheckCircle2
                      className="w-3.5 h-3.5"
                      style={{ color: 'var(--sheet-accent-text, #a78bfa)' }}
                    />
                  )}
                  {isEmpty && <Box className="w-3 h-3 text-[#52525b]" />}
                </span>
              </div>

              {/* Conteúdo / Descrição do item se existir */}
              {slot.content && slot.content !== slot.label && (
                <div className="text-[10px] text-[#8d8d99] truncate mt-0.5">
                  {slot.content}
                </div>
              )}

              {/* Barra / Pontos de Segmento se tiver max */}
              {slot.max !== undefined && slot.max > 0 ? (
                <div
                  className="mt-2 pt-1 border-t border-[#29292e] flex items-center justify-between"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1">
                    {Array.from({ length: slot.max }).map((_, i) => (
                      <span
                        key={i}
                        onClick={() => onSetCurrent(slot, i + 1 === slot.current ? i : i + 1)}
                        className={`w-2.5 h-2.5 rounded-full border cursor-pointer transition-colors ${i < (slot.current ?? 0)
                            ? 'bg-[#8257e5] border-[#996dff]'
                            : 'bg-[#202024] border-[#323238] hover:border-[#8257e5]'
                          }`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-0.5 text-[10px] font-mono text-[#a8a8b3]">
                    <button
                      type="button"
                      onClick={() => onSetCurrent(slot, Math.max(0, (slot.current ?? 0) - 1))}
                      className="p-0.5 rounded hover:bg-[#29292e] text-[#8d8d99] hover:text-white"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span>{slot.current ?? 0}/{slot.max}</span>
                    <button
                      type="button"
                      onClick={() => onSetCurrent(slot, Math.min(slot.max ?? 1, (slot.current ?? 0) + 1))}
                      className="p-0.5 rounded hover:bg-[#29292e] text-[#8d8d99] hover:text-white"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-auto pt-1 flex items-center justify-between text-[9px] text-[#71717a] font-mono uppercase tracking-wider">
                  <span>{isDamaged ? 'Danificado' : isLocked ? 'Bloqueado' : isFilled ? 'Ocupado' : 'Disponível'}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

