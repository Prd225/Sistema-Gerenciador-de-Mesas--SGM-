import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Zap,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Layers,
  GitBranch,
} from 'lucide-react';
import { useModularSheetStore } from '@/store/useModularSheetStore';
import type {
  CompiledSheet,
  EvaluatedProgression,
  EvaluatedProgressionChoiceOption,
  EvaluatedProgressionStep,
} from '@/lib/sheet-dsl';

interface ProgressionUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheetId: string;
  sheet: CompiledSheet;
  progression: EvaluatedProgression;
}

export const ProgressionUpgradeModal: React.FC<ProgressionUpgradeModalProps> = ({
  isOpen,
  onClose,
  sheetId,
  sheet: _sheet,
  progression,
}) => {
  const applyProgressionUpgrade = useModularSheetStore(
    (s) => s.applyProgressionUpgrade,
  );

  // Extrai as etapas definidas ou cria uma padrão caso flat
  const steps: EvaluatedProgressionStep[] =
    progression.steps && progression.steps.length > 0
      ? progression.steps
      : [
          {
            id: 'step_default',
            title: progression.title || 'Evolução',
            gains: progression.gains,
            choices: progression.choices,
          },
        ];

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const activeStep = steps[currentStepIndex] ?? steps[0];

  // Armazena a bifurcação / branch selecionada por step id
  const [selectedBranchByStep, setSelectedBranchByStep] = useState<
    Record<string, string>
  >({});

  const activeBranch =
    activeStep.branches?.find(
      (b) =>
        b.id ===
        (selectedBranchByStep[activeStep.id] || activeStep.branches?.[0]?.id),
    ) || activeStep.branches?.[0];

  // Ganhos efetivos (da etapa + da bifurcação ativa) filtrando variáveis pseudo/inválidas e duplicatas
  const rawGains = [
    ...activeStep.gains,
    ...(activeBranch?.gains ?? []),
  ].filter((g) => {
    if (g.abilityOption || g.target === '@ability') return true;
    const t = g.target.trim().toLowerCase();
    return (
      t !== 'desc' &&
      t !== 'action' &&
      t !== 'cost' &&
      t !== 'custo' &&
      t !== 'choose' &&
      t !== 'branch' &&
      t !== 'step' &&
      t !== 'ability' &&
      t !== ''
    );
  });

  const seenGains = new Set<string>();
  const effectiveGains = rawGains.filter((g) => {
    const key = g.abilityOption
      ? `@ability::${g.abilityOption.label.toLowerCase()}`
      : `${g.target.toLowerCase()}::${(g.label || '').toLowerCase()}::${g.exprString || ''}`;
    if (seenGains.has(key)) return false;
    seenGains.add(key);
    return true;
  });

  // Escolhas efetivas (da etapa + da bifurcação ativa), exibindo apenas quando houver 2+ opções reais
  const effectiveChoices = [
    ...activeStep.choices,
    ...(activeBranch?.choices ?? []),
  ].filter((c) => c.options && c.options.length > 1);

  // Armazena as opções selecionadas por step + índice de escolha
  // chave: `${stepIndex}_${choiceIndex}`
  const [selectedByGroup, setSelectedByGroup] = useState<
    Record<string, string[]>
  >({});
  const [activeFilterTag, setActiveFilterTag] = useState<string>('ALL');

  if (!isOpen) return null;

  const handleToggleOption = (
    stepIdx: number,
    choiceIdx: number,
    option: EvaluatedProgressionChoiceOption,
    maxCount: number,
  ) => {
    if (!option.isEligible) return;

    const groupKey = `${stepIdx}_${choiceIdx}`;

    setSelectedByGroup((prev) => {
      const cur = prev[groupKey] ?? [];
      const isAlreadySelected = cur.includes(option.id);

      if (isAlreadySelected) {
        return {
          ...prev,
          [groupKey]: cur.filter((id) => id !== option.id),
        };
      }

      if (cur.length >= maxCount) {
        // Se for escolha única (1 item), substitui diretamente
        if (maxCount === 1) {
          return {
            ...prev,
            [groupKey]: [option.id],
          };
        }
        return prev;
      }

      return {
        ...prev,
        [groupKey]: [...cur, option.id],
      };
    });
  };

  // Validação: todas as escolhas com opções obrigatórias devem estar completas
  const isAllRequiredSelected = steps.every((st, sIdx) => {
    const chosenBranch = st.branches?.find(
      (b) => b.id === (selectedBranchByStep[st.id] || st.branches?.[0]?.id),
    );
    const stepChoicesToCheck = [
      ...st.choices,
      ...(chosenBranch?.choices ?? []),
    ];
    return stepChoicesToCheck.every((c, cIdx) => {
      const key = `${sIdx}_${cIdx}`;
      const selected = selectedByGroup[key] ?? [];
      return selected.length >= Math.min(c.count, c.options.length);
    });
  });

  const handleConfirm = () => {
    const allSelectedOptions: EvaluatedProgressionChoiceOption[] = [];

    steps.forEach((st, sIdx) => {
      const chosenBranch = st.branches?.find(
        (b) => b.id === (selectedBranchByStep[st.id] || st.branches?.[0]?.id),
      );
      const stepChoicesToCheck = [
        ...st.choices,
        ...(chosenBranch?.choices ?? []),
      ];

      stepChoicesToCheck.forEach((c, cIdx) => {
        const key = `${sIdx}_${cIdx}`;
        const selectedIds = selectedByGroup[key] ?? [];
        c.options.forEach((opt) => {
          if (selectedIds.includes(opt.id)) {
            allSelectedOptions.push({
              ...opt,
              targetModule:
                opt.targetModule ||
                c.targetModule ||
                chosenBranch?.targetModule ||
                st.targetModule,
            });
          }
        });
      });
    });

    applyProgressionUpgrade(
      sheetId,
      progression.id,
      allSelectedOptions,
      selectedBranchByStep,
    );
    onClose();
  };

  // Coleta tags únicas de opções da etapa ativa para filtro
  const activeStepTags = Array.from(
    new Set(
      effectiveChoices.flatMap((c) =>
        c.options.flatMap((opt) => opt.tags ?? []),
      ),
    ),
  );

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const headerSubtitle = activeStep.subtitle || progression.subtitle;

  return (
    <div
      className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[92vh] rounded-2xl border flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        style={{
          backgroundColor: 'var(--sheet-card-bg, #121214)',
          borderColor: 'var(--sheet-card-border, #29292e)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* CABEÇALHO DO WIZARD */}
        <div
          className="px-5 py-4 border-b space-y-3 shrink-0"
          style={{
            borderColor: 'var(--sheet-header-border, #29292e)',
            backgroundColor: 'var(--sheet-header-bg, #18181b)',
          }}
        >
          {/* Contexto Geral da Progressão */}
          <div className="flex items-center justify-between gap-3">
            <span
              className="text-xs font-mono font-bold uppercase tracking-wider"
              style={{ color: 'var(--sheet-accent-text, #c4b5fd)' }}
            >
              {progression.title}
            </span>
          </div>

          {/* Barra Progressiva de Etapas (@step tracker) */}
          {steps.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {steps.map((st, idx) => {
                const isActive = idx === currentStepIndex;
                const isPast = idx < currentStepIndex;

                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setCurrentStepIndex(idx)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 border cursor-pointer"
                    style={
                      isActive
                        ? {
                            backgroundColor: 'var(--sheet-accent, #8257e5)',
                            borderColor: 'var(--sheet-accent, #8257e5)',
                            color: '#ffffff',
                          }
                        : isPast
                          ? {
                              backgroundColor:
                                'var(--sheet-accent-subtle, rgba(130, 87, 229, 0.16))',
                              borderColor: 'var(--sheet-accent, #8257e5)',
                              color: 'var(--sheet-accent-text, #c4b5fd)',
                            }
                          : {
                              backgroundColor: 'var(--sheet-item-bg, #18181b)',
                              borderColor: 'var(--sheet-item-border, #29292e)',
                              color: '#a1a1aa',
                            }
                    }
                  >
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono font-black"
                      style={
                        isActive
                          ? { backgroundColor: '#ffffff', color: '#09090b' }
                          : isPast
                            ? {
                                backgroundColor: 'var(--sheet-accent, #8257e5)',
                                color: '#ffffff',
                              }
                            : {
                                backgroundColor: 'var(--sheet-code-bg, #09090b)',
                                color: '#d4d4d8',
                              }
                      }
                    >
                      {isPast ? '✓' : idx + 1}
                    </span>
                    <span>{st.title}</span>
                    {idx < steps.length - 1 && (
                      <ArrowRight className="w-3 h-3 opacity-60 shrink-0 ml-1" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Título da Etapa Atual + Subtítulo Customizável à Direita */}
          <div
            className="pt-2.5 flex flex-wrap items-center justify-between gap-3 border-t"
            style={{ borderColor: 'var(--sheet-header-border, #29292e)' }}
          >
            <div className="min-w-0">
              {(steps.length > 1 || activeStep.targetModule) && (
                <div className="flex items-center gap-2 mb-1">
                  {steps.length > 1 && (
                    <span
                      className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border"
                      style={{
                        backgroundColor:
                          'var(--sheet-accent-subtle, rgba(130, 87, 229, 0.16))',
                        borderColor: 'var(--sheet-accent, #8257e5)',
                        color: 'var(--sheet-accent-text, #c4b5fd)',
                      }}
                    >
                      Etapa {currentStepIndex + 1} de {steps.length}
                    </span>
                  )}
                  {activeStep.targetModule && (
                    <span
                      className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded border flex items-center gap-1"
                      style={{
                        backgroundColor: 'var(--sheet-item-bg, #18181b)',
                        borderColor: 'var(--sheet-item-border, #29292e)',
                        color: 'var(--sheet-accent-text, #c4b5fd)',
                      }}
                    >
                      <Layers className="w-2.5 h-2.5" />
                      Destino: {activeStep.targetModule}
                    </span>
                  )}
                </div>
              )}
              <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                {activeStep.title}
              </h2>
              {activeStep.desc && (
                <p className="text-xs text-zinc-400 mt-0.5 leading-snug">
                  {activeStep.desc}
                </p>
              )}
            </div>

            {headerSubtitle && (
              <span
                className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg border shrink-0"
                style={{
                  backgroundColor:
                    'var(--sheet-accent-subtle, rgba(130, 87, 229, 0.14))',
                  borderColor: 'var(--sheet-card-border, #29292e)',
                  color: 'var(--sheet-accent-text, #c4b5fd)',
                }}
              >
                {headerSubtitle}
              </span>
            )}
          </div>
        </div>

        {/* CORPO DO PASSO ATIVO */}
        <div
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 min-h-0"
          style={{ backgroundColor: 'var(--sheet-bg, #09090b)' }}
        >
          {/* SEÇÃO DE BIFURCAÇÃO / CAMINHOS ALTERNATIVOS */}
          {activeStep.branches && activeStep.branches.length > 0 && (
            <div
              className="rounded-xl border p-4 space-y-3 transition-colors"
              style={{
                backgroundColor: 'var(--sheet-card-bg, #121214)',
                borderColor: 'var(--sheet-card-border, #29292e)',
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                  style={{ color: 'var(--sheet-accent-text, #c4b5fd)' }}
                >
                  <GitBranch className="w-4 h-4" />
                  {activeStep.branchTitle || 'Caminho de Progressão'}
                </span>
                {activeStep.branchDesc && (
                  <span className="text-[11px] text-zinc-400">
                    {activeStep.branchDesc}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-0.5">
                {activeStep.branches.map((br) => {
                  const isSelected = activeBranch?.id === br.id;
                  const isEligible = br.isEligible;

                  return (
                    <button
                      key={br.id}
                      type="button"
                      disabled={!isEligible}
                      onClick={() =>
                        setSelectedBranchByStep((prev) => ({
                          ...prev,
                          [activeStep.id]: br.id,
                        }))
                      }
                      className={`text-left p-3.5 rounded-xl border flex flex-col justify-between space-y-2.5 transition-all ${
                        isEligible ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
                      }`}
                      style={
                        isSelected
                          ? {
                              backgroundColor:
                                'var(--sheet-accent-subtle, rgba(130, 87, 229, 0.16))',
                              borderColor: 'var(--sheet-accent, #8257e5)',
                              boxShadow:
                                '0 0 0 1px var(--sheet-accent, #8257e5)',
                            }
                          : {
                              backgroundColor: 'var(--sheet-code-bg, #09090b)',
                              borderColor: 'var(--sheet-item-border, #29292e)',
                            }
                      }
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-1.5">
                          <span className="text-sm font-bold text-white">
                            {br.title}
                          </span>
                          {isSelected && (
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white shrink-0"
                              style={{
                                backgroundColor: 'var(--sheet-accent, #8257e5)',
                              }}
                            >
                              ✓ Selecionado
                            </span>
                          )}
                        </div>
                        {br.desc && (
                          <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                            {br.desc}
                          </p>
                        )}
                      </div>

                      {br.req ? (
                        <div
                          className="pt-2 border-t flex items-center justify-between gap-1"
                          style={{
                            borderColor: 'var(--sheet-item-border, #29292e)',
                          }}
                        >
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                              isEligible
                                ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-400'
                                : 'bg-rose-950/40 border-rose-700/60 text-rose-400'
                            }`}
                          >
                            {isEligible ? (
                              <CheckCircle2 className="w-3 h-3 shrink-0" />
                            ) : (
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                            )}
                            <span>
                              Pré-requisito:{' '}
                              {br.requirementText ||
                                br.reqText ||
                                String(br.req).replace(/["']/g, '')}
                            </span>
                          </span>

                          {br.targetModule && (
                            <span
                              className="text-[9px] font-mono"
                              style={{
                                color: 'var(--sheet-accent-text, #c4b5fd)',
                              }}
                            >
                              {br.targetModule}
                            </span>
                          )}
                        </div>
                      ) : br.targetModule ? (
                        <div
                          className="pt-2 border-t flex justify-end"
                          style={{
                            borderColor: 'var(--sheet-item-border, #29292e)',
                          }}
                        >
                          <span
                            className="text-[9px] font-mono"
                            style={{
                              color: 'var(--sheet-accent-text, #c4b5fd)',
                            }}
                          >
                            {br.targetModule}
                          </span>
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 1. SEÇÃO DE GANHOS DO PASSO (@gains + bifurcação ativa) */}
          {effectiveGains.length > 0 && (
            <div
              className="rounded-xl border p-4 space-y-3 transition-colors"
              style={{
                backgroundColor: 'var(--sheet-card-bg, #121214)',
                borderColor: 'var(--sheet-card-border, #29292e)',
              }}
            >
              <span
                className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                style={{ color: 'var(--sheet-accent-text, #c4b5fd)' }}
              >
                <CheckCircle2 className="w-4 h-4" />
                {activeStep.gainsTitle
                  ? `${activeStep.gainsTitle}${activeBranch ? ` (${activeBranch.title})` : ''}`
                  : `Ganhos Automáticos${activeBranch ? ` (${activeBranch.title})` : ''}`}
              </span>

              <div
                className={`grid gap-3 pt-0.5 ${
                  activeStep.placement === 'col2' ||
                  effectiveGains[0]?.placement === 'col2'
                    ? 'grid-cols-1 sm:grid-cols-2'
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                }`}
              >
                {effectiveGains.map((gain, i) => {
                  const isLevel =
                    gain.target.toLowerCase() === 'level' ||
                    gain.target.toLowerCase() === 'nivel' ||
                    gain.target.toLowerCase() === 'nível';
                  const isAbility =
                    gain.target === '@ability' ||
                    gain.target.toLowerCase() === 'ability' ||
                    Boolean(gain.abilityOption);

                  const title = isAbility
                    ? gain.abilityOption?.label || gain.label || 'Novo Poder'
                    : isLevel && gain.label === gain.target
                      ? 'Nível'
                      : gain.label || gain.target;

                  const opPrefix =
                    gain.op === '+=' ? '+' : gain.op === '-=' ? '-' : '=';
                  const valStr = isAbility
                    ? 'Novo Poder'
                    : `${opPrefix}${gain.evaluatedValue}`;

                  const calcDisplay = isAbility
                    ? gain.abilityOption?.desc || gain.description
                    : gain.calcText || gain.description;

                  const reqDisplay =
                    gain.abilityOption?.requirementText ||
                    gain.abilityOption?.reqText;

                  return (
                    <div
                      key={i}
                      className="rounded-xl border flex items-stretch overflow-hidden transition-colors"
                      style={{
                        backgroundColor: 'var(--sheet-item-bg, #121214)',
                        borderColor: 'var(--sheet-item-border, #2b2d31)',
                      }}
                    >
                      {/* Lado Esquerdo: Nome + Caixa de Cálculo Organizado */}
                      <div
                        className={`flex-1 min-w-0 p-3 flex flex-col gap-2 ${
                          calcDisplay || isAbility ? 'justify-between' : 'justify-center'
                        }`}
                      >
                        <span className="text-xs sm:text-sm font-bold text-zinc-100 leading-tight truncate">
                          {title}
                        </span>

                        {calcDisplay && (
                          <div
                            className="rounded-md border px-2.5 py-1 text-[11px] font-mono leading-snug text-zinc-300 break-words"
                            style={{
                              backgroundColor: 'var(--sheet-code-bg, #0e0e10)',
                              borderColor: 'var(--sheet-card-border, #2b2d31)',
                            }}
                          >
                            {calcDisplay}
                          </div>
                        )}

                        {isAbility &&
                        (gain.abilityOption?.tags?.length || reqDisplay) ? (
                          <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] pt-0.5">
                            <div className="flex items-center gap-1">
                              {gain.abilityOption?.tags?.map((t) => (
                                <span
                                  key={t}
                                  className="px-1.5 py-0.5 rounded font-mono text-zinc-400 border"
                                  style={{
                                    backgroundColor:
                                      'var(--sheet-code-bg, #0e0e10)',
                                    borderColor:
                                      'var(--sheet-item-border, #2b2d31)',
                                  }}
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>
                            {reqDisplay && (
                              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                                <CheckCircle2 className="w-3 h-3 shrink-0" />
                                <span>Pré-requisito: {reqDisplay}</span>
                              </span>
                            )}
                          </div>
                        ) : null}
                      </div>

                      {/* Lado Direito: Valor do Ganho em Destaque */}
                      <div
                        className="shrink-0 border-l flex items-center justify-center px-3 py-2 min-w-[4.75rem]"
                        style={{
                          borderColor: 'var(--sheet-item-border, #2b2d31)',
                          backgroundColor:
                            'var(--sheet-accent-subtle, rgba(130, 87, 229, 0.16))',
                        }}
                      >
                        {isAbility ? (
                          <span
                            className="text-[10px] font-mono font-black uppercase text-center leading-tight px-2 py-1 rounded-md border"
                            style={{
                              backgroundColor:
                                'var(--sheet-code-bg, #0e0e10)',
                              borderColor: 'var(--sheet-accent, #8257e5)',
                              color: 'var(--sheet-accent-text, #c4b5fd)',
                            }}
                          >
                            Novo Poder
                          </span>
                        ) : (
                          <span
                            className="text-xl sm:text-2xl font-black font-mono tracking-tight tabular-nums"
                            style={{
                              color: 'var(--sheet-accent-text, #c4b5fd)',
                            }}
                          >
                            {valStr}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. FILTRO DE TAGS DA ETAPA */}
          {activeStepTags.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1 mr-1 shrink-0">
                <Filter className="w-3 h-3" />
                Filtrar:
              </span>
              <button
                type="button"
                onClick={() => setActiveFilterTag('ALL')}
                className="px-2.5 py-1 rounded-lg text-xs font-bold transition-colors shrink-0 border cursor-pointer"
                style={
                  activeFilterTag === 'ALL'
                    ? {
                        backgroundColor: 'var(--sheet-accent, #8257e5)',
                        borderColor: 'var(--sheet-accent, #8257e5)',
                        color: '#ffffff',
                      }
                    : {
                        backgroundColor: 'var(--sheet-item-bg, #18181b)',
                        borderColor: 'var(--sheet-item-border, #29292e)',
                        color: '#a1a1aa',
                      }
                }
              >
                Todos
              </button>
              {activeStepTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveFilterTag(tag)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-colors shrink-0 border cursor-pointer"
                  style={
                    activeFilterTag === tag
                      ? {
                          backgroundColor: 'var(--sheet-accent, #8257e5)',
                          borderColor: 'var(--sheet-accent, #8257e5)',
                          color: '#ffffff',
                        }
                      : {
                          backgroundColor: 'var(--sheet-item-bg, #18181b)',
                          borderColor: 'var(--sheet-item-border, #29292e)',
                          color: '#a1a1aa',
                        }
                  }
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* 3. ESCOLHAS DO PASSO ATIVO */}
          {effectiveChoices.map((choice, cIdx) => {
            const groupKey = `${currentStepIndex}_${cIdx}`;
            const selected = selectedByGroup[groupKey] ?? [];
            const filteredOptions = choice.options.filter(
              (opt) =>
                activeFilterTag === 'ALL' ||
                opt.tags?.includes(activeFilterTag),
            );

            return (
              <div
                key={cIdx}
                className="rounded-xl border p-4 space-y-3"
                style={{
                  backgroundColor: 'var(--sheet-card-bg, #121214)',
                  borderColor: 'var(--sheet-card-border, #29292e)',
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                    style={{ color: 'var(--sheet-accent-text, #c4b5fd)' }}
                  >
                    <Zap className="w-4 h-4" />
                    {choice.title}
                  </span>
                  <span
                    className="text-xs font-mono font-bold px-2 py-0.5 rounded border"
                    style={{
                      backgroundColor:
                        'var(--sheet-accent-subtle, rgba(130, 87, 229, 0.16))',
                      borderColor: 'var(--sheet-accent, #8257e5)',
                      color: 'var(--sheet-accent-text, #c4b5fd)',
                    }}
                  >
                    Selecionado: {selected.length} / {choice.count}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredOptions.map((opt) => {
                    const isSelected = selected.includes(opt.id);
                    const disabled = !opt.isEligible;

                    return (
                      <div
                        key={opt.id}
                        onClick={() =>
                          handleToggleOption(
                            currentStepIndex,
                            cIdx,
                            opt,
                            choice.count,
                          )
                        }
                        className={`group relative rounded-xl border p-3.5 flex flex-col justify-between transition-all select-none ${
                          disabled
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer'
                        }`}
                        style={
                          isSelected
                            ? {
                                backgroundColor:
                                  'var(--sheet-accent-subtle, rgba(130, 87, 229, 0.16))',
                                borderColor: 'var(--sheet-accent, #8257e5)',
                                boxShadow:
                                  '0 0 0 1px var(--sheet-accent, #8257e5)',
                              }
                            : {
                                backgroundColor: 'var(--sheet-code-bg, #09090b)',
                                borderColor:
                                  'var(--sheet-item-border, #29292e)',
                              }
                        }
                      >
                        {/* Topo do Card de Opção */}
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className="text-sm font-bold leading-tight"
                              style={{
                                color: isSelected
                                  ? 'var(--sheet-accent-text, #c4b5fd)'
                                  : '#f4f4f5',
                              }}
                            >
                              {opt.label}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isSelected && (
                                <span
                                  className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                                  style={{
                                    backgroundColor:
                                      'var(--sheet-accent, #8257e5)',
                                  }}
                                >
                                  ✓ Selecionado
                                </span>
                              )}
                              {opt.cost && (
                                <span
                                  className="px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold"
                                  style={{
                                    backgroundColor:
                                      'var(--sheet-item-bg, #18181b)',
                                    borderColor:
                                      'var(--sheet-item-border, #29292e)',
                                    color: 'var(--sheet-accent-text, #c4b5fd)',
                                  }}
                                >
                                  {opt.cost}
                                </span>
                              )}
                              {opt.type && (
                                <span
                                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-zinc-300 border"
                                  style={{
                                    backgroundColor:
                                      'var(--sheet-item-bg, #18181b)',
                                    borderColor:
                                      'var(--sheet-item-border, #29292e)',
                                  }}
                                >
                                  {opt.type}
                                </span>
                              )}
                            </div>
                          </div>

                          {opt.desc && (
                            <p className="text-xs text-zinc-300 leading-relaxed pt-1">
                              {opt.desc}
                            </p>
                          )}
                        </div>

                        {/* Base do Card: Tags, Módulo Alvo e Status de Pré-Requisitos */}
                        {(opt.targetModule ||
                          opt.tags?.length ||
                          opt.req) && (
                          <div
                            className="pt-3 mt-2 border-t flex items-center justify-between gap-2 text-[10px]"
                            style={{
                              borderColor: 'var(--sheet-item-border, #29292e)',
                            }}
                          >
                            <div className="flex flex-wrap items-center gap-1">
                              {opt.targetModule && (
                                <span
                                  className="px-1.5 py-0.5 rounded border font-mono text-[9px]"
                                  style={{
                                    backgroundColor:
                                      'var(--sheet-item-bg, #18181b)',
                                    borderColor:
                                      'var(--sheet-item-border, #29292e)',
                                    color: 'var(--sheet-accent-text, #c4b5fd)',
                                  }}
                                >
                                  {opt.targetModule}
                                </span>
                              )}
                              {opt.tags?.map((t) => (
                                <span
                                  key={t}
                                  className="px-1.5 py-0.5 rounded font-mono text-zinc-400 border"
                                  style={{
                                    backgroundColor:
                                      'var(--sheet-item-bg, #18181b)',
                                    borderColor:
                                      'var(--sheet-item-border, #29292e)',
                                  }}
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>

                            <div>
                              {opt.req ? (
                                <span
                                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1.5 transition-colors ${
                                    opt.isEligible
                                      ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-400'
                                      : 'bg-rose-950/40 border-rose-700/60 text-rose-400'
                                  }`}
                                >
                                  {opt.isEligible ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                  ) : (
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                  )}
                                  <span>
                                    Pré-requisito:{' '}
                                    {opt.requirementText ||
                                      opt.reqText ||
                                      String(opt.req).replace(/["']/g, '')}
                                  </span>
                                </span>
                              ) : null}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* RODAPÉ CENTRALIZADO E TEMATIZADO */}
        <div
          className="px-5 py-4 border-t flex items-center justify-center gap-3 shrink-0"
          style={{
            borderColor: 'var(--sheet-header-border, #29292e)',
            backgroundColor: 'var(--sheet-header-bg, #18181b)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-5 rounded-lg border text-sm font-semibold text-zinc-200 hover:text-white hover:brightness-110 transition-all cursor-pointer"
            style={{
              backgroundColor: 'var(--sheet-item-bg, #202024)',
              borderColor: 'var(--sheet-item-border, #323238)',
            }}
          >
            Cancelar
          </button>

          {!isFirstStep && (
            <button
              type="button"
              onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
              className="h-9 px-4 rounded-lg border text-sm font-semibold text-zinc-200 hover:text-white hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer"
              style={{
                backgroundColor: 'var(--sheet-item-bg, #202024)',
                borderColor: 'var(--sheet-item-border, #323238)',
              }}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>
          )}

          {!isLastStep ? (
            <button
              type="button"
              onClick={() =>
                setCurrentStepIndex((prev) =>
                  Math.min(steps.length - 1, prev + 1),
                )
              }
              className="h-9 px-5 rounded-lg text-sm font-bold text-white hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer"
              style={{
                backgroundColor: 'var(--sheet-accent, #8257e5)',
              }}
            >
              <span>Avançar ({steps[currentStepIndex + 1]?.title})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!isAllRequiredSelected}
              onClick={handleConfirm}
              className={`h-9 px-6 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-md ${
                isAllRequiredSelected
                  ? 'text-white hover:opacity-90 cursor-pointer'
                  : 'text-zinc-500 border cursor-not-allowed opacity-60'
              }`}
              style={
                isAllRequiredSelected
                  ? { backgroundColor: 'var(--sheet-accent, #8257e5)' }
                  : {
                      backgroundColor: 'var(--sheet-item-bg, #202024)',
                      borderColor: 'var(--sheet-item-border, #323238)',
                    }
              }
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
