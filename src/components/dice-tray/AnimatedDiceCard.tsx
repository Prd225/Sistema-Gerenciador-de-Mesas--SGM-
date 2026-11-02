import React, { useState, useRef } from 'react';
import { useDiceTrayStore, type TrayDie } from '@/store/useDiceTrayStore';
import { Plus, Minus, X, Sparkles, Skull } from 'lucide-react';

interface AnimatedDiceCardProps {
  die: TrayDie;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

export default function AnimatedDiceCard({ die, canvasRef }: AnimatedDiceCardProps) {
  const isRolling = die.isRolling;
  const incrementDie = useDiceTrayStore((state) => state.incrementDie);
  const decrementDie = useDiceTrayStore((state) => state.decrementDie);
  const removeDie = useDiceTrayStore((state) => state.removeDie);
  const updateDiePosition = useDiceTrayStore((state) => state.updateDiePosition);
  const rules = useDiceTrayStore((state) => state.rules);

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialDieX: number; initialDieY: number }>({
    startX: 0,
    startY: 0,
    initialDieX: die.x,
    initialDieY: die.y,
  });

  const isD20 = die.faces === 20;
  const isCrit = !isRolling && isD20 && die.currentValue >= rules.critPositive;
  const isFumble = !isRolling && isD20 && die.currentValue <= rules.critNegative;

  // Iniciar arrasto livre pelo feltro da bandeja
  const handlePointerDown = (e: React.PointerEvent) => {
    // Evita iniciar arrasto se clicou em um dos botões de controle (+, -, X)
    if ((e.target as HTMLElement).closest('button')) return;

    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialDieX: die.x,
      initialDieY: die.y,
    };

    const handlePointerMove = (moveEv: PointerEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const deltaPixelX = moveEv.clientX - dragStartRef.current.startX;
      const deltaPixelY = moveEv.clientY - dragStartRef.current.startY;

      const deltaPercentX = (deltaPixelX / rect.width) * 100;
      const deltaPercentY = (deltaPixelY / rect.height) * 100;

      const newX = Math.max(8, Math.min(92, dragStartRef.current.initialDieX + deltaPercentX));
      const newY = Math.max(10, Math.min(90, dragStartRef.current.initialDieY + deltaPercentY));

      updateDiePosition(die.id, Math.round(newX * 10) / 10, Math.round(newY * 10) / 10);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      style={{
        left: `${die.x}%`,
        top: `${die.y}%`,
        transform: `translate(-50%, -50%) rotate(${die.rotation}deg) scale(${isDragging ? 1.08 : 1})`,
      }}
      className={`group absolute select-none cursor-grab active:cursor-grabbing transition-transform ${
        isDragging ? 'z-50 duration-75' : 'z-10 duration-200'
      }`}
    >
      {/* Container Principal do Dado */}
      <div
        className={`relative flex flex-col items-center justify-center w-20 h-20 rounded-2xl border-2 bg-gradient-to-b from-[#202024] to-[#141417] shadow-lg transition-all ${
          isCrit
            ? 'border-amber-400 bg-amber-950/20 shadow-amber-950/40'
            : isFumble
            ? 'border-red-500 bg-red-950/20 shadow-red-950/40'
            : 'border-[#323238] hover:border-[#8257e5]'
        } ${isRolling ? 'animate-bounce shadow-purple-900/30' : ''}`}
      >
        {/* Marcador do Tipo de Dado (d4, d6, d20, etc.) */}
        <span
          className="absolute top-1.5 left-2 text-[10px] font-black uppercase tracking-wider opacity-60"
          style={{ color: die.color }}
        >
          d{die.faces}
        </span>

        {/* Ícone de Destaque Crítico / Desastre */}
        {isCrit && (
          <div className="absolute top-1.5 right-1.5 text-amber-400 animate-pulse" title="Crítico Positivo!">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        )}
        {isFumble && (
          <div className="absolute top-1.5 right-1.5 text-red-500 animate-pulse" title="Desastre Crítico!">
            <Skull className="w-3.5 h-3.5" />
          </div>
        )}

        {/* Botão de Remover (Aparece no Hover) */}
        {!isRolling && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeDie(die.id);
            }}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#18181b] border border-[#3f3f46] text-[#a1a1aa] hover:text-white hover:bg-red-600 hover:border-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            title="Remover dado da bandeja"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {/* Face do Dado (Número Grande) */}
        <div
          className={`flex items-center justify-center font-black transition-transform duration-75 ${
            isRolling ? 'scale-110 blur-[0.4px] text-purple-300' : 'scale-100'
          }`}
        >
          <span
            className={`font-mono text-2xl tracking-tighter ${
              isCrit ? 'text-amber-300' : isFumble ? 'text-red-400' : 'text-white'
            }`}
          >
            {die.animatedFace}
          </span>
        </div>

        {/* Faixa inferior de acento de cor do dado */}
        <div
          className="absolute bottom-1 w-8 h-1 rounded-full opacity-70"
          style={{ backgroundColor: die.color }}
        />
      </div>

      {/* Controles de Incremento e Decremento Pós-Resultado (Aparecem no Hover) */}
      {!isRolling && (
        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-[#18181b]/95 border border-[#323238] rounded-md px-1 py-0.5 shadow-md z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              decrementDie(die.id);
            }}
            className="w-5 h-5 flex items-center justify-center rounded text-[#a1a1aa] hover:text-white hover:bg-white/10 active:scale-90 transition-transform"
            title="Reduzir face do dado (-1)"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="text-[10px] font-mono text-[#a1a1aa] px-0.5">
            {die.currentValue}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              incrementDie(die.id);
            }}
            className="w-5 h-5 flex items-center justify-center rounded text-[#a1a1aa] hover:text-white hover:bg-white/10 active:scale-90 transition-transform"
            title="Aumentar face do dado (+1)"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

