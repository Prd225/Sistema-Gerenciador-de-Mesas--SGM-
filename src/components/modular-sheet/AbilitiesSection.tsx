import { useState } from 'react';
import {
  Wand2,
  Swords,
  Sparkles,
  Compass,
  Dices,
  Flame,
  Zap,
  CheckSquare,
  Square,
  Power,
} from 'lucide-react';
import { useModularSheetStore } from '@/store/useModularSheetStore';
import {
  isTabMatching,
  type AbilityCategory,
  type CompiledSheet,
  type EvaluatedAbility,
} from '@/lib/sheet-dsl';
import type { OnExecuteRoll } from './types';

interface AbilitiesSectionProps {
  sheetId: string;
  sheet: CompiledSheet;
  onExecuteRoll: OnExecuteRoll;
  activeTab?: string;
}

const CATEGORY_META: Record<
  AbilityCategory,
  { label: string; badgeCls: string; icon: React.ReactNode }
> = {
  ability: {
    label: 'Habilidade',
    badgeCls: 'border-[#8257e5]/50 bg-[#8257e5]/15 text-[#c4b5fd]',
    icon: <Sparkles className="w-3 h-3" />,
  },
  action: {
    label: 'Ação',
    badgeCls: 'border-amber-500/50 bg-amber-500/15 text-amber-300',
    icon: <Swords className="w-3 h-3" />,
  },
  spell: {
    label: 'Magia',
    badgeCls: 'border-sky-500/50 bg-sky-500/15 text-sky-300',
    icon: <Wand2 className="w-3 h-3" />,
  },
  move: {
    label: 'Movimento',
    badgeCls: 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300',
    icon: <Compass className="w-3 h-3" />,
  },
};

