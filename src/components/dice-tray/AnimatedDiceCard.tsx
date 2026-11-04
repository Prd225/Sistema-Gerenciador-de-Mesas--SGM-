import React, { useState, useRef, useEffect, memo } from 'react';
import { useDiceTrayStore, type TrayDie } from '@/store/useDiceTrayStore';
import { diceDOMRegistry } from '@/lib/diceDOMRegistry';
import { diceAudio } from '@/lib/diceAudio';
import { diceHaptics } from '@/lib/diceHaptics';
import DieShapeSVG from './DieShapeSVG';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

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

  // Refs de acesso direto ao DOM para a animação de física e balanço a 144 FPS
  const cardRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const mainNumRef = useRef<SVGTextElement>(null);
  const sideNumRefs = useRef<(SVGTextElement | null)[]>([]);

  useEffect(() => {
    diceDOMRegistry.register(die.id, {
      card: cardRef,
      body: bodyRef,
      shadow: shadowRef,
      mainNum: mainNumRef,
      sideNums: sideNumRefs,
    });
    return () => {
      diceDOMRegistry.unregister(die.id);
    };
  }, [die.id]);

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

    diceAudio.playSelect();
    diceHaptics.pickup();

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
      diceAudio.playRelease();
      diceHaptics.drop();
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const currentRotation = isDragging ? 0 : die.rotation;
  const currentRotX = isDragging ? 0 : die.rotX || 0;
  const currentRotY = isDragging ? 0 : die.rotY || 0;
  const currentLift = isDragging ? 8 : die.lift || 0;
  const individualMod = die.modifier || 0;

  return (
    <div
      ref={cardRef}
      onPointerDown={handlePointerDown}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        left: `${die.x}%`,
        top: `${die.y}%`,
        transform: `translate3d(-50%, -50%, 0) scale(${isDragging ? 1.08 : 1})`,
        touchAction: 'none',
        willChange: isRolling ? 'transform, left, top' : 'auto',
        transition: isRolling ? 'none' : isDragging ? 'transform 0.15s ease-out' : 'transform 0.2s ease-out',
      }}
      className={`group absolute select-none cursor-grab active:cursor-grabbing touch-none ${
        isDragging ? 'z-50' : isRolling ? 'z-20' : 'z-10'
      }`}
    >
      <div className="relative flex items-center justify-center">
        {/* Sombra Esfumaçada Suave (Smoky Soft Shadow - sem bordas duras, difusa no feltro) */}
        <div
          ref={shadowRef}
          className="absolute pointer-events-none rounded-full"
          style={{
            width: '78px',
            height: '78px',
            left: '50%',
            top: '50%',
            marginLeft: '-39px',
            marginTop: '-35px',
            background: 'radial-gradient(circle, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.32) 42%, rgba(0,0,0,0) 74%)',
            filter: 'blur(7px)',
            transform: `translate3d(${currentLift * 0.45}px, ${currentLift * 0.55}px, 0) scale(${1 + currentLift * 0.02})`,
            opacity: Math.max(0.2, 0.65 - currentLift * 0.02),
            transition: isRolling ? 'none' : 'transform 0.15s ease-out, opacity 0.15s ease-out',
            willChange: isRolling ? 'transform, opacity' : 'auto',
          }}
        />

        {/* Recipiente com Rotação, Altura e Perspectiva 3D */}
        <div
          ref={bodyRef}
          style={{
            transform: `
              translate3d(0, ${-currentLift * 0.55}px, 0)
              rotate(${currentRotation}deg)
              perspective(550px)
              rotateX(${currentRotX}deg)
              rotateY(${currentRotY}deg)
              scale(${isRolling ? 1.04 : 1})
            `,
            transformStyle: 'preserve-3d',
            willChange: isRolling ? 'transform' : 'auto',
            transition: isRolling ? 'none' : 'transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        >
          {/* Renderizador de Silhueta Geométrica Autêntica com Facetas 3D */}
          <DieShapeSVG
            dieId={die.id}
            faces={die.faces}
            color={die.color}
            isCrit={isCrit}
            isFumble={isFumble}
            isRolling={isRolling}
            value={die.animatedFace}
            sideFaces={die.sideFaces}
            size={84}
            mainNumRef={mainNumRef}
            sideNumRefs={sideNumRefs}
          />
        </div>

        {/* Tag Flutuante de Modificador Individual do Dado */}
        {!isRolling && individualMod !== 0 && (
          <div
            className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-[#8257e5] border border-[#a78bfa] text-white font-mono font-black text-[10px] shadow-lg z-20 pointer-events-none select-none"
            title={`Modificador isolado: ${individualMod > 0 ? `+${individualMod}` : individualMod}`}
          >
            {individualMod > 0 ? `+${individualMod}` : individualMod}
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
            className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-[#18181b] border border-[#3f3f46] text-[#a1a1aa] hover:text-white hover:bg-red-600 hover:border-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-30"
            title="Remover dado da bandeja"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {/* Controles de Rotação de Face Pós-Resultado: Símbolos < e > (Aparecem no Hover) */}
        {!isRolling && (
          <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-[#18181b]/95 border border-[#323238] rounded-md px-1.5 py-0.5 shadow-xl z-30">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                decrementDie(die.id);
              }}
              className="w-5 h-5 flex items-center justify-center rounded text-[#a1a1aa] hover:text-white hover:bg-white/10 active:scale-90 transition-transform font-bold"
              title="Girar face para a anterior (<)"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold text-[#e4e4e7] px-1 min-w-[18px] text-center">
              {die.currentValue}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                incrementDie(die.id);
              }}
              className="w-5 h-5 flex items-center justify-center rounded text-[#a1a1aa] hover:text-white hover:bg-white/10 active:scale-90 transition-transform font-bold"
              title="Girar face para a próxima (>)"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(AnimatedDiceCardComponent);
