import { Lock, Dices } from 'lucide-react';
import type { CompiledSheet, EvaluatedStat, ModuleDisplayStyle } from '@/lib/sheet-dsl';
import { formatEvaluatedValue, type OnExecuteRoll } from './types';

interface AttributesStatsSectionProps {
  sheet: CompiledSheet;
  onExecuteRoll: OnExecuteRoll;
  activeTab?: string;
  mode?: 'both' | 'attr' | 'stat';
  displayOverride?: ModuleDisplayStyle;
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
  sheet,
  onExecuteRoll,
  activeTab,
  mode = 'both',
  displayOverride,
}: AttributesStatsSectionProps) {
  const attrList =
    mode === 'stat'
      ? []
      : Object.values(sheet.attributes).filter((a) => {
        if (!activeTab || activeTab === 'Geral' || activeTab === 'Principal') return true;
        return !a.tab || a.tab === activeTab;
      });

  const statList =
    mode === 'attr'
      ? []
      : Object.values(sheet.stats).filter((s) => {
        if (!activeTab || activeTab === 'Geral' || activeTab === 'Principal') return true;
        return !s.tab || s.tab === activeTab;
      });

  if (attrList.length === 0 && statList.length === 0) return null;

  const attrLayout = sheet.moduleLayouts.find((m) => m.kind === 'attr');
  const statLayout = sheet.moduleLayouts.find((m) => m.kind === 'stat');

  const attrDisplay: ModuleDisplayStyle =
    displayOverride ?? attrLayout?.display ?? 'cards';
  const statDisplay: ModuleDisplayStyle =
    displayOverride ?? statLayout?.display ?? 'cards';

  const customTitle = sheet.blockTitles.attributes;
  const customStatsTitle = sheet.blockTitles.stats;

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
    if (item.rollFormula) {
      const displayName = item.label || item.id;
      onExecuteRoll(displayName, item.rollFormula, `Rolagem de ${displayName}`);
    }
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

    if (!isPrimary) {
      return (
        <div
          key={attr.id}
          onClick={() => handleStatClick(attr)}
          className={`rounded-lg border px-3 py-2 flex items-center justify-between gap-2 transition-all ${
            hasRoll ? 'cursor-pointer hover:border-[var(--sheet-accent)] rollable-interactive' : ''
          }`}
          style={{
            backgroundColor: 'var(--sheet-item-bg, #121214)',
            borderColor: 'var(--sheet-item-border, #29292e)',
          }}
        >
          <span className="text-xs font-medium text-[#a8a8b3] truncate">
            {displayName}
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={`font-mono text-sm font-bold ${renderStatValueColor(
                attr,
                'text-[#e1e1e6]',
              )}`}
            >
              {formatEvaluatedValue(attr.finalValue)}
            </span>
            {hasRoll && <Dices className="w-3 h-3 text-[#71717a] rollable-dice-icon" />}
          </div>
        </div>
      );
    }

    return (
      <div
        key={attr.id}
        onClick={() => handleStatClick(attr)}
        className={`group relative rounded-xl border p-3 flex flex-col items-center justify-center transition-all min-w-[84px] ${
          hasRoll ? 'cursor-pointer hover:border-[var(--sheet-accent)] rollable-interactive' : ''
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
        {attr.locked && (
          <span
            title="Valor Travado (:! / !lock)"
            className="absolute top-2 left-2 text-amber-400"
          >
            <Lock className="w-3 h-3" />
          </span>
        )}

        {hasRoll && (
          <span
            title={`Rolar: ${attr.rollFormula}`}
            className="absolute top-2 right-2 text-[#71717a] group-hover:text-[var(--sheet-accent-text)] transition-colors"
          >
            <Dices className="w-3.5 h-3.5 rollable-dice-icon" />
          </span>
        )}

        <span
          className="text-xs font-semibold tracking-wide text-center uppercase truncate max-w-full"
          style={{ color: 'var(--sheet-accent-text, #c4b5fd)' }}
        >
          {displayName}
        </span>

        <span
          className={`mt-1 font-mono text-2xl font-black text-center ${renderStatValueColor(
            attr,
            'text-white',
          )}`}
        >
          {formatEvaluatedValue(attr.finalValue)}
        </span>

        {Object.keys(attr.children).length > 0 && (
          <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono text-[#8d8d99]">
            {Object.entries(attr.children).map(([k, v]) => (
              <span key={k}>
                {k}: {formatEvaluatedValue(v)}
              </span>
            ))}
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
                    className="text-xs font-bold uppercase tracking-wide truncate"
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
      return (
        <div className="flex flex-wrap gap-2">
          {items.map((stat) => (
            <div key={stat.id} className="flex-1 min-w-[130px]">
              {renderCardItem(stat, false)}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {items.map((attr) => renderCardItem(attr, true))}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {attrList.length > 0 && (
        <section className="space-y-2">
          {customTitle && (
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#a8a8b3] px-0.5">
              {customTitle}
            </h3>
          )}
          {renderItemsByDisplay(attrList, attrDisplay, true)}
        </section>
      )}

      {statList.length > 0 && (
        <section className="space-y-1.5">
          {customStatsTitle && (
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#8d8d99] px-0.5">
              {customStatsTitle}
            </h4>
          )}
          {renderItemsByDisplay(statList, statDisplay, false)}
        </section>
      )}
    </div>
  );
}
