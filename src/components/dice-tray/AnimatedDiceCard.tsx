import React, { useState, useRef, memo } from 'react';
import { useDiceTrayStore, type TrayDie } from '@/store/useDiceTrayStore';
import DieShapeSVG from './DieShapeSVG';
import { Plus, Minus, X } from 'lucide-react';

interface AnimatedDiceCardProps {
  die: TrayDie;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

function AnimatedDiceCardComponent({ die, canvasRef }: AnimatedDiceCardProps) {
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

  // Cálculo da Esticada Dinâmica (Squash & Stretch na direção da velocidade)
  const speed = Math.hypot(die.vx || 0, die.vy || 0);
  const isHighVelocity = isRolling && speed > 20;
  const stretchFactor = isHighVelocity ? Math.min(0.24, (speed - 20) * 0.0022) : 0;
  const velocityAngle = isHighVelocity ? Math.atan2(die.vy || 0, die.vx || 0) * (180 / Math.PI) : 0;

  return (
    <div
      onPointerDown={handlePointerDown}
      style={{
        left: `${die.x}%`,
        top: `${die.y}%`,
        transform: `translate3d(-50%, -50%, 0) rotate(${currentRotation}deg) scale(${isDragging ? 1.12 : 1})`,
        willChange: isRolling ? 'transform, left, top' : 'auto',
        transition: isRolling ? 'none' : isDragging ? 'transform 0.15s ease-out' : 'transform 0.2s ease-out',
      }}
      className={`group absolute select-none cursor-grab active:cursor-grabbing ${
        isDragging ? 'z-50' : isRolling ? 'z-20' : 'z-10'
      }`}
    >
      <div className="relative flex items-center justify-center">
        {/* Sombra 1: Oclusão de Contato Direto com o Feltro (nítida e escura, desvanece no ar) */}
        <div
          className="absolute pointer-events-none rounded-full bg-black/85 filter blur-[2px]"
          style={{
            width: '56px',
            height: '24px',
            bottom: '-4px',
            left: '50%',
            transform: `translateX(-50%) scale(${Math.max(0.4, 1 - currentLift * 0.035)})`,
            opacity: Math.max(0, 0.85 - currentLift * 0.05),
            transition: isRolling ? 'none' : 'all 0.2s ease-out',
          }}
        />

        {/* Sombra 2: Sombra Projetada Difusa (move com altura Z e direção da luz) */}
        <div
          className="absolute pointer-events-none rounded-full bg-black/55 filter blur-[8px]"
          style={{
            width: '78px',
            height: '38px',
            bottom: '-10px',
            left: '50%',
            transform: `translateX(calc(-50% + ${4 + currentLift * 0.3}px)) translateY(${currentLift * 0.6}px) scale(${1 + currentLift * 0.018})`,
            opacity: Math.max(0.12, 0.65 - currentLift * 0.015),
            transition: isRolling ? 'none' : 'all 0.2s ease-out',
          }}
        />

        {/* Recipiente com Esticada Dinâmica (Squash & Stretch) e Perspectiva 3D */}
        <div
          style={{
            transform: `
              rotate(${velocityAngle}deg)
              scale(${1 + stretchFactor}, ${1 - stretchFactor * 0.45})
              rotate(${-velocityAngle}deg)
              perspective(650px)
              rotateX(${currentRotX}deg)
              rotateY(${currentRotY}deg)
              translateZ(${currentLift}px)
              scale(${isRolling ? 1.05 : 1})
            `,
            transformStyle: 'preserve-3d',
            willChange: isRolling ? 'transform' : 'auto',
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

export default memo(AnimatedDiceCardComponent);
