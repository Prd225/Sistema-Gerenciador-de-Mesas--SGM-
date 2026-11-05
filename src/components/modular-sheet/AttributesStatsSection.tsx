import { useMemo } from 'react';
import { Lock, Dices } from 'lucide-react';
import {
  isTabMatching,
  type CompiledSheet,
  type EvaluatedStat,
  type ModuleDisplayStyle,
} from '@/lib/sheet-dsl';
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
          className={`rounded-lg border px-3 py-2 flex items-center justify-between gap-2.5 transition-all min-w-0 ${
            hasRoll ? 'cursor-pointer hover:border-[var(--sheet-accent)] rollable-interactive' : ''
          }`}
          style={{
            backgroundColor: 'var(--sheet-item-bg, #121214)',
            borderColor: 'var(--sheet-item-border, #29292e)',
          }}
        >
          <span
            className="text-xs font-semibold text-[#a8a8b3] truncate flex-1 min-w-0"
            title={displayName}
          >
            {displayName}
          </span>
          <div className="flex items-center gap-1.5 shrink-0 pl-1.5">
            <span
              className={`font-mono text-sm font-bold ${renderStatValueColor(
                attr,
                'text-[#e1e1e6]',
              )}`}
            >
              {displayVal}
            </span>
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
        className={`group relative rounded-xl border p-2.5 sm:p-3 flex flex-col items-center justify-between transition-all min-w-[84px] ${
          hasRoll ? 'cursor-pointer hover:border-[var(--sheet-accent)] rollable-interactive' : ''
        } ${
          attr.locked
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
        {/* Header seguro com ícones nas extremidades e texto no centro (evita interpolação com letras) */}
        <div className="w-full flex items-center justify-between gap-1 mb-1">
          <div className="w-4 h-4 flex items-center justify-center shrink-0">
            {attr.locked && (
              <span title="Valor Travado (:! / !lock)" className="text-amber-400">
                <Lock className="w-3 h-3" />
              </span>
            )}
          </div>

          <span
            className="text-xs font-semibold tracking-wide text-center uppercase truncate flex-1 min-w-0 px-1"
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

        <span
          className={`mt-1 font-mono text-2xl font-black text-center ${renderStatValueColor(
            attr,
            'text-white',
          )}`}
        >
          {displayVal}
        </span>

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
                    className="text-[10px] text-zinc-400 text-center leading-snug line-clamp-3 px-1 italic"
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {normalStats.map((stat) => (
                <div key={stat.id} className="min-w-0">
                  {renderCardItem(stat, false)}
                </div>
              ))}
            </div>
          )}
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
    <div className="space-y-4">
      {attrGroups.map((group, idx) => (
        <section key={`attr_grp_${idx}`} className="space-y-2">
          {group.title && (
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#a8a8b3] px-0.5">
              {group.title}
            </h3>
          )}
          {renderItemsByDisplay(group.items, attrDisplay, true)}
        </section>
      ))}

      {statGroups.map((group, idx) => (
        <section key={`stat_grp_${idx}`} className="space-y-2">
          {group.title && (
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#8d8d99] px-0.5">
              {group.title}
            </h4>
          )}
          {renderItemsByDisplay(group.items, statDisplay, false)}
        </section>
      ))}
    </div>
  );
}
