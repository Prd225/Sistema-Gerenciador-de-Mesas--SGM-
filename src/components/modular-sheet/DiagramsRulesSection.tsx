import { useState } from 'react';
import {
  Crosshair,
  Dices,
  CheckCircle2,
  Circle,
  Plus,
  Minus,
  Scale,
} from 'lucide-react';
import { useModularSheetStore } from '@/store/useModularSheetStore';
import { isTabMatching, type ASTExpr, type CompiledSheet } from '@/lib/sheet-dsl';
import { formatEvaluatedValue, type OnExecuteRoll } from './types';

interface DiagramsRulesSectionProps {
  sheetId: string;
  sheet: CompiledSheet;
  onExecuteRoll: OnExecuteRoll;
  mode?: 'all' | 'diagram' | 'rule' | 'roll';
  diagramId?: string;
  resolutionId?: string;
  ruleBlockId?: string;
  titleOverride?: string;
  activeTab?: string;
  cols?: number;
  isTall?: boolean;
}

function formatMatcherLabel(expr: ASTExpr): string {
  switch (expr.type) {
    case 'NumberLit':
      return String(expr.value);
    case 'Ident':
      return expr.name === 'default' ? 'Padrão' : expr.name;
    case 'RangeExpr':
      return `${formatMatcherLabel(expr.min)}..${formatMatcherLabel(expr.max)}`;
    case 'BinaryExpr': {
      const left = formatMatcherLabel(expr.left);
      const right = formatMatcherLabel(expr.right);
      if (left === 'result') return `${expr.op} ${right}`;
      return `${left} ${expr.op} ${right}`;
    }
    default:
      return '';
  }
}

function matchesHitRange(hitRange: string | undefined, rollTotal: number): boolean {
  if (!hitRange) return false;
  const trimmed = hitRange.trim();
  if (trimmed.includes('..')) {
    const [minStr, maxStr] = trimmed.split('..');
    const min = Number(minStr);
    const max = Number(maxStr);
    if (!isNaN(min) && !isNaN(max)) {
      return rollTotal >= min && rollTotal <= max;
    }
  }
  const exact = Number(trimmed);
  return !isNaN(exact) && rollTotal === exact;
}

