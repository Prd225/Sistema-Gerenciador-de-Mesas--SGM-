import { useState } from 'react';
import { Dices, Search, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { isTabMatching, type CompiledSheet, type ModuleDisplayStyle } from '@/lib/sheet-dsl';
import { formatEvaluatedValue, type OnExecuteRoll } from './types';

interface SkillsSectionProps {
  sheet: CompiledSheet;
  onExecuteRoll: OnExecuteRoll;
  activeTab?: string;
  displayOverride?: ModuleDisplayStyle;
}

export function SkillsSection({
  sheet,
  onExecuteRoll,
  activeTab,
  displayOverride,
}: SkillsSectionProps) {
  const [search, setSearch] = useState('');
  const [attrFilter, setAttrFilter] = useState<string>('ALL');

  const skillList = Object.values(sheet.skills).filter((sk) =>
    isTabMatching(sk.tab, activeTab),
  );

  if (skillList.length === 0) return null;

  const skillLayout = sheet.moduleLayouts.find((m) => m.kind === 'skill');
  const display: ModuleDisplayStyle =
    displayOverride ?? skillLayout?.display ?? 'cards';
  const isFullWidth = skillLayout?.placement === 'full';

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

  const customTitle = sheet.blockTitles.skills;

  const formatSkillValue = (bonus: number, isRollUnder: boolean) =>
    isRollUnder ? `${bonus}%` : bonus >= 0 ? `+${bonus}` : `${bonus}`;

  return (
    <section
      className="rounded-xl border p-3 space-y-2.5 h-full transition-colors"
      style={{
        backgroundColor: 'var(--sheet-card-bg, #18181b)',
        borderColor: 'var(--sheet-card-border, #29292e)',
      }}
    >
      {customTitle && (
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#a8a8b3] px-0.5">
          {customTitle}
        </h3>
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
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                  attrFilter === 'ALL'
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
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                    attrFilter === attr
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
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[#e1e1e6]">
                    {sk.label}
                  </span>
                  {sk.baseAttr && (
                    <span className="text-[10px] font-mono text-[#71717a]">
                      ({sk.baseAttr})
                    </span>
                  )}
                </div>
                <span className="flex-1 border-b border-dotted border-zinc-800 mx-1" />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black font-mono text-white">
                    {formatSkillValue(sk.bonus, isRollUnder)}
                  </span>
                  <Dices className="w-3.5 h-3.5 text-[#71717a] group-hover:text-[var(--sheet-accent-text)] transition-colors rollable-dice-icon" />
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
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-semibold text-[#e1e1e6] truncate">
                    {sk.label}
                  </span>
                  {sk.baseAttr && (
                    <span className="text-[10px] font-mono text-[#71717a]">
                      ({sk.baseAttr})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-black font-mono text-white">
                    {formatSkillValue(sk.bonus, isRollUnder)}
                  </span>
                  <Dices className="w-3.5 h-3.5 text-[#71717a] group-hover:text-[var(--sheet-accent-text)] transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className={`grid gap-1.5 ${
            display === 'stacked'
              ? 'grid-cols-1'
              : isFullWidth
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1 md:grid-cols-2'
          }`}
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
                className="group cursor-pointer rounded-lg border hover:border-[var(--sheet-accent)] px-3 py-2 flex items-center justify-between gap-2 transition-all rollable-interactive"
                style={{
                  backgroundColor: 'var(--sheet-item-bg, #121214)',
                  borderColor: 'var(--sheet-item-border, #29292e)',
                }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-[#e1e1e6] truncate">
                      {sk.label}
                    </span>
                    {sk.baseAttr && (
                      <span className="text-[10px] font-mono text-[#71717a]">
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

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-black font-mono text-white">
                    {formatSkillValue(sk.bonus, isRollUnder)}
                  </span>

                  <Dices className="w-3.5 h-3.5 text-[#71717a] group-hover:text-[var(--sheet-accent-text)] transition-colors rollable-dice-icon" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
