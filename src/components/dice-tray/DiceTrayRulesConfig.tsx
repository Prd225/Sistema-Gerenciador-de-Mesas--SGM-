import { useDiceTrayStore, type DiceTrayRules } from '@/store/useDiceTrayStore';
import { Sliders, Sparkles, Skull, Target, Layers, CheckCircle2 } from 'lucide-react';

export default function DiceTrayRulesConfig() {
  const rules = useDiceTrayStore((state) => state.rules);
  const setRules = useDiceTrayStore((state) => state.setRules);

  const applyPreset = (presetRules: Partial<DiceTrayRules>) => {
    setRules(presetRules);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#141417] text-white p-4 overflow-y-auto select-none space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center gap-2 pb-3 border-b border-[#27272a]">
        <Sliders className="w-4 h-4 text-[#8257e5]" />
        <div>
          <h3 className="text-sm font-bold tracking-wide text-[#e4e4e7]">
            Regras de Sucesso e Críticos
          </h3>
          <p className="text-xs text-[#71717a]">
            Personalize os critérios de avaliação automática para os dados da bandeja.
          </p>
        </div>
      </div>

      {/* Presets Rápidos de Sistemas */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717a] block mb-2">
          Presets Rápidos de Sistema
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() =>
              applyPreset({
                critPositive: 20,
                critNegative: 1,
                ruleMode: 'sum',
                poolThreshold: null,
              })
            }
            className="p-2.5 rounded-lg border border-[#27272a] bg-[#18181b] hover:bg-[#202024] hover:border-[#8257e5] transition-all text-left flex flex-col gap-1 active:scale-95"
          >
            <span className="text-xs font-bold text-[#e4e4e7]">D&D / T20</span>
            <span className="text-[10px] text-[#71717a]">Crit 20 • Fumble 1</span>
          </button>

          <button
            type="button"
            onClick={() =>
              applyPreset({
                critPositive: 19,
                critNegative: 1,
                ruleMode: 'highest',
                poolThreshold: null,
              })
            }
            className="p-2.5 rounded-lg border border-[#27272a] bg-[#18181b] hover:bg-[#202024] hover:border-[#8257e5] transition-all text-left flex flex-col gap-1 active:scale-95"
          >
            <span className="text-xs font-bold text-[#e4e4e7]">Ordem Paranormal</span>
            <span className="text-[10px] text-[#71717a]">Maior dado • Crit 19+</span>
          </button>

          <button
            type="button"
            onClick={() =>
              applyPreset({
                ruleMode: 'pool',
                poolThreshold: 6,
                critPositive: 20,
                critNegative: 1,
              })
            }
            className="p-2.5 rounded-lg border border-[#27272a] bg-[#18181b] hover:bg-[#202024] hover:border-[#8257e5] transition-all text-left flex flex-col gap-1 active:scale-95"
          >
            <span className="text-xs font-bold text-[#e4e4e7]">Parada de Dados</span>
            <span className="text-[10px] text-[#71717a]">Sucessos no 6+</span>
          </button>

          <button
            type="button"
            onClick={() =>
              applyPreset({
                critPositive: 1,
                critNegative: 96,
                ruleMode: 'sum',
                poolThreshold: null,
              })
            }
            className="p-2.5 rounded-lg border border-[#27272a] bg-[#18181b] hover:bg-[#202024] hover:border-[#8257e5] transition-all text-left flex flex-col gap-1 active:scale-95"
          >
            <span className="text-xs font-bold text-[#e4e4e7]">Cthulhu (d100)</span>
            <span className="text-[10px] text-[#71717a]">Crit 1 • Fumble 96+</span>
          </button>
        </div>
      </div>

      {/* Modo de Avaliação */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-3.5 space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717a] block">
          Modo de Avaliação da Rolagem
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setRules({ ruleMode: 'sum' })}
            className={`p-2 rounded-lg border text-xs text-left transition-all ${
              rules.ruleMode === 'sum'
                ? 'bg-[#8257e5]/20 border-[#8257e5] text-white font-bold'
                : 'border-[#27272a] bg-[#202024]/60 text-[#a1a1aa] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Soma Geral</span>
            </div>
            <p className="text-[10px] text-[#71717a] font-normal">
              Soma todas as faces dos dados + modificador
            </p>
          </button>

          <button
            type="button"
            onClick={() => setRules({ ruleMode: 'pool' })}
            className={`p-2 rounded-lg border text-xs text-left transition-all ${
              rules.ruleMode === 'pool'
                ? 'bg-[#8257e5]/20 border-[#8257e5] text-white font-bold'
                : 'border-[#27272a] bg-[#202024]/60 text-[#a1a1aa] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Parada de Dados (Dice Pool)</span>
            </div>
            <p className="text-[10px] text-[#71717a] font-normal">
              Conta dados que atingiram o valor mínimo de sucesso
            </p>
          </button>

          <button
            type="button"
            onClick={() => setRules({ ruleMode: 'highest' })}
            className={`p-2 rounded-lg border text-xs text-left transition-all ${
              rules.ruleMode === 'highest'
                ? 'bg-[#8257e5]/20 border-[#8257e5] text-white font-bold'
                : 'border-[#27272a] bg-[#202024]/60 text-[#a1a1aa] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Maior Dado</span>
            </div>
            <p className="text-[10px] text-[#71717a] font-normal">
              Utiliza apenas o valor mais alto entre os dados rolados
            </p>
          </button>

          <button
            type="button"
            onClick={() => setRules({ ruleMode: 'lowest' })}
            className={`p-2 rounded-lg border text-xs text-left transition-all ${
              rules.ruleMode === 'lowest'
                ? 'bg-[#8257e5]/20 border-[#8257e5] text-white font-bold'
                : 'border-[#27272a] bg-[#202024]/60 text-[#a1a1aa] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <Target className="w-3.5 h-3.5 text-purple-400" />
              <span>Menor Dado</span>
            </div>
            <p className="text-[10px] text-[#71717a] font-normal">
              Utiliza o menor valor rolado (desvantagem)
            </p>
          </button>
        </div>
      </div>

      {/* Limiares de Crítico e Fumble */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Crítico Positivo */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 text-amber-400 mb-2">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Crítico Positivo
            </span>
          </div>
          <p className="text-xs text-[#71717a] mb-2">
            Valor igual ou superior a este ativa fanfarra e destaque dourado.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={rules.critPositive}
              onChange={(e) => setRules({ critPositive: Number(e.target.value) || 20 })}
              className="w-24 px-3 py-1.5 rounded-lg bg-[#202024] border border-[#323238] text-sm font-mono text-white focus:outline-none focus:border-amber-400"
            />
            <span className="text-xs text-[#71717a]">ou superior</span>
          </div>
        </div>

        {/* Desastre Crítico / Fumble */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 text-red-400 mb-2">
            <Skull className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Desastre Crítico (Fumble)
            </span>
          </div>
          <p className="text-xs text-[#71717a] mb-2">
            Valor igual ou inferior a este ativa som grave e destaque vermelho.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={rules.critNegative}
              onChange={(e) => setRules({ critNegative: Number(e.target.value) || 1 })}
              className="w-24 px-3 py-1.5 rounded-lg bg-[#202024] border border-[#323238] text-sm font-mono text-white focus:outline-none focus:border-red-400"
            />
            <span className="text-xs text-[#71717a]">ou inferior</span>
          </div>
        </div>
      </div>

      {/* Dificuldade Alvo (DC) e Limiar de Parada */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Dificuldade Alvo (DC) */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-[#e4e4e7]">
              <Target className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Dificuldade Alvo (DC)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setRules({ successDC: rules.successDC === null ? 15 : null })}
              className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase transition-colors ${
                rules.successDC !== null
                  ? 'bg-purple-600 text-white'
                  : 'bg-[#27272a] text-[#71717a]'
              }`}
            >
              {rules.successDC !== null ? 'Ativo' : 'Desativado'}
            </button>
          </div>
          <p className="text-xs text-[#71717a] mb-2">
            Total maior ou igual a esse valor é considerado Sucesso no Teste.
          </p>
          {rules.successDC !== null && (
            <input
              type="number"
              value={rules.successDC}
              onChange={(e) => setRules({ successDC: Number(e.target.value) || 0 })}
              className="w-24 px-3 py-1.5 rounded-lg bg-[#202024] border border-[#323238] text-sm font-mono text-white focus:outline-none focus:border-purple-400"
            />
          )}
        </div>

        {/* Limiar de Parada de Dados */}
        {rules.ruleMode === 'pool' && (
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 text-purple-400 mb-2">
              <Layers className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Sucesso por Dado (Pool)
              </span>
            </div>
            <p className="text-xs text-[#71717a] mb-2">
              Cada dado com face igual ou superior a este conta como 1 sucesso.
            </p>
            <input
              type="number"
              value={rules.poolThreshold ?? 6}
              onChange={(e) => setRules({ poolThreshold: Number(e.target.value) || 6 })}
              className="w-24 px-3 py-1.5 rounded-lg bg-[#202024] border border-[#323238] text-sm font-mono text-white focus:outline-none focus:border-purple-400"
            />
          </div>
        )}
      </div>
    </div>
  );
}
