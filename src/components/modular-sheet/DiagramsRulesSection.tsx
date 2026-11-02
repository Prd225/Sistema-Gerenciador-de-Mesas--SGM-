import { useState } from 'react';
import {
  Crosshair,
  Dices,
  CheckCircle2,
  Circle,
  Plus,
  Minus,
} from 'lucide-react';
import { useModularSheetStore } from '@/store/useModularSheetStore';
import type { CompiledSheet } from '@/lib/sheet-dsl';
import { formatEvaluatedValue, type OnExecuteRoll } from './types';

interface DiagramsRulesSectionProps {
  sheetId: string;
  sheet: CompiledSheet;
  onExecuteRoll: OnExecuteRoll;
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
}: DiagramsRulesSectionProps) {
  const [highlightedNodes, setHighlightedNodes] = useState<
    Record<string, string | null>
  >({});

  const setDiagramNodeResource = useModularSheetStore(
    (s) => s.setDiagramNodeResource,
  );

  const diagramList = Object.values(sheet.diagrams);
  const resolutionList = Object.values(sheet.resolutions);
  const ruleList = sheet.rules;

  if (
    diagramList.length === 0 &&
    resolutionList.length === 0 &&
    ruleList.length === 0
  ) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* @diagram - DIAGRAMAS ANATÔMICOS / SUB-SISTEMAS */}
      {diagramList.map((diag) => {
        const struckNodeId = highlightedNodes[diag.id] ?? null;

        const handleRollHitLocation = () => {
          if (!diag.hitRoll) return;
          const res = onExecuteRoll(
            `Localização de Acerto (${diag.id})`,
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
            className="rounded-xl border p-3 space-y-2.5 transition-colors"
            style={{
              backgroundColor: 'var(--sheet-card-bg, #18181b)',
              borderColor: 'var(--sheet-card-border, #29292e)',
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                {diag.id}
              </h3>

              {diag.hitRoll && (
                <button
                  type="button"
                  onClick={handleRollHitLocation}
                  className="h-7 px-2.5 rounded-md bg-cyan-500/15 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Dices className="w-3.5 h-3.5" />
                  Sortear ({diag.hitRoll})
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
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
          className="rounded-xl border p-3 space-y-2 transition-colors"
          style={{
            backgroundColor: 'var(--sheet-card-bg, #18181b)',
            borderColor: 'var(--sheet-card-border, #29292e)',
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {ruleList.map((rule, idx) => (
              <div
                key={`${rule.id}-${idx}`}
                className={`rounded-md border p-2.5 flex items-center justify-between gap-2 ${
                  rule.isActive
                    ? 'border-amber-500/60 bg-amber-500/10'
                    : 'border-[#29292e] bg-[#121214] opacity-75'
                }`}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5">
                    {rule.isActive ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-[#8d8d99] shrink-0" />
                    )}
                    <span className="text-xs font-bold text-white truncate">
                      {rule.id}
                    </span>
                    <code className="text-[10px] font-mono text-[#a8a8b3] bg-black/30 px-1.5 py-0.2 rounded truncate">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {resolutionList.map((res) => (
            <section
              key={res.id}
              className="rounded-xl border border-[#29292e] bg-[#18181b] p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#c4b5fd] flex items-center gap-1.5">
                  <Dices className="w-3.5 h-3.5 text-[#a78bfa]" />
                  {res.id}
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    onExecuteRoll(
                      `Teste (${res.id})`,
                      `${res.id}(${res.params.map(() => '0').join(', ')})`,
                    )
                  }
                  className="px-2 py-0.5 rounded bg-[#8257e5]/20 hover:bg-[#8257e5] border border-[#8257e5]/50 text-[10px] font-bold text-[#c4b5fd] hover:text-white transition-colors"
                >
                  Testar
                </button>
              </div>

              <div className="space-y-1">
                {res.bands.map((b, idx) => {
                  const tierExpr = b.meta.props.tier;
                  const tierStr =
                    tierExpr?.type === 'StringLit' ? tierExpr.value : undefined;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs px-2 py-1 rounded bg-[#121214] border border-[#29292e]"
                    >
                      <span className="text-[#e1e1e6]">{b.label}</span>
                      {tierStr && (
                        <span className="text-[10px] font-mono uppercase text-[#a78bfa]">
                          [{tierStr}]
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
