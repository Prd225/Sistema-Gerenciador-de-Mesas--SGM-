import React, { useState } from 'react';
import {
  Cpu,
  Sparkles,
  ArrowUpCircle,
  Package,
  Crosshair,
  Flame,
  Zap,
  CheckCircle2,
  Plus,
  Play,
  Check,
  Sliders,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useModularSheetStore } from '@/store/useModularSheetStore';
import type { CompiledSheet, EvaluatedProgression } from '@/lib/sheet-dsl';
import { ProgressionUpgradeModal } from './ProgressionUpgradeModal';

interface LogicSheetViewProps {
  sheetId: string;
  sheet: CompiledSheet;
  isMobilePortrait?: boolean;
}

export const LogicSheetView: React.FC<LogicSheetViewProps> = ({
  sheetId,
  sheet,
  isMobilePortrait = false,
}) => {
  const [activeTab, setActiveTab] = useState<'progressions' | 'ammo' | 'effects'>(
    'progressions',
  );
  const [activeProgressionModal, setActiveProgressionModal] =
    useState<EvaluatedProgression | null>(null);

  const consumeResourceOrItem = useModularSheetStore(
    (s) => s.consumeResourceOrItem,
  );
  const setToggleState = useModularSheetStore((s) => s.setToggleState);
  const updateSheetSource = useModularSheetStore((s) => s.updateSheetSource);

  // Mensagem temporária de feedback de consumo
  const [consumeFeedback, setConsumeFeedback] = useState<string | null>(null);

  const handleTestConsume = (resourceOrItemName: string, amount = 1) => {
    const res = consumeResourceOrItem(sheetId, resourceOrItemName, amount);
    if (res.success) {
      setConsumeFeedback(
        `✓ Consumido com sucesso! Saldo restante de ${res.label}: ${res.remaining} (${res.type === 'item' ? 'no Inventário' : 'em Recursos'})`,
      );
    } else {
      setConsumeFeedback(`⚠️ ${res.error || 'Não foi possível consumir.'}`);
    }
    setTimeout(() => setConsumeFeedback(null), 4000);
  };

  // Mapeia todas as ações que possuem custo ou munição
  const ammoAndCostActions: Array<{
    sourceName: string;
    sourceType: 'item' | 'ability';
    costAmount: number;
    costName: string;
    matchedInventoryItem?: { label: string; qty: number };
    matchedResource?: { label: string; current: number; max: number };
  }> = [];

  // 1. Ações de itens no inventário
  sheet.inventory.items.forEach((item) => {
    item.actions.forEach((act) => {
      if (act.cost && act.cost.amount > 0) {
        const costTarget = act.cost.resource;
        const matchedItem = sheet.inventory.items.find(
          (inv) =>
            inv.label.toLowerCase() === costTarget.toLowerCase() ||
            inv.label.toLowerCase().includes(costTarget.toLowerCase()),
        );
        const matchedRes = Object.values(sheet.resources).find(
          (r) =>
            r.id.toLowerCase() === costTarget.toLowerCase() ||
            r.label.toLowerCase() === costTarget.toLowerCase(),
        );

        ammoAndCostActions.push({
          sourceName: `${item.label} (${act.label})`,
          sourceType: 'item',
          costAmount: act.cost.amount,
          costName: costTarget,
          matchedInventoryItem: matchedItem
            ? { label: matchedItem.label, qty: matchedItem.qty }
            : undefined,
          matchedResource: matchedRes
            ? {
                label: matchedRes.label,
                current: matchedRes.current,
                max: matchedRes.max,
              }
            : undefined,
        });
      }
    });
  });

  // 2. Habilidades gerais
  sheet.abilities.forEach((ab) => {
    if (ab.cost && ab.cost.amount > 0) {
      const costTarget = ab.cost.resource;
      const matchedItem = sheet.inventory.items.find(
        (inv) =>
          inv.label.toLowerCase() === costTarget.toLowerCase() ||
          inv.label.toLowerCase().includes(costTarget.toLowerCase()),
      );
      const matchedRes = Object.values(sheet.resources).find(
        (r) =>
          r.id.toLowerCase() === costTarget.toLowerCase() ||
          r.label.toLowerCase() === costTarget.toLowerCase(),
      );

      ammoAndCostActions.push({
        sourceName: ab.label,
        sourceType: 'ability',
        costAmount: ab.cost.amount,
        costName: costTarget,
        matchedInventoryItem: matchedItem
          ? { label: matchedItem.label, qty: matchedItem.qty }
          : undefined,
        matchedResource: matchedRes
          ? {
              label: matchedRes.label,
              current: matchedRes.current,
              max: matchedRes.max,
            }
          : undefined,
      });
    }
  });

  // Efeitos e condições dinâmicas
  const dynamicToggles = sheet.descriptors.filter((d) => d.hasEffects);

  // Template rápido para adicionar uma progressão de Tormenta20 / Nível caso não haja
  const handleAddDefaultProgression = () => {
    const snippet = `
@progression "Subir de Nível" [trigger: "level_up", button: "Subir de Nível", icon: "sparkles"]
  @step "Avanço de Nível & Estatísticas"
    @gains [esq]
      "Pontos de Vida" [desc: "+5 PV por nível (+ CON)", target: "PV.max", mod: 5 + CON + pv_bonus_nivel]
      "Pontos de Mana" [desc: "+3 PM por nível", target: "PM.max", mod: 3]
      level += 1

  @step "Poder de Classe ou Geral" [target: "@ability"]
    choose 1 "Poder de Guerreiro" from [
      ability "Golpe Pessoal" [type: "Padrão", cost: 2 PM] {
        desc: "Você cria um golpe único devastador (+2d8 de dano)."
        damage: 2d8 + FOR
      }
      ability "Ataque Poderoso" [type: "Livre", req: "FOR >= 2", #combate] {
        desc: "Ao atacar, pode aplicar -2 no teste para causar +5 no dano."
      }
      ability "Vitalidade" [req: "CON >= 1", #destino] {
        desc: "Você se torna mais resistente (+1 PV por nível e +2 em Fortitude)."
        apply: "pv_bonus_nivel += 1"
      }
      ability "Sortudo" [#destino] {
        desc: "Gasta 3 PM para rolar novamente um teste recém-realizado."
        cost: 3 PM
      }
      ability "Foco em Arma" [#combate] {
        desc: "Recebe +2 em testes de ataque com a arma escolhida."
      }
    ]
`;
    const rec = useModularSheetStore.getState().sheets.find((s) => s.id === sheetId);
    if (rec) {
      updateSheetSource(sheetId, `${rec.dslSource.trimEnd()}\n\n${snippet}\n`);
    }
  };

  return (
    <div
      className={`flex-1 overflow-y-auto space-y-6 max-w-5xl mx-auto w-full transition-colors animate-in fade-in duration-200 ${
        isMobilePortrait ? 'p-2 sm:p-3' : 'p-4 sm:p-6'
      }`}
    >
      {/* CABEÇALHO DA FOLHA LÓGICA */}
      <div
        className="rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
        style={{
          backgroundColor: 'var(--sheet-card-bg, #18181b)',
          borderColor: 'var(--sheet-card-border, #29292e)',
        }}
      >
        <div className="flex items-center gap-3.5">
          <div
            className="w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 shadow-lg"
            style={{
              backgroundColor:
                'var(--sheet-accent-subtle, rgba(130, 87, 229, 0.2))',
              borderColor:
                'var(--sheet-accent-border, rgba(130, 87, 229, 0.4))',
              color: 'var(--sheet-accent-text, #c4b5fd)',
            }}
          >
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              Folha Lógica & Mecânicas Programáveis
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                SGM Logic
              </span>
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
              Automações dinâmicas de evolução, conexão de munições/inventário e
              efeitos condicionais em tempo de execução.
            </p>
          </div>
        </div>

        {/* NAVEGAÇÃO DE SUB-ABAS DA FOLHA LÓGICA */}
        <div className="inline-flex rounded-xl border border-zinc-800 bg-zinc-950 p-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('progressions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'progressions'
                ? 'bg-[var(--sheet-accent,#8257e5)] text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Progressão ({sheet.progressions.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ammo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'ammo'
                ? 'bg-[var(--sheet-accent,#8257e5)] text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Munição & Custos ({ammoAndCostActions.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('effects')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'effects'
                ? 'bg-[var(--sheet-accent,#8257e5)] text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Efeitos Ativos ({dynamicToggles.length})</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK DE CONSUMO TOAST / BANNER */}
      {consumeFeedback && (
        <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-xs font-mono text-amber-200 animate-in fade-in duration-150">
          {consumeFeedback}
        </div>
      )}

      {/* ====================================================================
          1. ABA DE PROGRESSÃO & UPGRADES PROGRAMÁVEIS
         ==================================================================== */}
      {activeTab === 'progressions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Sistemas de Upgrades e Evolução Declarados
            </span>

            {sheet.progressions.length === 0 && (
              <Button
                type="button"
                onClick={handleAddDefaultProgression}
                className="h-8 px-3 text-xs font-bold bg-[#8257e5] hover:bg-[#9466ff] text-white gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Inserir Modelo de Progressão (Tormenta 20)</span>
              </Button>
            )}
          </div>

          {sheet.progressions.length === 0 ? (
            <div
              className="rounded-2xl border border-dashed p-8 text-center space-y-3"
              style={{
                backgroundColor: 'var(--sheet-card-bg, #18181b)',
                borderColor: 'var(--sheet-card-border, #29292e)',
              }}
            >
              <ArrowUpCircle className="w-10 h-10 text-zinc-600 mx-auto" />
              <h3 className="text-sm font-bold text-zinc-200">
                Nenhum Bloco de Progressão (@progression) configurado nesta ficha.
              </h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                Você pode declarar progressões modulares como subir de nível, compra de
                atributos por pontos ou árvores de talentos via DSL ou adicionar o modelo
                pronto agora.
              </p>
              <Button
                type="button"
                onClick={handleAddDefaultProgression}
                className="font-bold text-xs bg-[#8257e5] hover:bg-[#9466ff] text-white gap-2 px-5"
              >
                <Plus className="w-4 h-4" />
                Adicionar @progression "Subir de Nível" (Tormenta20)
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {sheet.progressions.map((prog) => (
                <div
                  key={prog.id}
                  className="rounded-2xl border p-4 sm:p-5 space-y-4 transition-colors shadow-lg"
                  style={{
                    backgroundColor: 'var(--sheet-card-bg, #18181b)',
                    borderColor: 'var(--sheet-card-border, #29292e)',
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wide">
                          {prog.title}
                        </h3>
                        <span className="text-[10px] font-mono text-zinc-500">
                          Gatilho: {prog.trigger} • Repetível:{' '}
                          {prog.repeatable ? 'Sim' : 'Único'}
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={() => setActiveProgressionModal(prog)}
                      className="font-bold text-xs gap-2 px-4 shadow-lg hover:scale-105 transition-transform"
                      style={{
                        backgroundColor: 'var(--sheet-accent, #8257e5)',
                      }}
                    >
                      <ArrowUpCircle className="w-4 h-4" />
                      <span>{prog.buttonLabel || 'Executar Progressão'}</span>
                    </Button>
                  </div>

                  {/* Resumo dos Passos (@step) ou Ganhos Gerais */}
                  {prog.steps && prog.steps.length > 0 ? (
                    <div className="space-y-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5" />
                        Etapas Configuradas ({prog.steps.length}):
                      </span>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {prog.steps.map((st, sIdx) => (
                          <div
                            key={st.id || sIdx}
                            className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5 space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-2 border-b border-zinc-900 pb-2">
                              <span className="text-xs font-black text-white flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center text-[10px] font-mono">
                                  {sIdx + 1}
                                </span>
                                {st.title}
                              </span>
                              {st.targetModule && (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                                  {st.targetModule}
                                </span>
                              )}
                            </div>

                            {/* Ganhos deste passo */}
                            {st.gains.length > 0 && (
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase text-emerald-400">
                                  Ganhos ({st.gains.length}):
                                </span>
                                {st.gains.map((g, gi) => (
                                  <div
                                    key={gi}
                                    className="flex items-center justify-between text-xs font-mono py-0.5"
                                  >
                                    <span className="text-zinc-300">{g.label || g.target}</span>
                                    <span className="text-emerald-300 font-bold">
                                      {g.op} {g.evaluatedValue}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Escolhas deste passo */}
                            {st.choices.length > 0 && (
                              <div className="space-y-1 pt-1 border-t border-zinc-900">
                                <span className="text-[10px] font-bold uppercase text-amber-400">
                                  Escolhas:
                                </span>
                                {st.choices.map((c, ci) => (
                                  <div key={ci} className="space-y-1">
                                    <span className="text-[10px] text-zinc-400 block">
                                      {c.title} (Escolha {c.count}):
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                      {c.options.map((opt) => (
                                        <span
                                          key={opt.id}
                                          className={`px-1.5 py-0.2 rounded text-[10px] font-mono border ${
                                            opt.isEligible
                                              ? 'bg-zinc-900 border-zinc-700 text-zinc-200'
                                              : 'bg-rose-950/30 border-rose-900 text-rose-400 line-through'
                                          }`}
                                        >
                                          {opt.label}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Ganhos Automáticos */}
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Ganhos Automáticos ({prog.gains.length})
                        </span>
                        <div className="space-y-1">
                          {prog.gains.map((g, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between text-xs font-mono py-0.5 border-b border-zinc-900"
                            >
                              <span className="text-zinc-300 font-bold">{g.target}</span>
                              <span className="text-emerald-300 font-bold">
                                {g.op} {g.evaluatedValue} ({g.exprString})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Escolhas de Poderes / Opções */}
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5" />
                          Opções & Poderes ({prog.choices.reduce((acc, c) => acc + c.options.length, 0)})
                        </span>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {prog.choices.map((c, i) => (
                            <div key={i} className="space-y-1">
                              <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                                {c.title} (Escolha {c.count}):
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {c.options.map((opt) => (
                                  <span
                                    key={opt.id}
                                    className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                                      opt.isEligible
                                        ? 'bg-zinc-900 border-zinc-700 text-zinc-200'
                                        : 'bg-rose-950/30 border-rose-900 text-rose-400 line-through'
                                    }`}
                                    title={opt.req ? `Req: ${opt.req}` : 'Sem requisitos'}
                                  >
                                    {opt.label}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          2. ABA DE CONSUMO DINÂMICO & MUNIÇÕES (INVENTÁRIO <-> AÇÕES)
         ==================================================================== */}
      {activeTab === 'ammo' && (
        <div className="space-y-4">
          <div className="px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-sky-400" />
              Rastreamento de Munição e Gastos por Ação
            </span>
          </div>

          {ammoAndCostActions.length === 0 ? (
            <div
              className="rounded-2xl border border-dashed p-8 text-center space-y-2"
              style={{
                backgroundColor: 'var(--sheet-card-bg, #18181b)',
                borderColor: 'var(--sheet-card-border, #29292e)',
              }}
            >
              <Package className="w-9 h-9 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-400">
                Nenhuma ação com custo de recurso ou munição configurada.
              </p>
              <span className="text-[11px] font-mono text-zinc-500 block">
                Declare em suas habilidades ou itens: action "Disparo" [cost: 1 "Flecha"]
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ammoAndCostActions.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border p-4 flex flex-col justify-between gap-3 transition-colors"
                  style={{
                    backgroundColor: 'var(--sheet-card-bg, #18181b)',
                    borderColor: 'var(--sheet-card-border, #29292e)',
                  }}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-white truncate">
                        {item.sourceName}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        {item.sourceType === 'item' ? 'Item' : 'Habilidade'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-zinc-400">Consome por disparo:</span>
                      <span className="font-mono font-bold text-amber-300">
                        {item.costAmount}x {item.costName}
                      </span>
                    </div>

                    {/* Status de estoque no inventário ou recurso */}
                    <div className="pt-2 border-t border-zinc-800 text-xs flex items-center justify-between">
                      {item.matchedInventoryItem ? (
                        <div className="flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="text-zinc-300">
                            Inventário: <b>{item.matchedInventoryItem.qty} un</b>
                          </span>
                        </div>
                      ) : item.matchedResource ? (
                        <div className="flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-zinc-300">
                            Recurso: <b>{item.matchedResource.current}/{item.matchedResource.max}</b>
                          </span>
                        </div>
                      ) : (
                        <span className="text-rose-400 text-[11px] font-mono">
                          ⚠️ Não encontrado no inventário
                        </span>
                      )}

                      {/* Botão de teste de disparo / gasto */}
                      <button
                        type="button"
                        onClick={() =>
                          handleTestConsume(item.costName, item.costAmount)
                        }
                        className="px-2.5 py-1 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-[11px] font-mono font-bold text-zinc-200 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <Play className="w-3 h-3 text-amber-400" />
                        Gastar {item.costAmount}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          3. ABA DE EFEITOS ATIVOS & CONDIÇÕES DINÂMICAS
         ==================================================================== */}
      {activeTab === 'effects' && (
        <div className="space-y-4">
          <div className="px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              Condições e Posturas Dinâmicas Mecanizadas
            </span>
          </div>

          {dynamicToggles.length === 0 ? (
            <div
              className="rounded-2xl border border-dashed p-8 text-center space-y-2"
              style={{
                backgroundColor: 'var(--sheet-card-bg, #18181b)',
                borderColor: 'var(--sheet-card-border, #29292e)',
              }}
            >
              <Sliders className="w-9 h-9 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-400">
                Nenhum efeito ou condição com modificadores dinâmicos configurada.
              </p>
              <span className="text-[11px] font-mono text-zinc-500 block">
                Declare em @desc: tag "Fúria" [active: false] -&gt; Luta += 2 | Dano += 2
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {dynamicToggles.map((tog) => (
                <div
                  key={tog.id}
                  className={`rounded-xl border p-4 flex items-center justify-between gap-3 transition-all ${
                    tog.active
                      ? 'border-emerald-500/60 bg-emerald-950/20 shadow-md'
                      : 'border-zinc-800 bg-zinc-900/60'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <span className="text-sm font-bold text-white block truncate">
                      {tog.label}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {tog.effectSummaries.map((eff, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 font-mono text-[10px] text-emerald-300"
                        >
                          {eff}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setToggleState(sheetId, tog.id, !tog.active)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 ${
                      tog.active
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'border border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {tog.active ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Ativado
                      </>
                    ) : (
                      'Desativado'
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL DE PROGRESSÃO / LEVEL UP */}
      {activeProgressionModal && (
        <ProgressionUpgradeModal
          isOpen={Boolean(activeProgressionModal)}
          onClose={() => setActiveProgressionModal(null)}
          sheetId={sheetId}
          sheet={sheet}
          progression={activeProgressionModal}
        />
      )}
    </div>
  );
};
