import { useRef } from 'react';
import { useDiceTrayStore } from '@/store/useDiceTrayStore';
import AnimatedDiceCard from './AnimatedDiceCard';
import { Dices } from 'lucide-react';

interface DiceTrayCanvasProps {
  isMobileLandscape?: boolean;
}

export default function DiceTrayCanvas({ isMobileLandscape = false }: DiceTrayCanvasProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dice = useDiceTrayStore((state) => state.dice);
  const lastRollResult = useDiceTrayStore((state) => state.lastRollResult);

  return (
    <div
      ref={canvasRef}
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

      {/* Placa de Resultado no Rodapé da Bandeja */}
      {lastRollResult && (
        <div
          className={`absolute bottom-2 left-2 ${
            isMobileLandscape ? 'right-20' : 'right-2 sm:right-3'
          } sm:bottom-3 sm:left-3 flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-[#18181b]/95 border border-[#323238] shadow-xl backdrop-blur-md z-30 animate-in fade-in slide-in-from-bottom-2 duration-150`}
        >
          <div className="flex flex-col min-w-0 pr-2">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs font-mono font-medium text-[#a1a1aa]">
                {lastRollResult.formula}
              </span>
              <span className="text-[10px] text-[#71717a]">•</span>
              <span className="text-[11px] font-mono text-[#71717a] truncate max-w-[120px] sm:max-w-xs">
                [{lastRollResult.breakdown}]
              </span>
            </div>

            {/* Rótulo de Sucesso / Crítico */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  lastRollResult.outcomeTier === 'crit'
                    ? 'text-amber-400'
                    : lastRollResult.outcomeTier === 'fumble'
                    ? 'text-red-400'
                    : lastRollResult.outcomeTier === 'success'
                    ? 'text-emerald-400'
                    : lastRollResult.outcomeTier === 'fail'
                    ? 'text-rose-400'
                    : 'text-[#a1a1aa]'
                }`}
              >
                {lastRollResult.outcomeLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Total Numérico */}
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-[#71717a] tracking-wider">
                Total
              </span>
              <span
                className={`text-2xl font-black font-mono leading-none tracking-tight ${
                  lastRollResult.outcomeTier === 'crit'
                    ? 'text-amber-400'
                    : lastRollResult.outcomeTier === 'fumble'
                    ? 'text-red-400'
                    : lastRollResult.outcomeTier === 'success'
                    ? 'text-emerald-400'
                    : 'text-white'
                }`}
              >
                {lastRollResult.total}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
