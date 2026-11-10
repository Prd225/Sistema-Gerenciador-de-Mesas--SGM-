import { useState } from 'react';
import { Dices, Search, Lock, Plus, Minus, Trash2, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  isTabMatching,
  type CompiledSheet,
  type EvaluatedSkill,
  type ModuleDisplayStyle,
} from '@/lib/sheet-dsl';
import { useModularSheetStore } from '@/store/useModularSheetStore';
import { formatEvaluatedValue, type OnExecuteRoll } from './types';

interface SkillsSectionProps {
  sheetId?: string;
  sheet: CompiledSheet;
  onExecuteRoll: OnExecuteRoll;
  activeTab?: string;
  displayOverride?: ModuleDisplayStyle;
  blockId?: string;
  titleOverride?: string;
  cols?: number;
  isTall?: boolean;
  isEditMode?: boolean;
}

export function SkillsSection({
  sheetId,
  sheet,
  onExecuteRoll,
  activeTab,
  displayOverride,
  blockId,
  titleOverride,
  cols,
  isTall = false,
  isEditMode = false,
}: SkillsSectionProps) {
  const addSkillItem = useModularSheetStore((s) => s.addSkillItem);
  const updateSkillBonus = useModularSheetStore((s) => s.updateSkillBonus);
  const removeSkillItem = useModularSheetStore((s) => s.removeSkillItem);

  const [search, setSearch] = useState('');
  const [attrFilter, setAttrFilter] = useState<string>('ALL');
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBaseAttr, setNewBaseAttr] = useState('');
  const [newBonus, setNewBonus] = useState('0');

  const handleAddSkill = () => {
    if (!sheetId || !newName.trim()) return;
    const trimmedBonus = newBonus.trim() || '0';
    const parsedNum = Number(trimmedBonus);
    addSkillItem(sheetId, activeTab, {
      label: newName.trim(),
      baseAttr: newBaseAttr.trim() || undefined,
      bonus: !Number.isNaN(parsedNum) && trimmedBonus !== '' ? parsedNum : trimmedBonus,
    });
    setNewName('');
    setNewBaseAttr('');
    setNewBonus('0');
    setIsAdding(false);
  };

  const skillList = Object.values(sheet.skills).filter(
    (sk) =>
      isTabMatching(sk.tab, activeTab) &&
      (!blockId || sk.blockId === blockId),
  );

  if (skillList.length === 0) return null;

  const skillLayout = sheet.moduleLayouts.find((m) =>
    blockId ? m.id === blockId : m.kind === 'skill',
  );
  const display: ModuleDisplayStyle =
    displayOverride ?? skillLayout?.display ?? 'cards';

  const uniqueAttrs = Array.from(
    new Set(skillList.map((s) => s.baseAttr).filter(Boolean) as string[]),
  );

  const filteredSkills = skillList.filter((sk) => {
    if (attrFilter !== 'ALL' && sk.baseAttr !== attrFilter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      sk.label.toLowerCase().includes(q) ||
      sk.id.toLowerCase().includes(q) ||
      (sk.baseAttr || '').toLowerCase().includes(q)
    );
  });

  const customTitle =
    titleOverride ?? skillLayout?.title ?? sheet.blockTitles.skills;

  const formatSkillDisplay = (sk: EvaluatedSkill, isRollUnder: boolean) => {
    if (sk.rawValue !== undefined) {
      const dieStr = formatEvaluatedValue(sk.rawValue);
      if (sk.bonus !== 0) {
        return sk.bonus > 0 ? `${dieStr}+${sk.bonus}` : `${dieStr}${sk.bonus}`;
      }
      return dieStr;
    }
    return isRollUnder
      ? `${sk.bonus}%`
      : sk.bonus >= 0
        ? `+${sk.bonus}`
        : `${sk.bonus}`;
  };

  const cardsGridStyle: React.CSSProperties =
    display === 'stacked' || (isTall && !cols)
      ? { gridTemplateColumns: '1fr' }
      : cols && cols > 0
        ? { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }
        : { gridTemplateColumns: 'repeat(auto-fit, minmax(205px, 1fr))' };

  return (
    <section
      className={`rounded-xl border p-3 space-y-2.5 transition-colors ${isTall ? 'flex-1 flex flex-col' : ''}`}
      style={{
        backgroundColor: 'var(--sheet-card-bg, #18181b)',
        borderColor: 'var(--sheet-card-border, #29292e)',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        {customTitle ? (
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#a8a8b3] px-0.5 truncate">
            {customTitle}
          </h3>
        ) : (
          <span />
        )}
        {isEditMode && sheetId && (
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
            Perícia
          </button>
        )}
      </div>

      {isEditMode && isAdding && sheetId && (
        <div
          className="rounded-lg border p-2.5 space-y-2 transition-colors"
          style={{
            backgroundColor: 'var(--sheet-item-bg, #121214)',
            borderColor: 'var(--sheet-item-border, #29292e)',
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome da perícia (ex: Furtividade)"
              className="rounded border bg-zinc-950 border-zinc-800 px-2 py-1 text-xs text-white focus:outline-none"
            />
            <input
              type="text"
              value={newBaseAttr}
              onChange={(e) => setNewBaseAttr(e.target.value)}
              placeholder="Atributo base (ex: AGI)"
              className="rounded border bg-zinc-950 border-zinc-800 px-2 py-1 text-xs font-mono text-zinc-200 focus:outline-none"
            />
            <input
              type="number"
              value={newBonus}
              onChange={(e) => setNewBonus(e.target.value)}
              placeholder="Bônus (ex: 5)"
              className="rounded border bg-zinc-950 border-zinc-800 px-2 py-1 text-xs font-mono text-white focus:outline-none"
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
              onClick={handleAddSkill}
              className="px-2.5 py-1 rounded text-[11px] font-bold text-white flex items-center gap-1"
              style={{ backgroundColor: 'var(--sheet-accent, #8257e5)' }}
            >
              <Check className="w-3 h-3" />
              Adicionar
            </button>
          </div>
        </div>
      )}

      {skillList.length > 4 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="w-3.5 h-3.5 text-[#8d8d99] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar..."
              className="h-7 pl-8 text-xs text-[#e1e1e6] border transition-colors"
              style={{
                backgroundColor: 'var(--sheet-item-bg, #121214)',
                borderColor: 'var(--sheet-item-border, #323238)',
              }}
            />
          </div>

          {uniqueAttrs.length > 1 && (
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setAttrFilter('ALL')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${attrFilter === 'ALL'
                  ? 'text-white'
                  : 'border text-[#a8a8b3] hover:text-white'
                  }`}
                style={{
                  backgroundColor: attrFilter === 'ALL' ? 'var(--sheet-accent)' : 'var(--sheet-item-bg, #121214)',
                  borderColor: attrFilter === 'ALL' ? 'var(--sheet-accent)' : 'var(--sheet-item-border, #323238)',
                }}
              >
                Todas
              </button>
              {uniqueAttrs.map((attr) => (
                <button
                  key={attr}
                  type="button"
                  onClick={() => setAttrFilter(attr)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${attrFilter === attr
                    ? 'text-white'
                    : 'border text-[#a8a8b3] hover:text-white'
                    }`}
                  style={{
                    backgroundColor: attrFilter === attr ? 'var(--sheet-accent)' : 'var(--sheet-item-bg, #121214)',
                    borderColor: attrFilter === attr ? 'var(--sheet-accent)' : 'var(--sheet-item-border, #323238)',
                  }}
                >
                  {attr}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {display === 'list' ? (
        <div
          className="rounded-lg border p-2.5 space-y-1.5 transition-colors"
          style={{
            backgroundColor: 'var(--sheet-item-bg, #121214)',
            borderColor: 'var(--sheet-item-border, #29292e)',
          }}
        >
          {filteredSkills.map((sk) => {
            const isRollUnder = sk.rollFormula.includes('<=');
            return (
              <div
                key={sk.id}
                onClick={() =>
                  onExecuteRoll(
                    sk.label,
                    sk.rollFormula,
                    sk.baseAttr ? `Base: ${sk.baseAttr}` : undefined,
                  )
                }
                title={`Rolar ${sk.rollFormula}`}
                className="group cursor-pointer flex items-baseline justify-between gap-2 px-1.5 py-0.5 rounded hover:bg-zinc-800/60 transition-colors"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-semibold text-[#e1e1e6] truncate leading-snug" title={sk.label}>
                    {sk.label}
                  </span>
                  {sk.baseAttr && (
                    <span className="text-[10px] font-mono text-[#71717a] shrink-0">
                      ({sk.baseAttr})
                    </span>
                  )}
                </div>
                <span className="flex-1 border-b border-dotted border-zinc-800 mx-1 min-w-[12px]" />
                <div className="flex items-center gap-1.5 shrink-0 pl-1">
                  <span className="text-xs font-black font-mono text-white whitespace-nowrap">
                    {formatSkillDisplay(sk, isRollUnder)}
                  </span>
                  <Dices className="w-3.5 h-3.5 text-[#71717a] group-hover:text-[var(--sheet-accent-text)] transition-colors rollable-dice-icon shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      ) : display === 'divided' ? (
        <div
          className="rounded-lg border divide-y divide-[var(--sheet-item-border)] transition-colors"
          style={{
            backgroundColor: 'var(--sheet-item-bg, #121214)',
            borderColor: 'var(--sheet-item-border, #29292e)',
          }}
        >
          {filteredSkills.map((sk) => {
            const isRollUnder = sk.rollFormula.includes('<=');
            return (
              <div
                key={sk.id}
                onClick={() =>
                  onExecuteRoll(
                    sk.label,
                    sk.rollFormula,
                    sk.baseAttr ? `Base: ${sk.baseAttr}` : undefined,
                  )
                }
                title={`Rolar ${sk.rollFormula}`}
                className="group cursor-pointer px-3 py-2 flex items-center justify-between gap-2 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className="text-xs font-semibold text-[#e1e1e6] truncate leading-snug" title={sk.label}>
                    {sk.label}
                  </span>
                  {sk.baseAttr && (
                    <span className="text-[10px] font-mono text-[#71717a] shrink-0">
                      ({sk.baseAttr})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 pl-1.5">
                  <span className="text-sm font-black font-mono text-white whitespace-nowrap">
                    {formatSkillDisplay(sk, isRollUnder)}
                  </span>
                  <Dices className="w-3.5 h-3.5 text-[#71717a] group-hover:text-[var(--sheet-accent-text)] transition-colors shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="grid gap-1.5 content-start"
          style={cardsGridStyle}
        >
          {filteredSkills.map((sk) => {
            const childrenEntries = Object.entries(sk.children);
            const isRollUnder = sk.rollFormula.includes('<=');

            return (
              <div
                key={sk.id}
                onClick={() =>
                  onExecuteRoll(
                    sk.label,
                    sk.rollFormula,
                    sk.baseAttr ? `Base: ${sk.baseAttr}` : undefined,
                  )
                }
                title={`Rolar ${sk.rollFormula}`}
                className="group cursor-pointer rounded-lg border hover:border-[var(--sheet-accent)] px-3 py-2 flex items-center justify-between gap-2 transition-all rollable-interactive min-w-0"
                style={{
                  backgroundColor: 'var(--sheet-item-bg, #121214)',
                  borderColor: 'var(--sheet-item-border, #29292e)',
                }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-semibold text-[#e1e1e6] truncate leading-snug" title={sk.label}>
                      {sk.label}
                    </span>
                    {sk.baseAttr && (
                      <span className="text-[10px] font-mono text-[#71717a] shrink-0">
                        ({sk.baseAttr})
                      </span>
                    )}
                    {sk.locked && (
                      <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                    )}
                  </div>

                  {childrenEntries.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                      {childrenEntries.map(([ck, cv]) => (
                        <span
                          key={ck}
                          className="text-[9px] font-mono text-[#8d8d99]"
                        >
                          {ck}:{' '}
                          <strong className="text-[#c4b5fd]">
                            {formatEvaluatedValue(cv)}
                          </strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 pl-1.5">
                  {isEditMode && sheetId && !sk.locked && sk.rawValue === undefined && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateSkillBonus(sheetId, sk.id, sk.bonus - 1);
                      }}
                      className="w-4 h-4 rounded bg-zinc-900 border border-zinc-800 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                      title="Diminuir bônus"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                  )}
                  <span className="text-sm font-black font-mono text-white whitespace-nowrap">
                    {formatSkillDisplay(sk, isRollUnder)}
                  </span>
                  {isEditMode && sheetId && !sk.locked && sk.rawValue === undefined && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateSkillBonus(sheetId, sk.id, sk.bonus + 1);
                      }}
                      className="w-4 h-4 rounded bg-zinc-900 border border-zinc-800 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                      title="Aumentar bônus"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  )}

                  <Dices className="w-3.5 h-3.5 text-[#71717a] group-hover:text-[var(--sheet-accent-text)] transition-colors rollable-dice-icon shrink-0" />
                  {isEditMode && sheetId && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSkillItem(sheetId, sk.id);
                      }}
                      className="p-0.5 rounded hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 transition-colors"
                      title="Remover perícia"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