export function AbilitiesSection({
  sheetId,
  sheet,
  onExecuteRoll,
  activeTab,
}: AbilitiesSectionProps) {
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | AbilityCategory>('ALL');
  const [selectedEnhs, setSelectedEnhs] = useState<Record<string, string[]>>({});
  const [checkedChoices, setCheckedChoices] = useState<Record<string, boolean>>({});

  const setToggleState = useModularSheetStore((s) => s.setToggleState);
  const setResourceCurrent = useModularSheetStore((s) => s.setResourceCurrent);

  const tabAbilities = sheet.abilities.filter((a) =>
    isTabMatching(a.tab, activeTab),
  );

  if (tabAbilities.length === 0) return null;

  const presentCategories = Array.from(
    new Set(tabAbilities.map((a) => a.category)),
  );

  const visibleAbilities = tabAbilities.filter(
    (a) => categoryFilter === 'ALL' || a.category === categoryFilter,
  );

  const toggleEnhancement = (abilityId: string, enhId: string) => {
    setSelectedEnhs((prev) => {
      const cur = prev[abilityId] ?? [];
      const next = cur.includes(enhId)
        ? cur.filter((id) => id !== enhId)
        : [...cur, enhId];
      return { ...prev, [abilityId]: next };
    });
  };

  const findSheetResource = (resName: string) => {
    const target = resName.toLowerCase();
    return Object.values(sheet.resources).find(
      (r) =>
        r.id.toLowerCase() === target || r.label.toLowerCase() === target,
    );
  };

  const renderAbilityCard = (ab: EvaluatedAbility) => {
    const catMeta = CATEGORY_META[ab.category] ?? CATEGORY_META.ability;
    const activeEnhIds = selectedEnhs[ab.id] ?? [];
    const activeEnhObjs = ab.enhancements.filter((e) =>
      activeEnhIds.includes(e.id),
    );

    const baseCostAmount = ab.cost?.amount ?? 0;
    const enhCostSum = activeEnhObjs.reduce((acc, e) => acc + (e.cost ?? 0), 0);
    const totalCost = baseCostAmount + enhCostSum;
    const costResourceName =
      ab.cost?.resource ?? activeEnhObjs[0]?.resource ?? 'PE';
    const matchedResource =
      totalCost > 0 ? findSheetResource(costResourceName) : undefined;
    const canAffordResource = matchedResource
      ? matchedResource.current >= totalCost
      : true;

    // Se algum aprimoramento selecionado sobrescrever a fórmula de dano, usa a última selecionada
    const enhWithDamage = [...activeEnhObjs].reverse().find((e) => e.damage);
    const effectiveDamageFormula = enhWithDamage?.damage ?? ab.damageFormula;

    return (
      <div
        key={ab.id}
        className={`rounded-lg border p-3 space-y-2.5 transition-all ${ab.isToggleable && ab.active
            ? 'border-[var(--sheet-accent)]'
            : ''
          }`}
        style={{
          backgroundColor: 'var(--sheet-item-bg, #121214)',
          borderColor: ab.isToggleable && ab.active ? undefined : 'var(--sheet-item-border, #29292e)',
        }}
      >
        {/* Linha Superior: Nome, Categoria, Tipo de Ação e Toggle/Custo */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-bold text-white">{ab.label}</span>

              {ab.actionType && (
                <span className="px-1.5 py-0.5 rounded bg-[#202024] border border-[#323238] text-[10px] font-semibold text-amber-300">
                  {ab.actionType}
                </span>
              )}

              {ab.range && (
                <span className="px-1.5 py-0.5 rounded bg-[#202024] text-[10px] text-[#a8a8b3]">
                  Alcance: {ab.range}
                </span>
              )}

              {ab.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-mono text-[#a78bfa]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Botão Toggle (when active) e/ou Gasto de Recurso */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {ab.isToggleable && (
              <button
                type="button"
                onClick={() => setToggleState(sheetId, ab.id, !ab.active)}
                className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-md border text-xs font-bold transition-colors ${ab.active
                    ? 'border-[#8257e5] bg-[#8257e5] text-white'
                    : 'border-[#323238] bg-[#202024] text-[#a8a8b3] hover:text-white'
                  }`}
              >
                <Power className="w-3 h-3" />
                {ab.active ? 'Efeito Ativo' : 'Ativar Efeito'}
              </button>
            )}

            {totalCost > 0 && (
              <button
                type="button"
                disabled={matchedResource ? !canAffordResource : false}
                onClick={() => {
                  if (!matchedResource) return;
                  setResourceCurrent(
                    sheetId,
                    matchedResource.id,
                    Math.max(
                      matchedResource.min,
                      matchedResource.current - totalCost,
                    ),
                  );
                }}
                className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-md border text-xs font-bold transition-colors ${!matchedResource
                    ? 'border-amber-500/40 bg-amber-500/15 text-amber-300 cursor-default'
                    : canAffordResource
                      ? 'border-amber-500/60 bg-amber-500/15 hover:bg-amber-500/30 text-amber-200 cursor-pointer'
                      : 'border-rose-500/40 bg-rose-500/10 text-rose-400 cursor-not-allowed opacity-70'
                  }`}
                title={
                  matchedResource
                    ? canAffordResource
                      ? `Deduzir ${totalCost} de ${matchedResource.label} (Atual: ${matchedResource.current})`
                      : `${matchedResource.label} insuficiente (${matchedResource.current}/${totalCost})`
                    : `Custo: ${totalCost} ${costResourceName}`
                }
              >
                <Zap className="w-3 h-3" />
                {matchedResource
                  ? `Gastar ${totalCost} ${costResourceName}`
                  : `Custo: ${totalCost} ${costResourceName}`}
              </button>
            )}
          </div>
        </div>

        {/* Descrição Interpolada */}
        {ab.desc && (
          <p className="text-xs text-[#c4c4cc] leading-relaxed">{ab.desc}</p>
        )}

        {/* Resumo de Modificadores Passivos / Ativos */}
        {ab.effectSummaries.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {ab.effectSummaries.map((eff, idx) => (
              <span
                key={idx}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${!ab.isToggleable || ab.active
                    ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                    : 'bg-[#202024] text-[#8d8d99]'
                  }`}
              >
                {eff}
              </span>
            ))}
          </div>
        )}

        {/* Aprimoramentos Modulares (enhance: Tormenta20 / Ordem Paranormal Discente & Verdadeiro) */}
        {ab.enhancements.length > 0 && (
          <div className="rounded-md border border-[#29292e] bg-[#18181b] p-2 space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#a78bfa]">
              Aprimoramentos Modulares
            </div>
            {ab.enhancements.map((enh) => {
              const checked = activeEnhIds.includes(enh.id);
              return (
                <button
                  key={enh.id}
                  type="button"
                  onClick={() => toggleEnhancement(ab.id, enh.id)}
                  className={`w-full flex items-start justify-between gap-2 p-1.5 rounded border text-left transition-colors ${checked
                      ? 'border-[#8257e5]/70 bg-[#8257e5]/15'
                      : 'border-transparent hover:bg-white/5'
                    }`}
                >
                  <div className="flex items-start gap-2 min-w-0">
                    {checked ? (
                      <CheckSquare className="w-3.5 h-3.5 text-[#a78bfa] mt-0.5 shrink-0" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-[#8d8d99] mt-0.5 shrink-0" />
                    )}
                    <div className="text-xs space-y-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-white">{enh.label}</span>
                        {enh.cost !== undefined && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                            +{enh.cost} {enh.resource ?? costResourceName}
                          </span>
                        )}
                        {enh.requires && (
                          <span className="text-[10px] text-[#8d8d99]">
                            (Req: {enh.requires})
                          </span>
                        )}
                        {enh.damage && (
                          <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px]">
                            Dano → {enh.damage}
                          </span>
                        )}
                      </div>
                      {enh.desc && (
                        <p className="text-[11px] text-[#a8a8b3]">{enh.desc}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Escolhas de Movimento Narrativo (PbtA choices) */}
        {ab.choices.length > 0 && (
          <div className="rounded-md border border-[#29292e] bg-[#18181b] p-2 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Opções de Movimento
            </div>
            {ab.choices.map((choice, cIdx) => {
              const key = `${ab.id}-c-${cIdx}`;
              const isChecked = !!checkedChoices[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    setCheckedChoices((prev) => ({
                      ...prev,
                      [key]: !prev[key],
                    }))
                  }
                  className="w-full flex items-center gap-2 text-left text-xs py-1 px-1.5 rounded hover:bg-white/5 text-[#e1e1e6]"
                >
                  {isChecked ? (
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-[#8d8d99] shrink-0" />
                  )}
                  <span className={isChecked ? 'text-emerald-300 font-medium' : ''}>
                    {choice}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Botões de Execução de Rolagem (Teste & Dano/Cura) */}
        {(ab.testFormula || effectiveDamageFormula) && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {ab.testFormula && (
              <button
                type="button"
                onClick={() =>
                  onExecuteRoll(
                    `${ab.label} — Teste`,
                    ab.testFormula!,
                    catMeta.label,
                  )
                }
                className="h-7 px-3 rounded-md bg-[#8257e5]/20 hover:bg-[#8257e5] border border-[#8257e5]/60 text-[#c4b5fd] hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Dices className="w-3.5 h-3.5" />
                Rolar Teste ({ab.testFormula})
              </button>
            )}

            {effectiveDamageFormula && (
              <button
                type="button"
                onClick={() =>
                  onExecuteRoll(
                    `${ab.label}${enhWithDamage ? ` (${enhWithDamage.label})` : ''} — Dano/Efeito`,
                    effectiveDamageFormula,
                    catMeta.label,
                  )
                }
                className="h-7 px-3 rounded-md bg-rose-500/20 hover:bg-rose-600 border border-rose-500/60 text-rose-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Flame className="w-3.5 h-3.5" />
                Rolar Dano/Efeito ({effectiveDamageFormula})
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const customTitle = sheet.blockTitles.abilities;

  return (
    <section
      className="rounded-xl border p-3 space-y-2.5 transition-colors"
      style={{
        backgroundColor: 'var(--sheet-card-bg, #18181b)',
        borderColor: 'var(--sheet-card-border, #29292e)',
      }}
    >
      {(customTitle || presentCategories.length > 1) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {customTitle ? (
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#a8a8b3] px-0.5">
              {customTitle}
            </h3>
          ) : (
            <div />
          )}

          {presentCategories.length > 1 && (
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setCategoryFilter('ALL')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${categoryFilter === 'ALL'
                    ? 'text-white'
                    : 'border text-[#a8a8b3] hover:text-white'
                  }`}
                style={{
                  backgroundColor: categoryFilter === 'ALL' ? 'var(--sheet-accent)' : 'var(--sheet-item-bg, #121214)',
                  borderColor: categoryFilter === 'ALL' ? 'var(--sheet-accent)' : 'var(--sheet-item-border, #323238)',
                }}
              >
                Todas ({tabAbilities.length})
              </button>
              {presentCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${categoryFilter === cat
                      ? 'text-white'
                      : 'border text-[#a8a8b3] hover:text-white'
                    }`}
                  style={{
                    backgroundColor: categoryFilter === cat ? 'var(--sheet-accent)' : 'var(--sheet-item-bg, #121214)',
                    borderColor: categoryFilter === cat ? 'var(--sheet-accent)' : 'var(--sheet-item-border, #323238)',
                  }}
                >
                  {CATEGORY_META[cat]?.label ?? cat}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-2">
        {visibleAbilities.map(renderAbilityCard)}
      </div>
    </section>
  );
}

