import { useState } from 'react';
import { Box, Lock, AlertTriangle, CheckCircle2, Plus, Minus, Flame, Pencil, Check, X } from 'lucide-react';
import { useModularSheetStore } from '@/store/useModularSheetStore';
import {
  isTabMatching,
  type CompiledSheet,
  type EvaluatedSlotsBlock,
  type EvaluatedSlotItem,
} from '@/lib/sheet-dsl';

interface SlotsSectionProps {
  sheetId: string;
  sheet: CompiledSheet;
  activeTab?: string;
  blockId?: string;
  isTall?: boolean;
  isEditMode?: boolean;
}

export function SlotsSection({
  sheetId,
  sheet,
  activeTab,
  blockId,
  isTall = false,
  isEditMode = false,
}: SlotsSectionProps) {
  const { cycleSlotState, setSlotCurrent } = useModularSheetStore();

  const blocks = sheet.slots
    .map((b, idx) => ({ block: b, originalIdx: idx }))
    .filter(
      ({ block }) =>
        isTabMatching(block.tab, activeTab) &&
        (!blockId || block.id === blockId),
    );

  if (blocks.length === 0) return null;

  return (
    <div className={`space-y-4 ${isTall ? 'flex-1 flex flex-col' : ''}`}>
      {blocks.map(({ block, originalIdx }) => (
        <SlotBlockGrid
          key={block.id}
          block={block}
          blockIndex={originalIdx}
          sheetId={sheetId}
          isTall={isTall}
          isEditMode={isEditMode}
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
  blockIndex,
  sheetId,
  isTall,
  isEditMode,
  onCycleSlot,
  onSetCurrent,
}: {
  block: EvaluatedSlotsBlock;
  blockIndex: number;
  sheetId: string;
  isTall: boolean;
  isEditMode: boolean;
  onCycleSlot: (slot: EvaluatedSlotItem) => void;
  onSetCurrent: (slot: EvaluatedSlotItem, current: number) => void;
}) {
  const addSlotItem = useModularSheetStore((s) => s.addSlotItem);
  const setSlotContent = useModularSheetStore((s) => s.setSlotContent);

  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newMax, setNewMax] = useState('3');
  const [newSpan, setNewSpan] = useState('1');
  const [newIsCond, setNewIsCond] = useState(false);

  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [slotLabelDraft, setSlotLabelDraft] = useState('');
  const [slotContentDraft, setSlotContentDraft] = useState('');

  const cols = Math.max(1, Math.min(6, block.cols || 3));

  const handleConfirmAddSlot = () => {
    if (!newLabel.trim()) return;
    addSlotItem(sheetId, blockIndex, {
      label: newLabel.trim(),
      max: Number(newMax) > 0 ? Number(newMax) : undefined,
      colSpan: Number(newSpan) > 1 ? Number(newSpan) : undefined,
      isCondition: newIsCond,
    });
    setNewLabel('');
    setNewMax('3');
    setNewSpan('1');
    setNewIsCond(false);
    setIsAdding(false);
  };

  return (
    <section
      className={`rounded-xl border p-3 space-y-2.5 transition-colors ${isTall ? 'flex-1 flex flex-col' : ''}`}
      style={{
        backgroundColor: 'var(--sheet-card-bg, #18181b)',
        borderColor: 'var(--sheet-card-border, #29292e)',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#e1e1e6] break-words">
          {block.title || 'Slots'}
        </h4>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-[#8d8d99] font-mono">
            {block.slots.filter((s) => s.state === 'filled').length}/{block.slots.length} Ocupados
          </span>
          {isEditMode && (
            <button
              type="button"
              onClick={() => setIsAdding((v) => !v)}
              className="px-2 py-0.5 rounded border text-[10px] font-bold text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
              style={{
                backgroundColor: 'var(--sheet-item-bg, #121214)',
                borderColor: 'var(--sheet-item-border, #29292e)',
              }}
            >
              <Plus className="w-2.5 h-2.5" />
              Slot
            </button>
          )}
        </div>
      </div>

      {isEditMode && isAdding && (
        <div
          className="rounded-lg border p-2.5 space-y-2 transition-colors"
          style={{
            backgroundColor: 'var(--sheet-item-bg, #121214)',
            borderColor: 'var(--sheet-item-border, #29292e)',
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Item / Slot (ex: Tocha)"
              className="sm:col-span-2 rounded border bg-zinc-950 border-zinc-800 px-2 py-1 text-xs text-white focus:outline-none"
            />
            <input
              type="number"
              value={newMax}
              onChange={(e) => setNewMax(e.target.value)}
              placeholder="Usos (0 = sem usos)"
              className="rounded border bg-zinc-950 border-zinc-800 px-2 py-1 text-xs font-mono text-white focus:outline-none"
            />
            <select
              value={newSpan}
              onChange={(e) => setNewSpan(e.target.value)}
              className="rounded border bg-zinc-950 border-zinc-800 px-2 py-1 text-xs text-zinc-200 focus:outline-none"
            >
              <option value="1">1 Slot</option>
              <option value="2">2 Slots (Pesado)</option>
            </select>
          </div>
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-1.5 text-[11px] text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={newIsCond}
                onChange={(e) => setNewIsCond(e.target.checked)}
                className="rounded border-zinc-700"
              />
              Marcar como Condição
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-2 py-1 rounded border border-zinc-800 bg-zinc-900 text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAddSlot}
                className="px-2.5 py-1 rounded text-[11px] font-bold text-white flex items-center gap-1"
                style={{ backgroundColor: 'var(--sheet-accent, #8257e5)' }}
              >
                <Check className="w-3 h-3" />
                Adicionar
              </button>
            </div>
          </div>
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
          const isCondition = Boolean(slot.isCondition);
          const itemSpan = slot.colSpan && slot.colSpan > 1 ? Math.min(cols, slot.colSpan) : 1;
          const spanClass = itemSpan === 2 ? 'col-span-2' : itemSpan >= 3 ? 'col-span-3' : '';

          return (
            <div
              key={slot.id}
              onClick={() => onCycleSlot(slot)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditingSlotId(editingSlotId === slot.id ? null : slot.id);
                setSlotLabelDraft(slot.label !== slot.id ? slot.label : '');
                setSlotContentDraft(slot.content || '');
              }}
              className={`group relative rounded-lg border p-2.5 flex flex-col justify-between transition-all cursor-pointer select-none min-h-[74px] ${spanClass} ${isDamaged
                ? 'border-rose-500/60 bg-rose-950/20 hover:border-rose-400'
                : isCondition
                  ? 'border-amber-500/50 bg-amber-950/20 hover:border-amber-400'
                  : isLocked
                    ? 'opacity-60 hover:opacity-80'
                    : isFilled
                      ? 'hover:border-[var(--sheet-accent)]'
                      : 'border-dashed hover:border-[var(--sheet-accent)]'
                }`}
              style={{
                backgroundColor:
                  isDamaged || isCondition
                    ? undefined
                    : isLocked || isFilled
                      ? 'var(--sheet-item-bg, #121214)'
                      : 'transparent',
                borderColor:
                  isDamaged || isCondition
                    ? undefined
                    : isFilled
                      ? 'var(--sheet-card-border, #323238)'
                      : 'var(--sheet-card-border, #29292e)',
              }}
            >
              {/* Header do Slot */}
              <div className="flex items-start justify-between gap-1.5 text-[11px]">
                <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                  <span className="font-semibold break-words leading-snug text-[#e1e1e6]">
                    {slot.label !== slot.id ? slot.label : isEmpty ? 'Vazio' : slot.id}
                  </span>
                  {itemSpan > 1 && (
                    <span className="text-[9px] font-mono px-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 shrink-0">
                      2 Slots
                    </span>
                  )}
                  {isCondition && (
                    <span className="text-[9px] uppercase tracking-wider font-extrabold px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                      Condição
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isEditMode && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSlotId(editingSlotId === slot.id ? null : slot.id);
                        setSlotLabelDraft(slot.label !== slot.id ? slot.label : '');
                        setSlotContentDraft(slot.content || '');
                      }}
                      className="p-0.5 rounded bg-zinc-900 border border-zinc-800 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                      title="Editar nome/item do slot"
                    >
                      <Pencil className="w-2.5 h-2.5" />
                    </button>
                  )}
                  {isDamaged && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                  {isCondition && <Flame className="w-3.5 h-3.5 text-amber-400" />}
                  {isLocked && <Lock className="w-3.5 h-3.5 text-[#8d8d99]" />}
                  {isFilled && !isCondition && (
                    <CheckCircle2
                      className="w-3.5 h-3.5"
                      style={{ color: 'var(--sheet-accent-text, #a78bfa)' }}
                    />
                  )}
                  {isEmpty && <Box className="w-3 h-3 text-[#52525b]" />}
                </div>
              </div>

              {editingSlotId === slot.id && (
                <div
                  className="mt-1.5 space-y-1 pt-1.5 border-t border-zinc-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    value={slotLabelDraft}
                    onChange={(e) => setSlotLabelDraft(e.target.value)}
                    placeholder="Nome no slot..."
                    className="w-full rounded bg-zinc-950 border border-zinc-800 px-1.5 py-0.5 text-[11px] text-white focus:outline-none"
                  />
                  <input
                    type="text"
                    value={slotContentDraft}
                    onChange={(e) => setSlotContentDraft(e.target.value)}
                    placeholder="Detalhe (ex: d6)"
                    className="w-full rounded bg-zinc-950 border border-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-300 focus:outline-none"
                  />
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingSlotId(null)}
                      className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSlotContent(
                          sheetId,
                          `${block.id}.${slot.id}`,
                          slotContentDraft.trim() || slotLabelDraft.trim() || slot.id,
                        );
                        setEditingSlotId(null);
                      }}
                      className="px-1.5 py-0.5 rounded bg-emerald-600/30 text-[10px] text-emerald-300"
                    >
                      <Check className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Conteúdo / Descrição do item se existir */}
              {slot.content && slot.content !== slot.label && (
                <div className="text-[10px] text-[#8d8d99] break-words leading-snug mt-0.5">
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

