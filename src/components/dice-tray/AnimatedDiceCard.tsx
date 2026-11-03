import React, { useState, useRef } from 'react';
import { useDiceTrayStore, type TrayDie } from '@/store/useDiceTrayStore';
import DieShapeSVG from './DieShapeSVG';
import { Plus, Minus, X } from 'lucide-react';

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
    // Evita arrastar se clicou em um botão (+, -, X)
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

      const newX = Math.max(10, Math.min(90, dragStartRef.current.initialDieX + deltaPercentX));
      const newY = Math.max(12, Math.min(88, dragStartRef.current.initialDieY + deltaPercentY));

      // Ao arrastar, alinha a rotação e inclinação para 0 fluidamente ("retinho")
      updateDiePosition(die.id, Math.round(newX * 10) / 10, Math.round(newY * 10) / 10, 0, 0, 0);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Ao ser segurado/arrastado, fica "retinho" (0deg) fluidamente
  const currentRotation = isDragging ? 0 : die.rotation;
  const currentRotX = isDragging ? 0 : die.rotX || 0;
  const currentRotY = isDragging ? 0 : die.rotY || 0;
  const currentLift = isDragging ? 6 : die.lift || 0;

  return (
    <div
      onPointerDown={handlePointerDown}
      style={{
        left: `${die.x}%`,
        top: `${die.y}%`,
        transform: `translate(-50%, -50%) rotate(${currentRotation}deg) scale(${isDragging ? 1.12 : 1})`,
      }}
      className={`group absolute select-none cursor-grab active:cursor-grabbing transition-transform ${
        isDragging
          ? 'z-50 duration-150 ease-out'
          : isRolling
          ? 'z-20 duration-0'
          : 'z-10 duration-200 ease-out'
      }`}
    >
      <div className="relative flex items-center justify-center">
        {/* Sombra 3D projetada no feltro (reage à altura do salto e movimento) */}
        <div
          className="absolute pointer-events-none rounded-full bg-black/70 filter blur-[5px] transition-all"
          style={{
            width: '68px',
            height: '32px',
            bottom: '-6px',
            left: '50%',
            transform: `translateX(-50%) scale(${Math.max(0.65, 1 - currentLift * 0.016)}) translateY(${currentLift * 0.4}px)`,
            opacity: Math.max(0.2, 0.75 - currentLift * 0.018),
          }}
        />

        {/* Recipiente com perspectiva 3D e inclinação nas 3 dimensões (X, Y, Z) */}
        <div
          style={{
            transform: `perspective(650px) rotateX(${currentRotX}deg) rotateY(${currentRotY}deg) translateZ(${currentLift}px) scale(${
              isRolling ? 1.05 : 1
            })`,
            transformStyle: 'preserve-3d',
            transition: isRolling ? 'none' : 'transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        >
          {/* Renderizador de Silhueta Geométrica Autêntica com Facetas 3D */}
          <DieShapeSVG
            faces={die.faces}
            color={die.color}
            isCrit={isCrit}
            isFumble={isFumble}
            isRolling={isRolling}
            value={die.animatedFace}
            sideFaces={die.sideFaces}
            rotX={currentRotX}
            rotY={currentRotY}
            size={84}
          />
        </div>

        {/* Botão de Remover (Aparece no Hover) */}
        {!isRolling && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeDie(die.id);
            }}
            className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-[#18181b] border border-[#3f3f46] text-[#a1a1aa] hover:text-white hover:bg-red-600 hover:border-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-30"
            title="Remover dado da bandeja"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {/* Controles de Incremento e Decremento Pós-Resultado (Aparecem no Hover) */}
        {!isRolling && (
          <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-[#18181b]/95 border border-[#323238] rounded-md px-1.5 py-0.5 shadow-xl z-30">
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
            <span className="text-[10px] font-mono font-bold text-[#e4e4e7] px-0.5">
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
    </div>
  );
}
