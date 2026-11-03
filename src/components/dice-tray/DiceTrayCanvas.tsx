import { useRef } from 'react';
import { useDiceTrayStore } from '@/store/useDiceTrayStore';
import { useMultiplayerStore } from '@/store/useMultiplayerStore';
import AnimatedDiceCard from './AnimatedDiceCard';
import { Dices, RotateCcw } from 'lucide-react';

export default function DiceTrayCanvas() {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dice = useDiceTrayStore((state) => state.dice);
  const isRolling = useDiceTrayStore((state) => state.isRolling);
  const lastRollResult = useDiceTrayStore((state) => state.lastRollResult);
  const rollDice = useDiceTrayStore((state) => state.rollDice);

  const userName = useMultiplayerStore((state) => state.userName);
  const role = useMultiplayerStore((state) => state.role);

  const handleRollAgain = () => {
    const sender = userName?.trim()
      ? userName.trim()
      : role === 'player'
      ? 'Jogador'
      : 'Mestre';
    rollDice(sender, role || 'gm');
  };

  return (
    <div
      ref={canvasRef}
      className="relative flex-1 w-full h-full min-h-[300px] overflow-hidden rounded-xl border border-[#27272a] bg-[#111216] select-none shadow-inner"
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 50%, rgba(30, 32, 40, 0.9) 0%, rgba(14, 15, 19, 0.98) 100%),
          repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.01) 0, rgba(255, 255, 255, 0.01) 2px, transparent 2px, transparent 6px)
        `,
      }}
    >
      {/* Moldura de Feltro / Textura Interior */}
      <div className="absolute inset-1 rounded-lg border border-[#27272a]/60 pointer-events-none" />

      {/* Marca d'água sutil no fundo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
        <Dices className="w-56 h-56 text-white" />
      </div>

      {/* Estado Vazio */}
      {dice.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-[#71717a] pointer-events-none">
          <Dices className="w-12 h-12 mb-3 text-[#3f3f46] animate-pulse" />
          <p className="text-sm font-semibold text-[#a1a1aa]">Bandeja Vazia</p>
          <p className="text-xs max-w-xs mt-1 text-[#71717a]">
            Selecione dados na barra lateral para colocar na bandeja e role quando estiver pronto.
          </p>
        </div>
      )}

      {/* Dados na Bandeja */}
      {dice.map((die) => (
        <AnimatedDiceCard key={die.id} die={die} canvasRef={canvasRef} />
      ))}

      {/* Placa de Resultado no Rodapé da Bandeja */}
      {lastRollResult && (
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-4 py-2.5 rounded-lg bg-[#18181b]/95 border border-[#323238] shadow-xl backdrop-blur-md z-30 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium text-[#a1a1aa]">
                {lastRollResult.formula}
              </span>
              <span className="text-[10px] text-[#71717a]">•</span>
              <span className="text-[11px] font-mono text-[#71717a] truncate max-w-[180px] sm:max-w-xs">
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

          <div className="flex items-center gap-3">
            {/* Total Numérico */}
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-[#71717a] tracking-wider">
                Total
              </span>
              <span
                className={`font-mono font-black text-2xl leading-none ${
                  lastRollResult.outcomeTier === 'crit'
                    ? 'text-amber-400'
                    : lastRollResult.outcomeTier === 'fumble'
                    ? 'text-red-400'
                    : 'text-white'
                }`}
              >
                {lastRollResult.total}
              </span>
            </div>

            {/* Botão de Rolar Novamente com Mesmos Dados */}
            <button
              type="button"
              disabled={isRolling || dice.length === 0}
              onClick={handleRollAgain}
              className="p-2 rounded-lg bg-[#8257e5] hover:bg-[#9466ff] disabled:opacity-50 text-white transition-all active:scale-95 shadow-md"
              title="Rolar novamente"
            >
              <RotateCcw className={`w-4 h-4 ${isRolling ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
