import { useMemo, useState } from 'react';
import { Lock, Dices, Plus, Minus, Pencil, Check, X } from 'lucide-react';
import {
  isTabMatching,
  type CompiledSheet,
  type EvaluatedStat,
  type ModuleDisplayStyle,
} from '@/lib/sheet-dsl';
import { useModularSheetStore } from '@/store/useModularSheetStore';
import { formatEvaluatedValue, type OnExecuteRoll } from './types';

interface AttributesStatsSectionProps {
  sheetId?: string;
  sheet: CompiledSheet;
  onExecuteRoll: OnExecuteRoll;
  activeTab?: string;
  mode?: 'both' | 'attr' | 'stat';
  displayOverride?: ModuleDisplayStyle;
  isEditMode?: boolean;
}

function buildPyramidRows<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  let cursor = 0;
  let rowSize = 1;
  while (cursor < items.length) {
    rows.push(items.slice(cursor, cursor + rowSize));
    cursor += rowSize;
    rowSize += 1;
  }
  return rows;
}

export function AttributesStatsSection({
  sheetId,
  sheet,
  onExecuteRoll,
  activeTab,
  mode = 'both',
  displayOverride,
  isEditMode = false,
}: AttributesStatsSectionProps) {
  const updateStatBaseValue = useModularSheetStore((s) => s.updateStatBaseValue);
  const addStatOrAttr = useModularSheetStore((s) => s.addStatOrAttr);

  const [editingStatId, setEditingStatId] = useState<string | null>(null);
  const [statValDraft, setStatValDraft] = useState<string>('');
  const [addingKind, setAddingKind] = useState<'attr' | 'stat' | null>(null);
  const [newStatLabel, setNewStatLabel] = useState('');
  const [newStatVal, setNewStatVal] = useState('10');
  const [newStatRoll, setNewStatRoll] = useState('');
  const attrList = useMemo(
    () =>
      mode === 'stat'
        ? []
        : Object.values(sheet.attributes).filter((a) => isTabMatching(a.tab, activeTab)),
    [sheet.attributes, mode, activeTab],
  );

  const statList = useMemo(
    () =>
      mode === 'attr'
        ? []
        : Object.values(sheet.stats).filter((s) => isTabMatching(s.tab, activeTab)),
    [sheet.stats, mode, activeTab],
  );

  const attrGroups = useMemo(() => {
    const groups: Array<{ title?: string; items: EvaluatedStat[] }> = [];
    const map = new Map<string, EvaluatedStat[]>();
    for (const a of attrList) {
      const key = a.blockTitle || sheet.blockTitles.attributes || 'Atributos';
      if (!map.has(key)) {
        map.set(key, []);
        groups.push({ title: key, items: map.get(key)! });
      }
      map.get(key)!.push(a);
    }
    return groups;
  }, [attrList, sheet.blockTitles.attributes]);

  const statGroups = useMemo(() => {
    const groups: Array<{ title?: string; items: EvaluatedStat[] }> = [];
    const map = new Map<string, EvaluatedStat[]>();
    for (const s of statList) {
      const key = s.blockTitle || sheet.blockTitles.stats || 'Status';
      if (!map.has(key)) {
        map.set(key, []);
        groups.push({ title: key, items: map.get(key)! });
      }
      map.get(key)!.push(s);
    }
    return groups;
  }, [statList, sheet.blockTitles.stats]);

  if (attrList.length === 0 && statList.length === 0) return null;

  const attrLayout = sheet.moduleLayouts.find((m) => m.kind === 'attr');
  const statLayout = sheet.moduleLayouts.find((m) => m.kind === 'stat');

  const attrDisplay: ModuleDisplayStyle =
    displayOverride ?? attrLayout?.display ?? 'cards';
  const statDisplay: ModuleDisplayStyle =
    displayOverride ?? statLayout?.display ?? 'cards';

  const renderStatValueColor = (item: EvaluatedStat, defaultClass: string) => {
    const isBuffed =
      typeof item.finalValue === 'number' &&
      typeof item.baseValue === 'number' &&
      item.finalValue > item.baseValue;
    const isDebuffed =
      typeof item.finalValue === 'number' &&
      typeof item.baseValue === 'number' &&
      item.finalValue < item.baseValue;
    if (isBuffed) return 'text-emerald-400';
    if (isDebuffed) return 'text-rose-400';
    return defaultClass;
  };

  const handleStatClick = (item: EvaluatedStat) => {
    if (editingStatId === item.id) return;
    if (item.rollFormula) {
      const displayName = item.label || item.id;
      onExecuteRoll(displayName, item.rollFormula, `Rolagem de ${displayName}`);
    }
  };

  const handleStartEditStat = (e: React.MouseEvent, item: EvaluatedStat) => {
    e.stopPropagation();
    if (!sheetId || item.locked) return;
    setEditingStatId(item.id);
    setStatValDraft(String(item.baseValue));
  };

  const handleCommitStatEdit = (e: React.MouseEvent | React.FormEvent, item: EvaluatedStat) => {
    e.stopPropagation();
    if (sheetId) {
      const trimmed = statValDraft.trim();
      const num = Number(trimmed);
      updateStatBaseValue(
        sheetId,
        item.id,
        trimmed !== '' && !Number.isNaN(num) ? num : trimmed,
      );
    }
    setEditingStatId(null);
  };

  const handleStepStat = (e: React.MouseEvent, item: EvaluatedStat, delta: number) => {
    e.stopPropagation();
    if (!sheetId || item.locked || typeof item.baseValue !== 'number') return;
    updateStatBaseValue(sheetId, item.id, item.baseValue + delta);
  };

  const handleConfirmAddStat = (kind: 'attr' | 'stat') => {
    if (!sheetId || !newStatLabel.trim()) return;
    const rawId = newStatLabel
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .toUpperCase()
      .slice(0, 12);
    const num = Number(newStatVal.trim());
    addStatOrAttr(sheetId, kind, {
      id: rawId || `STAT_${Date.now()}`,
      label: newStatLabel.trim(),
      value: !Number.isNaN(num) && newStatVal.trim() !== '' ? num : newStatVal.trim(),
      roll: newStatRoll.trim() || undefined,
    });
    setNewStatLabel('');
    setNewStatVal('10');
    setNewStatRoll('');
    setAddingKind(null);
  };

  const renderCardItem = (attr: EvaluatedStat, isPrimary: boolean) => {
    const isBuffed =
      typeof attr.finalValue === 'number' &&
      typeof attr.baseValue === 'number' &&
      attr.finalValue > attr.baseValue;
    const isDebuffed =
      typeof attr.finalValue === 'number' &&
      typeof attr.baseValue === 'number' &&
      attr.finalValue < attr.baseValue;

    const hasRoll = Boolean(attr.rollFormula);
    const displayName = attr.label || attr.id;
    const displayVal = attr.displayFraction ?? formatEvaluatedValue(attr.finalValue);

    const isDescriptiveText =
      typeof attr.finalValue === 'string' &&
      (attr.finalValue.length > 20 ||
        attr.id.includes('tipo') ||
        attr.id.includes('desc') ||
        attr.id.includes('nota') ||
        attr.id.includes('info'));

    if (isDescriptiveText) {
      return (
        <div
          key={attr.id}
          className="w-full rounded-xl border p-3 text-xs leading-relaxed transition-colors flex items-start gap-2.5 col-span-full"
          style={{
            backgroundColor: 'var(--sheet-item-bg, #121214)',
            borderColor: 'var(--sheet-item-border, #29292e)',
          }}
        >
          <span className="font-bold uppercase tracking-wider text-zinc-300 shrink-0">
            {displayName}:
          </span>
          <span className="text-zinc-300 italic flex-1 leading-relaxed">
            {typeof attr.finalValue === 'string'
              ? attr.finalValue
              : formatEvaluatedValue(attr.finalValue)}
          </span>
        </div>
      );
    }

    if (!isPrimary) {
      return (
        <div
          key={attr.id}
          onClick={() => handleStatClick(attr)}
          className={`group rounded-lg border px-3 py-2 flex items-center justify-between gap-3 transition-all min-w-0 ${hasRoll ? 'cursor-pointer hover:border-[var(--sheet-accent)] rollable-interactive' : ''
            }`}
          style={{
            backgroundColor: 'var(--sheet-item-bg, #121214)',
            borderColor: 'var(--sheet-item-border, #29292e)',
          }}
        >
          <span
            className="text-xs font-semibold text-[#a8a8b3] break-words leading-snug flex-1 min-w-0"
            title={displayName}
          >
            {displayName}
          </span>
          <div className="flex items-center gap-1.5 shrink-0 pl-1">
            {editingStatId === attr.id ? (
              <div
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  value={statValDraft}
                  onChange={(e) => setStatValDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCommitStatEdit(e, attr);
                    if (e.key === 'Escape') setEditingStatId(null);
                  }}
                  autoFocus
                  className="w-14 bg-zinc-950 border border-zinc-700 rounded px-1.5 py-0.5 text-xs font-mono text-white text-center focus:outline-none"
                />
                <button
                  type="button"
                  onClick={(e) => handleCommitStatEdit(e, attr)}
                  className="p-0.5 rounded bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50"
                >
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                {isEditMode && sheetId && !attr.locked && typeof attr.baseValue === 'number' && !attr.displayFraction && (
                  <button
                    type="button"
                    onClick={(e) => handleStepStat(e, attr, -1)}
                    className="w-4 h-4 rounded bg-zinc-900 border border-zinc-800 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                    title="Diminuir valor"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                )}
                <span
                  onDoubleClick={(e) => handleStartEditStat(e, attr)}
                  className={`font-mono text-sm font-bold ${renderStatValueColor(
                    attr,
                    'text-[#e1e1e6]',
                  )}`}
                  title={sheetId && !attr.locked ? 'Duplo clique para editar valor' : undefined}
                >
                  {displayVal}
                </span>
                {isEditMode && sheetId && !attr.locked && typeof attr.baseValue === 'number' && !attr.displayFraction && (
                  <button
                    type="button"
                    onClick={(e) => handleStepStat(e, attr, 1)}
                    className="w-4 h-4 rounded bg-zinc-900 border border-zinc-800 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                    title="Aumentar valor"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                )}
                {isEditMode && sheetId && !attr.locked && (
                  <button
                    type="button"
                    onClick={(e) => handleStartEditStat(e, attr)}
                    className="w-4 h-4 rounded bg-zinc-900 border border-zinc-800 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                    title="Editar valor"
                  >
                    <Pencil className="w-2.5 h-2.5" />
                  </button>
                )}
              </>
            )}
            {hasRoll && (
              <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                <Dices className="w-3.5 h-3.5 text-[#71717a] group-hover:text-[var(--sheet-accent-text)] rollable-dice-icon shrink-0" />
              </span>
            )}
          </div>
        </div>
      );
    }

    return (
      <div
        key={attr.id}
        onClick={() => handleStatClick(attr)}
        className={`group relative rounded-xl border p-2.5 sm:p-3 flex flex-col items-center justify-between transition-all min-w-[96px] ${hasRoll ? 'cursor-pointer hover:border-[var(--sheet-accent)] rollable-interactive' : ''
          } ${attr.locked
            ? 'border-amber-500/50'
            : isBuffed
              ? 'border-emerald-500/40'
              : isDebuffed
                ? 'border-rose-500/40'
                : ''
          }`}
        style={{
          backgroundColor: 'var(--sheet-card-bg, #18181b)',
          borderColor:
            attr.locked || isBuffed || isDebuffed
              ? undefined
              : 'var(--sheet-card-border, #29292e)',
        }}
      >
        {/* Header seguro com ícones nas extremidades e texto no centro sem cortar */}
        <div className="w-full flex items-start justify-between gap-1 mb-1">
          <div className="w-4 h-4 flex items-center justify-center shrink-0">
            {attr.locked && (
              <span title="Valor Travado (:! / !lock)" className="text-amber-400">
                <Lock className="w-3 h-3" />
              </span>
            )}
          </div>

          <span
            className="text-xs font-semibold tracking-wide text-center uppercase break-words leading-tight flex-1 min-w-0 px-0.5"
            style={{ color: 'var(--sheet-accent-text, #c4b5fd)' }}
            title={displayName}
          >
            {displayName}
          </span>

          <div className="w-4 h-4 flex items-center justify-center shrink-0">
            {hasRoll && (
              <span
                title={`Rolar: ${attr.rollFormula}`}
                className="text-[#71717a] group-hover:text-[var(--sheet-accent-text)] transition-colors flex items-center justify-center"
              >
                <Dices className="w-3.5 h-3.5 rollable-dice-icon shrink-0" />
              </span>
            )}
          </div>
        </div>

        {editingStatId === attr.id ? (
          <div
            className="my-1 flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              value={statValDraft}
              onChange={(e) => setStatValDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCommitStatEdit(e, attr);
                if (e.key === 'Escape') setEditingStatId(null);
              }}
              autoFocus
              className="w-16 bg-zinc-950 border border-zinc-700 rounded px-1.5 py-0.5 text-sm font-mono font-bold text-white text-center focus:outline-none"
            />
            <button
              type="button"
              onClick={(e) => handleCommitStatEdit(e, attr)}
              className="p-1 rounded bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50"
            >
              <Check className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="mt-1 flex items-center justify-center gap-1.5 w-full">
            {isEditMode && sheetId && !attr.locked && typeof attr.baseValue === 'number' && !attr.displayFraction && (
              <button
                type="button"
                onClick={(e) => handleStepStat(e, attr, -1)}
                className="w-5 h-5 rounded border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                title="Diminuir atributo"
              >
                <Minus className="w-3 h-3" />
              </button>
            )}
            <span
              onDoubleClick={(e) => handleStartEditStat(e, attr)}
              className={`font-mono text-2xl font-black text-center ${renderStatValueColor(
                attr,
                'text-white',
              )}`}
              title={sheetId && !attr.locked ? 'Duplo clique para editar valor' : undefined}
            >
              {displayVal}
            </span>
            {isEditMode && sheetId && !attr.locked && typeof attr.baseValue === 'number' && !attr.displayFraction && (
              <button
                type="button"
                onClick={(e) => handleStepStat(e, attr, 1)}
                className="w-5 h-5 rounded border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                title="Aumentar atributo"
              >
                <Plus className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {Object.keys(attr.children).length > 0 && (
          <div className="flex flex-col items-center gap-1 mt-1.5 w-full">
            {Object.entries(attr.children).map(([k, v]) => {
              const isDesc =
                k.toLowerCase() === 'desc' ||
                k.toLowerCase() === 'descricao' ||
                k.toLowerCase() === 'info';
              if (isDesc) {
                return (
                  <p
                    key={k}
                    className="text-[10px] text-zinc-400 text-center leading-snug break-words px-1 italic"
                  >
                    {String(v)}
                  </p>
                );
              }
              return (
                <span key={k} className="text-[10px] font-mono text-zinc-400">
                  {k}: {formatEvaluatedValue(v)}
                </span>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderItemsByDisplay = (
    items: EvaluatedStat[],
    display: ModuleDisplayStyle,
    isPrimary: boolean,
  ) => {
    // 1. MODO LISTA (Ex: Físico ............... 4)
    if (display === 'list') {
      return (
        <div
          className="rounded-xl border p-3 space-y-2 transition-colors"
          style={{
            backgroundColor: 'var(--sheet-card-bg, #18181b)',
            borderColor: 'var(--sheet-card-border, #29292e)',
          }}
        >
          {items.map((item) => {
            const hasRoll = Boolean(item.rollFormula);
            const displayName = item.label || item.id;
            return (
              <div
                key={item.id}
                onClick={() => handleStatClick(item)}
                className={`group flex items-baseline justify-between gap-2 py-0.5 rounded px-1.5 transition-colors ${hasRoll ? 'cursor-pointer hover:bg-white/5' : ''
                  }`}
              >
                <span className="text-xs font-semibold text-zinc-200">
                  {displayName}
                </span>
                <span
                  className="flex-1 border-b border-dotted mx-1"
                  style={{ borderColor: 'var(--sheet-card-border, #29292e)' }}
                />
                <div className="flex items-center gap-1.5">
                  {Object.keys(item.children).length > 0 && (
                    <span className="text-[10px] font-mono text-zinc-500">
                      (
                      {Object.entries(item.children)
                        .map(([k, v]) => `${k}: ${formatEvaluatedValue(v)}`)
                        .join(', ')}
                      )
                    </span>
                  )}
                  <span
                    className={`font-mono text-sm font-black ${renderStatValueColor(
                      item,
                      'text-white',
                    )}`}
                  >
                    {formatEvaluatedValue(item.finalValue)}
                  </span>
                  {hasRoll && (
                    <Dices className="w-3.5 h-3.5 text-zinc-500 group-hover:text-violet-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // 2. MODO PIRÂMIDE (Empilhados centralizados: 1 no topo, 2 no meio, 3 na base...)
    if (display === 'pyramid') {
      const rows = buildPyramidRows(items);
      return (
        <div className="flex flex-col items-center gap-2.5">
          {rows.map((row, rIdx) => (
            <div
              key={rIdx}
              className="flex flex-wrap items-center justify-center gap-2.5 w-full"
            >
              {row.map((item) => (
                <div key={item.id} className="w-28 sm:w-32">
                  {renderCardItem(item, true)}
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    }

    // 3. MODO DIVISÓRIAS / PARÁGRAFO (Separados por linhas divisórias limpas)
    if (display === 'divided') {
      return (
        <div
          className="rounded-xl border divide-y divide-[var(--sheet-card-border)] transition-colors"
          style={{
            backgroundColor: 'var(--sheet-card-bg, #18181b)',
            borderColor: 'var(--sheet-card-border, #29292e)',
          }}
        >
          {items.map((item) => {
            const hasRoll = Boolean(item.rollFormula);
            const displayName = item.label || item.id;
            return (
              <div
                key={item.id}
                onClick={() => handleStatClick(item)}
                className={`group px-3.5 py-2.5 flex items-center justify-between gap-3 transition-colors ${hasRoll ? 'cursor-pointer hover:bg-white/5' : ''
                  }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="text-xs font-bold uppercase tracking-wide break-words"
                    style={{ color: 'var(--sheet-accent-text, #c4b5fd)' }}
                  >
                    {displayName}
                  </span>
                  {Object.keys(item.children).length > 0 && (
                    <span className="text-[10px] font-mono text-zinc-500">
                      {Object.entries(item.children)
                        .map(([k, v]) => `${k}: ${formatEvaluatedValue(v)}`)
                        .join(' · ')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`font-mono text-base font-black ${renderStatValueColor(
                      item,
                      'text-white',
                    )}`}
                  >
                    {formatEvaluatedValue(item.finalValue)}
                  </span>
                  {hasRoll && (
                    <Dices className="w-3.5 h-3.5 text-zinc-500 group-hover:text-violet-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // 4. MODO EMPILHADO VERTICAL (stacked)
    if (display === 'stacked') {
      return (
        <div className="flex flex-col gap-2">
          {items.map((item) => renderCardItem(item, false))}
        </div>
      );
    }

    // 5. PADRÃO: MODO CARDS
    if (!isPrimary) {
      const textNotes = items.filter(
        (s) =>
          typeof s.finalValue === 'string' &&
          (s.finalValue.length > 20 ||
            s.id.includes('tipo') ||
            s.id.includes('desc') ||
            s.id.includes('nota') ||
            s.id.includes('info')),
      );
      const normalStats = items.filter(
        (s) =>
          !(
            typeof s.finalValue === 'string' &&
            (s.finalValue.length > 20 ||
              s.id.includes('tipo') ||
              s.id.includes('desc') ||
              s.id.includes('nota') ||
              s.id.includes('info'))
          ),
      );

      return (
        <div className="space-y-2">
          {textNotes.length > 0 && (
            <div className="space-y-1.5 w-full">
              {textNotes.map((stat) => renderCardItem(stat, false))}
            </div>
          )}

          {normalStats.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {normalStats.map((stat) => (
                <div key={stat.id} className="flex-1 min-w-[150px]">
                  {renderCardItem(stat, false)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        className="grid gap-2.5"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        }}
      >
        {items.map((attr) => renderCardItem(attr, true))}
      </div>
    );
  };

  const renderAddForm = (kind: 'attr' | 'stat') => {
    if (addingKind !== kind) return null;
    return (
      <div
        className="rounded-xl border p-2.5 space-y-2 transition-colors"
        style={{
          backgroundColor: 'var(--sheet-item-bg, #121214)',
          borderColor: 'var(--sheet-item-border, #29292e)',
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            type="text"
            value={newStatLabel}
            onChange={(e) => setNewStatLabel(e.target.value)}
            placeholder={kind === 'attr' ? 'Nome (ex: Sorte)' : 'Nome (ex: Defesa)'}
            className="rounded-lg border bg-zinc-950 border-zinc-800 px-2.5 py-1 text-xs text-white focus:outline-none"
          />
          <input
            type="text"
            value={newStatVal}
            onChange={(e) => setNewStatVal(e.target.value)}
            placeholder="Valor inicial (ex: 10)"
            className="rounded-lg border bg-zinc-950 border-zinc-800 px-2.5 py-1 text-xs font-mono text-white focus:outline-none"
          />
          <input
            type="text"
            value={newStatRoll}
            onChange={(e) => setNewStatRoll(e.target.value)}
            placeholder="Fórmula (opcional, ex: 1d20 + self)"
            className="rounded-lg border bg-zinc-950 border-zinc-800 px-2.5 py-1 text-xs font-mono text-zinc-300 focus:outline-none"
          />
        </div>
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => setAddingKind(null)}
            className="px-2 py-1 rounded border border-zinc-800 bg-zinc-900 text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => handleConfirmAddStat(kind)}
            className="px-2.5 py-1 rounded text-[11px] font-bold text-white flex items-center gap-1"
            style={{ backgroundColor: 'var(--sheet-accent, #8257e5)' }}
          >
            <Check className="w-3 h-3" />
            Adicionar
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {attrGroups.map((group, idx) => (
        <section key={`attr_grp_${idx}`} className="space-y-2">
          <div className="flex items-center justify-between gap-2 px-0.5">
            {group.title ? (
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#a8a8b3]">
                {group.title}
              </h3>
            ) : (
              <span />
            )}
            {isEditMode && sheetId && idx === 0 && (
              <button
                type="button"
                onClick={() => setAddingKind(addingKind === 'attr' ? null : 'attr')}
                className="px-2 py-0.5 rounded border text-[10px] font-bold text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                style={{
                  backgroundColor: 'var(--sheet-item-bg, #121214)',
                  borderColor: 'var(--sheet-item-border, #29292e)',
                }}
              >
                <Plus className="w-2.5 h-2.5" />
                Atributo
              </button>
            )}
          </div>
          {isEditMode && idx === 0 && renderAddForm('attr')}
          {renderItemsByDisplay(group.items, attrDisplay, true)}
        </section>
      ))}

      {statGroups.map((group, idx) => (
        <section key={`stat_grp_${idx}`} className="space-y-2">
          <div className="flex items-center justify-between gap-2 px-0.5">
            {group.title ? (
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#8d8d99]">
                {group.title}
              </h4>
            ) : (
              <span />
            )}
            {isEditMode && sheetId && idx === 0 && (
              <button
                type="button"
                onClick={() => setAddingKind(addingKind === 'stat' ? null : 'stat')}
                className="px-2 py-0.5 rounded border text-[10px] font-bold text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                style={{
                  backgroundColor: 'var(--sheet-item-bg, #121214)',
                  borderColor: 'var(--sheet-item-border, #29292e)',
                }}
              >
                <Plus className="w-2.5 h-2.5" />
                Valor
              </button>
            )}
          </div>
          {isEditMode && idx === 0 && renderAddForm('stat')}
          {renderItemsByDisplay(group.items, statDisplay, false)}
        </section>
      ))}
    </div>
  );
}