export function DiagramsRulesSection({
  sheetId,
  sheet,
  onExecuteRoll,
  mode = 'all',
  diagramId,
  resolutionId,
  ruleBlockId,
  titleOverride,
  activeTab,
  cols,
  isTall = false,
}: DiagramsRulesSectionProps) {
  const [highlightedNodes, setHighlightedNodes] = useState<
    Record<string, string | null>
  >({});

  const setDiagramNodeResource = useModularSheetStore(
    (s) => s.setDiagramNodeResource,
  );

  const diagramList =
    mode === 'rule' || mode === 'roll'
      ? []
      : Object.values(sheet.diagrams).filter(
          (d) =>
            (!diagramId || d.id === diagramId) &&
            isTabMatching(d.tab, activeTab),
        );

  const resolutionList =
    mode === 'diagram' || mode === 'rule'
      ? []
      : Object.values(sheet.resolutions).filter(
          (r) =>
            (!resolutionId || r.id === resolutionId) &&
            isTabMatching(r.tab, activeTab),
        );

  const ruleList =
    mode === 'diagram' || mode === 'roll'
      ? []
      : sheet.rules.filter(
          (r) =>
            r.source === 'global' &&
            isTabMatching(r.tab, activeTab) &&
            (!ruleBlockId || r.blockId === ruleBlockId),
        );

  if (
    diagramList.length === 0 &&
    resolutionList.length === 0 &&
    ruleList.length === 0
  ) {
    return null;
  }

  const gridStyle = (minPx: number): React.CSSProperties =>
    cols && cols > 0
      ? { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }
      : { gridTemplateColumns: `repeat(auto-fit, minmax(${minPx}px, 1fr))` };

  return (
    <div className={`space-y-4 ${isTall ? 'flex-1 flex flex-col' : ''}`}>
      {/* @diagram - DIAGRAMAS ANATÔMICOS / SUB-SISTEMAS */}
      {diagramList.map((diag) => {
        const struckNodeId = highlightedNodes[diag.id] ?? null;
        const diagTitle = titleOverride ?? diag.title ?? diag.id;

        const handleRollHitLocation = () => {
          if (!diag.hitRoll) return;
          const res = onExecuteRoll(
            `Localização de Acerto (${diagTitle})`,
            diag.hitRoll,
          );
          if (!res) return;
          const matched = diag.nodes.find((n) =>
            matchesHitRange(n.hitRange, res.total),
          );
          setHighlightedNodes((prev) => ({
            ...prev,
            [diag.id]: matched ? matched.id : null,
          }));
        };

        return (
          <section
            key={diag.id}
            className={`rounded-xl border p-3 space-y-2.5 transition-colors ${isTall ? 'flex-1 flex flex-col' : ''}`}
            style={{
              backgroundColor: 'var(--sheet-card-bg, #18181b)',
              borderColor: 'var(--sheet-card-border, #29292e)',
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--sheet-accent-text,#c4b5fd)] flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 shrink-0" />
                <span>{diagTitle}</span>
              </h3>

              {diag.hitRoll && (
                <button
                  type="button"
                  onClick={handleRollHitLocation}
                  className="h-7 px-2.5 rounded-md border border-[#323238] bg-[#121214] hover:border-[var(--sheet-accent)] text-[#e1e1e6] text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Dices className="w-3.5 h-3.5 text-[var(--sheet-accent-text,#c4b5fd)]" />
                  Sortear ({diag.hitRoll})
                </button>
              )}
            </div>

            <div className="grid gap-2.5" style={gridStyle(185)}>
              {diag.nodes.map((node) => {
                const isStruck = struckNodeId === node.id;
                const nodeResList = Object.values(node.resources);
                const nodeStatList = Object.values(node.stats);

                return (
                  <div
                    key={node.id}
                    className={`rounded-lg border p-3 space-y-2 transition-all ${
                      isStruck
                        ? 'border-[#ffd700]'
                        : ''
                    }`}
                    style={{
                      backgroundColor: 'var(--sheet-item-bg, #121214)',
                      borderColor: isStruck ? undefined : 'var(--sheet-item-border, #29292e)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-white uppercase">
                          {node.label}
                        </span>
                        {isStruck && (
                          <span className="px-1.5 py-0.2 rounded bg-[#ffd700] text-[#121214] text-[9px] font-black uppercase">
                            Atingido!
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[10px] font-mono">
                        {node.hitRange && (
                          <span className="px-1.5 py-0.2 rounded bg-[#202024] text-cyan-300">
                            Dado: {node.hitRange}
                          </span>
                        )}
                        {node.damageMult !== 1 && (
                          <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold">
                            x{node.damageMult}
                          </span>
                        )}
                      </div>
                    </div>

                    {nodeStatList.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {nodeStatList.map((st) => (
                          <span
                            key={st.id}
                            className="px-2 py-0.5 rounded bg-[#202024] border border-[#323238] text-[10px] font-mono text-[#e1e1e6]"
                          >
                            {st.label}:{' '}
                            <strong className="text-[#ffd700]">
                              {formatEvaluatedValue(st.finalValue)}
                            </strong>
                          </span>
                        ))}
                      </div>
                    )}

                    {nodeResList.map((res) => {
                      const pct =
                        res.max > 0
                          ? Math.max(
                              0,
                              Math.min(100, (res.current / res.max) * 100),
                            )
                          : 0;
                      const isZero = res.current <= 0;

                      return (
                        <div key={res.id} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span
                              className={
                                isZero
                                  ? 'text-rose-400 font-bold'
                                  : 'text-[#a8a8b3]'
                              }
                            >
                              {res.label} {isZero ? '(Comprometido)' : ''}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setDiagramNodeResource(
                                    sheetId,
                                    node.id,
                                    res.id,
                                    Math.max(0, res.current - 1),
                                  )
                                }
                                className="w-5 h-5 rounded bg-[#202024] hover:bg-rose-500/20 flex items-center justify-center text-white"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="font-bold text-white px-1">
                                {res.current}/{res.max}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setDiagramNodeResource(
                                    sheetId,
                                    node.id,
                                    res.id,
                                    Math.min(res.max, res.current + 1),
                                  )
                                }
                                className="w-5 h-5 rounded bg-[#202024] hover:bg-emerald-500/20 flex items-center justify-center text-white"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-[#202024] overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                isZero ? 'bg-rose-600' : 'bg-cyan-400'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* @rule - MONITOR DE REGRAS REATIVAS AUTOMATIZADAS */}
      {ruleList.length > 0 && (
        <section
          className={`rounded-xl border p-3 space-y-2.5 transition-colors ${isTall ? 'flex-1 flex flex-col' : ''}`}
          style={{
            backgroundColor: 'var(--sheet-card-bg, #18181b)',
            borderColor: 'var(--sheet-card-border, #29292e)',
          }}
        >
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#a8a8b3] flex items-center gap-1.5 px-0.5">
            <Scale className="w-3.5 h-3.5 text-[var(--sheet-accent-text,#c4b5fd)] shrink-0" />
            <span>{titleOverride ?? sheet.blockTitles.rules ?? 'Regras Reativas'}</span>
          </h3>
          <div className="grid gap-2" style={gridStyle(220)}>
            {ruleList.map((rule, idx) => (
              <div
                key={`${rule.id}-${idx}`}
                className={`rounded-md border p-2.5 flex items-center justify-between gap-2 min-w-0 ${
                  rule.isActive
                    ? 'border-amber-500/60 bg-amber-500/10'
                    : 'border-[#29292e] bg-[#121214] opacity-75'
                }`}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {rule.isActive ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-[#8d8d99] shrink-0" />
                    )}
                    <span className="text-xs font-bold text-white leading-snug">
                      {rule.id}
                    </span>
                    <code className="text-[10px] font-mono text-[#a8a8b3] bg-black/30 px-1.5 py-0.2 rounded">
                      se ({rule.conditionText})
                    </code>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {rule.effectSummaries.map((eff, eIdx) => (
                      <span
                        key={eIdx}
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                          rule.isActive
                            ? 'bg-amber-500/25 text-amber-200 font-bold'
                            : 'bg-[#202024] text-[#8d8d99]'
                        }`}
                      >
                        {eff}
                      </span>
                    ))}
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase shrink-0 ${
                    rule.isActive
                      ? 'bg-amber-400 text-[#121214]'
                      : 'bg-[#202024] text-[#8d8d99]'
                  }`}
                >
                  {rule.isActive ? 'Ativa' : 'Inativa'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* @roll - PERFIS DE RESOLUÇÃO */}
      {resolutionList.length > 0 && (
        <div
          className={`grid gap-3 ${isTall ? 'flex-1' : ''}`}
          style={resolutionList.length > 1 ? gridStyle(220) : { gridTemplateColumns: '1fr' }}
        >
          {resolutionList.map((res) => {
            const resTitle = titleOverride ?? res.title ?? res.id;
            const paramSig =
              res.params.length > 0 ? `(${res.params.join(', ')})` : '';
            return (
              <section
                key={res.id}
                className="rounded-xl border p-3 space-y-2 transition-colors"
                style={{
                  backgroundColor: 'var(--sheet-card-bg, #18181b)',
                  borderColor: 'var(--sheet-card-border, #29292e)',
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--sheet-accent-text,#c4b5fd)] flex items-center gap-1.5 min-w-0">
                    <Dices className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{resTitle}</span>
                    {paramSig && (
                      <span className="font-mono text-[10px] text-[#71717a] lowercase shrink-0">
                        {paramSig}
                      </span>
                    )}
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      onExecuteRoll(
                        `Teste (${resTitle})`,
                        `${res.id}(${res.params.map(() => '0').join(', ')})`,
                      )
                    }
                    className="px-2.5 py-1 rounded border border-[#323238] bg-[#121214] hover:border-[var(--sheet-accent)] text-[11px] font-bold text-[#e1e1e6] flex items-center gap-1 transition-colors shrink-0"
                  >
                    <Dices className="w-3 h-3 text-[var(--sheet-accent-text,#c4b5fd)]" />
                    Testar
                  </button>
                </div>

                {res.bands.length > 0 && (
                  <div className="space-y-1">
                    {res.bands.map((b, idx) => {
                      const tierExpr = b.meta.props.tier;
                      const tierStr =
                        tierExpr?.type === 'StringLit'
                          ? tierExpr.value
                          : tierExpr?.type === 'Ident'
                            ? tierExpr.name
                            : undefined;
                      const matcherStr = formatMatcherLabel(b.matcher);
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 text-xs px-2.5 py-1.5 rounded border"
                          style={{
                            backgroundColor: 'var(--sheet-item-bg, #121214)',
                            borderColor: 'var(--sheet-item-border, #29292e)',
                          }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {matcherStr && (
                              <span className="px-1.5 py-0.5 rounded bg-[#202024] border border-[#323238] font-mono text-[10px] font-bold text-amber-300 shrink-0">
                                {matcherStr}
                              </span>
                            )}
                            <span className="text-[#e1e1e6] leading-snug">
                              {b.label}
                            </span>
                          </div>
                          {tierStr && (
                            <span className="text-[10px] font-mono uppercase text-[#a8a8b3] shrink-0">
                              [{tierStr}]
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
