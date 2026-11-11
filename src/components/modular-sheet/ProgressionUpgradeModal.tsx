import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  Zap,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Layers,
  GitBranch,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  sheet,
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

  // Ganhos efetivos (da etapa + da bifurcação ativa)
  const effectiveGains = [
    ...activeStep.gains,
    ...(activeBranch?.gains ?? []),
  ];

  // Escolhas efetivas (da etapa + da bifurcação ativa)
  const effectiveChoices = [
    ...activeStep.choices,
    ...(activeBranch?.choices ?? []),
  ];

  // Armazena as opções selecionadas por step + índice de escolha
  // chave: `${stepIndex}_${choiceIndex}`
  const [selectedByGroup, setSelectedByGroup] = useState<
    Record<string, string[]>
  >({});
  const [activeFilterTag, setActiveFilterTag] = useState<string>('ALL');

  if (!isOpen) return null;

  const currentLevel =
    typeof sheet.meta.level === 'number' ? sheet.meta.level : 1;

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
        {/* CABEÇALHO DO WIZARD: STEP TRACKER & TÍTULO DO STEP */}
        <div
          className="px-5 py-4 border-b space-y-3 shrink-0"
          style={{
            borderColor: 'var(--sheet-header-border, #29292e)',
            backgroundColor: 'var(--sheet-header-bg, #18181b)',
          }}
        >
          {/* Linha 1: Contexto Geral & Fechar */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                style={{
                  backgroundColor:
                    'var(--sheet-accent-subtle, rgba(130, 87, 229, 0.2))',
                  borderColor:
                    'var(--sheet-accent-border, rgba(130, 87, 229, 0.4))',
                  color: 'var(--sheet-accent-text, #c4b5fd)',
                }}
              >
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  {progression.title} • Nível {currentLevel} → {currentLevel + 1}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Linha 2: Barra Progressiva de Etapas (@step tracker) */}
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
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 border ${
                      isActive
                        ? 'bg-[var(--sheet-accent,#8257e5)] text-white border-[var(--sheet-accent,#8257e5)] shadow-md'
                        : isPast
                          ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/40'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono font-black ${
                        isActive
                          ? 'bg-white text-zinc-950'
                          : isPast
                            ? 'bg-emerald-400 text-zinc-950'
                            : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {isPast ? '✓' : idx + 1}
                    </span>
                    <span>{st.title}</span>
                    {idx < steps.length - 1 && (
                      <ArrowRight className="w-3 h-3 text-zinc-600 shrink-0 ml-1" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Linha 3: Título Proeminente da Etapa Atual (@step "Título") */}
          <div className="pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20">
                  Etapa {currentStepIndex + 1} de {steps.length}
                </span>
                {activeStep.targetModule && (
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.2 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                    <Layers className="w-2.5 h-2.5" />
                    Destino: {activeStep.targetModule}
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                {activeStep.title}
              </h2>
            </div>
            {activeStep.desc && (
              <span className="text-xs text-zinc-400 max-w-sm text-right">
                {activeStep.desc}
              </span>
            )}
          </div>
        </div>

        {/* CORPO DO PASSO ATIVO */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 min-h-0">
          {/* SEÇÃO DE BIFURCAÇÃO / CAMINHOS ALTERNATIVOS (branch "Guerreiro" vs branch "Nobre") */}
          {activeStep.branches && activeStep.branches.length > 0 && (
            <div
              className="rounded-xl border p-4 space-y-3 transition-colors"
              style={{
                backgroundColor: 'var(--sheet-item-bg, #18181b)',
                borderColor: 'var(--sheet-item-border, #29292e)',
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <GitBranch className="w-4 h-4" />
                  Bifurcação de Progressão: Escolha seu Caminho
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  Selecione 1 caminho para este avanço
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
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
                      className={`text-left p-3.5 rounded-xl border flex flex-col justify-between space-y-2.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[var(--sheet-accent,#8257e5)] bg-[var(--sheet-accent,#8257e5)]/15 shadow-lg ring-1 ring-[var(--sheet-accent,#8257e5)]'
                          : isEligible
                            ? 'border-zinc-800 bg-zinc-950/80 hover:border-zinc-700 hover:bg-zinc-900/60'
                            : 'border-zinc-800/40 bg-zinc-950/40 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-sm font-bold text-white flex items-center gap-1.5">
                            {br.title}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[var(--sheet-accent,#8257e5)] text-white">
                              ✓ Selecionado
                            </span>
                          )}
                        </div>
                        {br.desc && (
                          <p className="text-xs text-zinc-400 leading-snug line-clamp-2">
                            {br.desc}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-zinc-900 flex items-center justify-between gap-1">
                        {br.req ? (
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              isEligible
                                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                                : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                            }`}
                          >
                            {isEligible ? '✓ Qualificado' : `Requer ${br.req}`}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-zinc-500">
                            Disponível
                          </span>
                        )}

                        {br.targetModule && (
                          <span className="text-[9px] font-mono text-indigo-400">
                            {br.targetModule}
                          </span>
                        )}
                      </div>
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
                backgroundColor: 'var(--sheet-item-bg, #18181b)',
                borderColor: 'var(--sheet-item-border, #29292e)',
              }}
            >
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Ganhos Automáticos desta Etapa{activeBranch ? ` (${activeBranch.title})` : ''}:
              </span>

              <div
                className={`grid gap-3 pt-1 ${
                  activeStep.placement === 'col2' ||
                  effectiveGains[0]?.placement === 'col2'
                    ? 'grid-cols-1 sm:grid-cols-2'
                    : 'grid-cols-1 sm:grid-cols-3'
                }`}
              >
                {effectiveGains.map((gain, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border bg-zinc-950/80 border-zinc-800 flex flex-col justify-between space-y-2 hover:border-zinc-700 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-white uppercase tracking-wide truncate">
                          {gain.label || gain.target}
                        </span>
                        {gain.placement && (
                          <span className="text-[9px] font-mono text-zinc-500 uppercase">
                            [{gain.placement}]
                          </span>
                        )}
                      </div>
                      {gain.description && (
                        <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                          {gain.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-zinc-900 flex items-baseline justify-between gap-2">
                      <span className="text-lg font-black font-mono text-emerald-300">
                        {gain.op} {gain.evaluatedValue}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500 truncate">
                        {gain.exprString}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. FILTRO DE TAGS DA ETAPA */}
          {activeStepTags.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1 mr-1 shrink-0">
                <Filter className="w-3 h-3" />
                Filtrar:
              </span>
              <button
                type="button"
                onClick={() => setActiveFilterTag('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                  activeFilterTag === 'ALL'
                    ? 'text-white'
                    : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
                }`}
                style={
                  activeFilterTag === 'ALL'
                    ? { backgroundColor: 'var(--sheet-accent, #8257e5)' }
                    : undefined
                }
              >
                Todos
              </button>
              {activeStepTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveFilterTag(tag)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-colors shrink-0 ${
                    activeFilterTag === tag
                      ? 'text-white'
                      : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
                  }`}
                  style={
                    activeFilterTag === tag
                      ? { backgroundColor: 'var(--sheet-accent, #8257e5)' }
                      : undefined
                  }
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* 3. ESCOLHAS DO PASSO ATIVO (choose ... from [...]) */}
          {effectiveChoices.map((choice, cIdx) => {
            const groupKey = `${currentStepIndex}_${cIdx}`;
            const selected = selectedByGroup[groupKey] ?? [];
            const filteredOptions = choice.options.filter(
              (opt) =>
                activeFilterTag === 'ALL' ||
                opt.tags?.includes(activeFilterTag),
            );

            return (
              <div key={cIdx} className="space-y-3">
                <div className="flex items-center justify-between gap-2 px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    {choice.title}
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-300 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
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
                        className={`group relative rounded-xl border p-3.5 flex flex-col justify-between transition-all cursor-pointer select-none ${
                          disabled
                            ? 'opacity-50 cursor-not-allowed border-zinc-800 bg-zinc-950/40'
                            : isSelected
                              ? 'border-emerald-500/80 bg-emerald-950/20 shadow-lg'
                              : 'hover:border-zinc-600 bg-zinc-900/60'
                        }`}
                        style={{
                          borderColor: isSelected
                            ? undefined
                            : 'var(--sheet-item-border, #29292e)',
                        }}
                      >
                        {/* Topo do Card de Opção */}
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={`text-sm font-bold leading-tight ${
                                isSelected ? 'text-emerald-300' : 'text-zinc-100'
                              }`}
                            >
                              {opt.label}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {opt.cost && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono font-bold text-amber-300">
                                  {opt.cost}
                                </span>
                              )}
                              {opt.type && (
                                <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-semibold text-zinc-300">
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
                        <div className="pt-3 mt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2 text-[10px]">
                          <div className="flex flex-wrap items-center gap-1">
                            {opt.targetModule && (
                              <span className="px-1.5 py-0.2 rounded bg-indigo-950 border border-indigo-800/60 text-indigo-300 font-mono text-[9px]">
                                {opt.targetModule}
                              </span>
                            )}
                            {opt.tags?.map((t) => (
                              <span
                                key={t}
                                className="px-1.5 py-0.2 rounded bg-zinc-800 font-mono text-zinc-400"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>

                          <div>
                            {opt.req ? (
                              <span
                                className={`font-mono font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                                  opt.isEligible
                                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400'
                                    : 'bg-rose-950/40 border-rose-800 text-rose-400'
                                }`}
                              >
                                {opt.isEligible ? (
                                  <CheckCircle2 className="w-3 h-3" />
                                ) : (
                                  <AlertTriangle className="w-3 h-3" />
                                )}
                                Req: {opt.req}
                              </span>
                            ) : (
                              <span className="text-zinc-500 italic">
                                Sem pré-requisitos
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* RODAPÉ DE NAVEGAÇÃO PROGRESSIVA */}
        <div
          className="p-4 border-t flex items-center justify-between gap-3 shrink-0"
          style={{
            borderColor: 'var(--sheet-header-border, #29292e)',
            backgroundColor: 'var(--sheet-header-bg, #18181b)',
          }}
        >
          {isFirstStep ? (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-zinc-700 text-zinc-300 hover:text-white"
            >
              Cancelar
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
              className="border-zinc-700 text-zinc-300 hover:text-white gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Anterior</span>
            </Button>
          )}

          <div className="flex items-center gap-2">
            {!isLastStep ? (
              <Button
                type="button"
                onClick={() =>
                  setCurrentStepIndex((prev) =>
                    Math.min(steps.length - 1, prev + 1),
                  )
                }
                className="font-bold gap-1.5 px-5 bg-[var(--sheet-accent,#8257e5)] text-white hover:opacity-90"
              >
                <span>Avançar ({steps[currentStepIndex + 1]?.title})</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="button"
                disabled={!isAllRequiredSelected}
                onClick={handleConfirm}
                className="font-bold gap-2 px-6 shadow-lg"
                style={{
                  backgroundColor: isAllRequiredSelected
                    ? 'var(--sheet-accent, #8257e5)'
                    : undefined,
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar e Aplicar Evolução</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
