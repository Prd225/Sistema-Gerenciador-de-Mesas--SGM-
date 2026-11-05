import { useRef, useState, useEffect } from 'react';
import { useDiceTrayStore } from '@/store/useDiceTrayStore';
import AnimatedDiceCard from './AnimatedDiceCard';
import { Dices, X, ChevronDown, ChevronUp } from 'lucide-react';

interface DiceTrayCanvasProps {
  isMobileLandscape?: boolean;
}

export default function DiceTrayCanvas({ isMobileLandscape: _isMobileLandscape = false }: DiceTrayCanvasProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dice = useDiceTrayStore((state) => state.dice);
  const lastRollResult = useDiceTrayStore((state) => state.lastRollResult);
  const isRolling = useDiceTrayStore((state) => state.isRolling);
  const clearLastRollResult = useDiceTrayStore((state) => state.clearLastRollResult);
  const selectedDieIds = useDiceTrayStore((state) => state.selectedDieIds);
  const clearSelectedDice = useDiceTrayStore((state) => state.clearSelectedDice);
  const [isExpanded, setIsExpanded] = useState(false);

  // Fecha o expansor quando um novo resultado for limpo
  useEffect(() => {
    if (!lastRollResult) {
      setIsExpanded(false);
    }
  }, [lastRollResult]);

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    // Se clicar no feltro vazio e houver dados selecionados, desmarca a seleção
    if (e.target === canvasRef.current && selectedDieIds.length > 0) {
      clearSelectedDice();
    }
  };

  return (
    <div
      ref={canvasRef}
      onPointerDown={handleCanvasPointerDown}
      className="relative flex-1 w-full h-full min-h-[160px] bg-[#121214] overflow-hidden select-none touch-none"
    >
      {/* Feltro com Textura Tátil e Bordas Suaves */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#27272a_1px,transparent_1px)]"
        style={{ backgroundSize: '18px 18px' }}
      />

      {/* Marca d'água de Dados no Centro do Feltro */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035]">
        <Dices className="w-56 h-56 text-white stroke-[1]" />
      </div>

      {/* Instrução quando a bandeja estiver vazia */}
      {dice.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none select-none z-0">
          <div className="w-14 h-14 rounded-2xl bg-[#202024]/60 border border-[#27272a] flex items-center justify-center mb-3 text-[#71717a] shadow-inner">
            <Dices className="w-7 h-7" />
          </div>
          <p className="text-sm font-semibold text-[#e4e4e7]">A bandeja está vazia</p>
          <p className="text-xs text-[#71717a] max-w-xs mt-1">
            Selecione dados na barra lateral para rolar na mesa virtual.
          </p>
        </div>
      )}

      {/* Dados na Bandeja */}
      {dice.map((die) => (
        <AnimatedDiceCard key={die.id} die={die} canvasRef={canvasRef} />
      ))}

      {/* Pop-up Central de Resultado (Permanece até clicar no X) */}
      {lastRollResult && !isRolling && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 p-4">
          <div className="pointer-events-auto relative flex flex-col items-center bg-[#18181b]/95 border border-[#323238] rounded-2xl shadow-2xl p-4 sm:p-5 min-w-[210px] max-w-[280px] sm:max-w-xs backdrop-blur-md animate-in zoom-in-95 fade-in duration-200">
            {/* Botão de Fechar */}
            <button
              type="button"
              onClick={clearLastRollResult}
              className="absolute top-2.5 right-2.5 p-1 text-[#71717a] hover:text-white rounded-lg hover:bg-[#27272a] transition-colors cursor-pointer touch-manipulation"
              aria-label="Fechar resultado"
              title="Fechar resultado (X)"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Rótulo de Sucesso / Crítico / Falha */}
            <span
              className={`text-xs font-bold uppercase tracking-wider text-center ${
                lastRollResult.outcomeTier === 'crit'
                  ? 'text-amber-400 font-black drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                  : lastRollResult.outcomeTier === 'extreme'
                  ? 'text-emerald-400 font-black drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]'
                  : lastRollResult.outcomeTier === 'fumble'
                  ? 'text-red-400 font-black drop-shadow-[0_0_8px_rgba(248,113,113,0.3)]'
                  : lastRollResult.outcomeTier === 'success'
                  ? 'text-emerald-400 font-black'
                  : lastRollResult.outcomeTier === 'fail'
                  ? 'text-rose-400 font-black'
                  : 'text-[#a1a1aa]'
              }`}
            >
              {lastRollResult.outcomeLabel}
            </span>

            {/* Total Numérico Centralizado e Grande */}
            <span
              className={`text-5xl sm:text-6xl font-black font-mono tracking-tight my-1.5 text-center ${
                lastRollResult.outcomeTier === 'crit'
                  ? 'text-amber-400'
                  : lastRollResult.outcomeTier === 'extreme'
                  ? 'text-emerald-400'
                  : lastRollResult.outcomeTier === 'fumble'
                  ? 'text-red-400'
                  : lastRollResult.outcomeTier === 'success'
                  ? 'text-emerald-400'
                  : 'text-white'
              }`}
            >
              {lastRollResult.total}
            </span>

            {/* Expansor de cálculo retrátil (Disponível tanto no PC quanto no Mobile) */}
            <div className="w-full flex flex-col items-center mt-1">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-[11px] font-medium text-[#a1a1aa] hover:text-white py-0.5 px-2.5 rounded-lg bg-[#202024]/60 border border-[#27272a] hover:bg-[#27272a] transition-colors cursor-pointer touch-manipulation"
              >
                <span>{isExpanded ? 'Ocultar cálculo' : 'Ver cálculo'}</span>
                {isExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 text-[#8257e5]" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-[#71717a]" />
                )}
              </button>

              {isExpanded && (
                <div className="w-full mt-2 text-center text-xs font-mono text-[#a1a1aa] bg-[#121214]/90 p-2.5 rounded-xl border border-[#27272a] animate-in fade-in duration-150">
                  <div className="text-white font-semibold break-words max-h-24 overflow-y-auto">
                    {lastRollResult.formula}
                  </div>
                  <div className="text-[11px] text-[#71717a] mt-0.5 break-all max-h-24 overflow-y-auto">
                    [{lastRollResult.breakdown}]
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
