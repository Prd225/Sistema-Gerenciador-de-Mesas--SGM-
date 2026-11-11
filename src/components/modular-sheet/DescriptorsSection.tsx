import { useState } from 'react';
import { Eye, ShieldCheck, ShieldAlert, Flame, Sparkles, Tag, Info, Plus, Check, X } from 'lucide-react';
import { useModularSheetStore } from '@/store/useModularSheetStore';
import { isTabMatching, type CompiledSheet } from '@/lib/sheet-dsl';
import { formatEvaluatedValue } from './types';

interface DescriptorsSectionProps {
  sheetId: string;
  sheet: CompiledSheet;
  activeTab?: string;
  blockId?: string;
  titleOverride?: string;
  cols?: number;
  isTall?: boolean;
  isEditMode?: boolean;
  isMobilePortrait?: boolean;
}

export function DescriptorsSection({
  sheetId,
  sheet,
  activeTab,
  blockId,
  titleOverride,
  cols,
  isTall = false,
  isEditMode = false,
  isMobilePortrait = false,
}: DescriptorsSectionProps) {
  const setToggleState = useModularSheetStore((s) => s.setToggleState);
  const addDescriptorItem = useModularSheetStore((s) => s.addDescriptorItem);

  const [isAdding, setIsAdding] = useState(false);
  const [newKind, setNewKind] = useState<'tag' | 'consequence' | 'resistance' | 'immunity' | 'vulnerability' | 'sense'>('tag');
  const [newLabel, setNewLabel] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newEffect, setNewEffect] = useState('');

  const handleAddDescriptor = () => {
    if (!newLabel.trim()) return;
    const numVal = Number(newValue.trim());
    addDescriptorItem(sheetId, {
      kind: newKind,
      label: newLabel.trim(),
      value:
        newValue.trim() === ''
          ? undefined
          : !Number.isNaN(numVal)
            ? numVal
            : newValue.trim(),
      effect: newEffect.trim() || undefined,
    });
    setNewLabel('');
    setNewValue('');
    setNewEffect('');
    setIsAdding(false);
  };

  const visibleDescriptors = sheet.descriptors.filter(
    (d) =>
      isTabMatching(d.tab, activeTab) &&
      (!blockId || d.blockId === blockId),
  );

  if (visibleDescriptors.length === 0) return null;

  // 1. Notas explicativas estáticas (ex: condicoes_info: "Condições ocupam...")
  const infoNotes = visibleDescriptors.filter(
    (d) =>
      d.effectSummaries.length === 0 &&
      typeof d.value === 'string' &&
      (d.value.length > 25 || d.id.includes('info') || d.id.includes('nota')),
  );

  // 2. Modificadores táticos interativos (possuem efeitos que alteram atributos/rolagens ou consequência)
  const interactiveDescs = visibleDescriptors.filter(
    (d) =>
      !infoNotes.some((n) => n.id === d.id) &&
      (d.effectSummaries.length > 0 ||
        d.kind === 'consequence' ||
        (d.hasEffects && d.active !== undefined && d.effectSummaries.length > 0)),
  );

  // 3. Chips estáticos (resistências, sentidos, imunidades, divindades, etc.)
  const staticDescs = visibleDescriptors.filter(
    (d) =>
      !infoNotes.some((n) => n.id === d.id) &&
      !interactiveDescs.some((i) => i.id === d.id),
  );

  const customTitle = titleOverride ?? sheet.blockTitles.descriptors;

  const getBadgeStyle = (kind: string) => {
    switch (kind) {
      case 'resistance':
        return {
          icon: <ShieldCheck className="w-3 h-3 text-sky-400" />,
          cls: 'border-sky-500/40 bg-sky-500/10 text-sky-200',
          prefix: 'RD',
        };
      case 'immunity':
        return {
          icon: <ShieldCheck className="w-3 h-3 text-emerald-400" />,
          cls: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
          prefix: 'Imune',
        };
      case 'vulnerability':
        return {
          icon: <Flame className="w-3 h-3 text-rose-400" />,
          cls: 'border-rose-500/40 bg-rose-500/10 text-rose-200',
          prefix: 'Vuln.',
        };
      case 'sense':
        return {
          icon: <Eye className="w-3 h-3 text-amber-300" />,
          cls: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
          prefix: 'Sentido',
        };
      default:
        return {
          icon: <Tag className="w-3 h-3 text-[#a78bfa]" />,
          cls: 'border-[#323238] bg-[#121214] text-[#e1e1e6]',
          prefix: '',
        };
    }
  };

  return (
    <section
      className={`rounded-xl border p-3 space-y-2.5 transition-colors ${isTall && !isMobilePortrait ? 'flex-1 flex flex-col' : ''
        }`}
      style={{
        backgroundColor: 'var(--sheet-card-bg, #18181b)',
        borderColor: 'var(--sheet-card-border, #29292e)',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        {customTitle ? (
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#a8a8b3] px-0.5 break-words">
            {customTitle}
          </h3>
        ) : (
          <span />
        )}
        {isEditMode && (
          <button
            type="button"
            onClick={() => setIsAdding((v) => !v)}
            className="px-2 py-0.5 rounded border text-[10px] font-bold text-zinc-400 hover:text-white flex items-center gap-1 transition-colors shrink-0"
            style={{
              backgroundColor: 'var(--sheet-item-bg, #121214)',
              borderColor: 'var(--sheet-item-border, #29292e)',
            }}
          >
            <Plus className="w-2.5 h-2.5" />
            Condição
          </button>
        )}
      </div>

      {isEditMode && isAdding && (
        <div
          className="rounded-lg border p-2.5 space-y-2 transition-colors"
          style={{
            backgroundColor: 'var(--sheet-item-bg, #121214)',
            borderColor: 'var(--sheet-item-border, #29292e)',
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <select
              value={newKind}
              onChange={(e) => setNewKind(e.target.value as typeof newKind)}
              className="rounded border bg-zinc-950 border-zinc-800 px-2 py-1 text-xs text-zinc-200 focus:outline-none"
            >
              <option value="tag">Condição / Tag</option>
              <option value="consequence">Consequência</option>
              <option value="resistance">Resistência (RD)</option>
              <option value="immunity">Imunidade</option>
              <option value="vulnerability">Vulnerabilidade</option>
              <option value="sense">Sentido</option>
            </select>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Nome (ex: Exausto)"
              className="rounded border bg-zinc-950 border-zinc-800 px-2 py-1 text-xs text-white focus:outline-none"
            />
            <input
              type="text"
              value={newEffect}
              onChange={(e) => setNewEffect(e.target.value)}
              placeholder="Efeito (ex: STR -= 2)"
              className="rounded border bg-zinc-950 border-zinc-800 px-2 py-1 text-xs font-mono text-zinc-300 focus:outline-none"
            />
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Valor / Nota opcional"
              className="rounded border bg-zinc-950 border-zinc-800 px-2 py-1 text-xs text-zinc-300 focus:outline-none"
            />
          </div>
          <div className="flex items-center justify-end gap-1.5">
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
              onClick={handleAddDescriptor}
              className="px-2.5 py-1 rounded text-[11px] font-bold text-white flex items-center gap-1"
              style={{ backgroundColor: 'var(--sheet-accent, #8257e5)' }}
            >
              <Check className="w-3 h-3" />
              Adicionar
            </button>
          </div>
        </div>
      )}

      {/* Notas Informativas Estáticas */}
      {infoNotes.length > 0 && (
        <div className="space-y-1.5">
          {infoNotes.map((note) => (
            <div
              key={`${note.kind}-${note.id}`}
              className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-xs text-amber-200/90 leading-relaxed flex items-start gap-2"
            >
              <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>{String(note.value || note.label)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Chips Estáticos (Resistências, Sentidos, Imunidades, Divindade, etc.) */}
      {staticDescs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {staticDescs.map((d) => {
            const st = getBadgeStyle(d.kind);
            return (
              <div
                key={`${d.kind}-${d.id}`}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium ${st.cls}`}
              >
                {st.icon}
                {st.prefix && (
                  <span className="text-[10px] uppercase opacity-75 font-bold">
                    {st.prefix}:
                  </span>
                )}
                <span className="font-semibold">{d.label}</span>
                {d.value !== undefined && (
                  <span className="px-1.5 py-0.2 rounded bg-black/30 font-mono font-bold text-[11px]">
                    {formatEvaluatedValue(d.value)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Descritores Interativos / Invocáveis (Aspects, Tags Táticas, Consequências) */}
      {interactiveDescs.length > 0 && (
        <div
          className="grid gap-2 content-start"
          style={
            isMobilePortrait
              ? { gridTemplateColumns: '1fr' }
              : cols && cols > 0
                ? { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }
                : { gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }
          }
        >
          {interactiveDescs.map((d) => {
            const isConsequence = d.kind === 'consequence';
            return (
              <button
                key={`${d.kind}-${d.id}`}
                type="button"
                onClick={() => setToggleState(sheetId, d.id, !d.active)}
                className={`flex items-center justify-between gap-3 p-2.5 rounded-md border text-left transition-all ${d.active
                  ? isConsequence
                    ? 'border-rose-500/60 bg-rose-500/15'
                    : 'border-[var(--sheet-accent)] bg-[var(--sheet-accent-subtle)]'
                  : 'hover:border-[var(--sheet-accent)]'
                  }`}
                style={{
                  backgroundColor: d.active ? undefined : 'var(--sheet-item-bg, #121214)',
                  borderColor: d.active ? undefined : 'var(--sheet-item-border, #29292e)',
                }}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {isConsequence ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-[#ffd700] shrink-0" />
                    )}
                    <span className="text-xs font-bold text-white break-words leading-snug">
                      {d.label}
                    </span>
                    {d.value !== undefined && typeof d.value === 'string' && d.value !== d.label && (
                      <span className="text-xs italic text-[#ffd700] break-words leading-snug">
                        “{d.value}”
                      </span>
                    )}
                  </div>

                  {d.effectSummaries.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {d.effectSummaries.map((eff, idx) => (
                        <span
                          key={idx}
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${d.active
                            ? 'text-[#e1e1e6]'
                            : 'bg-[#202024] text-[#8d8d99]'
                            }`}
                          style={
                            d.active
                              ? { backgroundColor: 'var(--sheet-accent-subtle, rgba(130, 87, 229, 0.3))' }
                              : undefined
                          }
                        >
                          {eff}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase shrink-0 ${d.active
                    ? isConsequence
                      ? 'bg-rose-500 text-white'
                      : 'text-white'
                    : 'bg-[#202024] text-[#8d8d99] border border-[#323238]'
                    }`}
                  style={
                    d.active && !isConsequence
                      ? { backgroundColor: 'var(--sheet-accent, #8257e5)' }
                      : undefined
                  }
                >
                  {d.active ? 'Ativo' : 'Inativo'}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

