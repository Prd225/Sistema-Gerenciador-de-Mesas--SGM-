import React, { useState, useRef } from 'react';
import { useDiceTrayStore } from '@/store/useDiceTrayStore';
import DiceTrayToolbar from './DiceTrayToolbar';
import DiceTrayCanvas from './DiceTrayCanvas';
import DiceTrayHistory from './DiceTrayHistory';
import DiceTrayRulesConfig from './DiceTrayRulesConfig';
import {
  Dices,
  Minimize2,
  Maximize2,
  X,
  History,
  Sliders,
  RotateCcw,
} from 'lucide-react';

export default function DiceTrayWindow() {
  const isOpen = useDiceTrayStore((state) => state.isOpen);
  const setIsOpen = useDiceTrayStore((state) => state.setIsOpen);
  const isMinimized = useDiceTrayStore((state) => state.isMinimized);
  const setIsMinimized = useDiceTrayStore((state) => state.setIsMinimized);
  const activeTab = useDiceTrayStore((state) => state.activeTab);
  const setActiveTab = useDiceTrayStore((state) => state.setActiveTab);

  const dice = useDiceTrayStore((state) => state.dice);
  const isRolling = useDiceTrayStore((state) => state.isRolling);
  const rollDice = useDiceTrayStore((state) => state.rollDice);
  const lastRollResult = useDiceTrayStore((state) => state.lastRollResult);

  // Posição flutuante arrastável da janela
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const windowRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  // Barra Minimizada Flutuante
  if (isMinimized) {
    return (
      <div className="fixed bottom-5 right-20 z-40 flex items-center gap-2 p-2 rounded-2xl bg-[#18181b]/95 border border-[#323238] shadow-2xl backdrop-blur-md select-none animate-in fade-in slide-in-from-bottom-2 duration-150">
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#202024] hover:bg-[#27272a] text-white text-xs font-bold transition-all active:scale-95"
        >
          <Dices className="w-4 h-4 text-[#8257e5]" />
          <span>Bandeja ({dice.length})</span>
        </button>

        {lastRollResult && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#202024]/60 border border-[#27272a] text-xs">
            <span className="text-[#a1a1aa] font-mono text-[11px] truncate max-w-[80px]">
              {lastRollResult.formula}
            </span>
            <span className="text-white font-mono font-black text-sm">
              = {lastRollResult.total}
            </span>
          </div>
        )}

        <button
          type="button"
          disabled={isRolling || dice.length === 0}
          onClick={() => rollDice()}
          className="p-1.5 rounded-xl bg-[#8257e5] hover:bg-[#9466ff] disabled:opacity-40 text-white transition-all active:scale-95"
          title="Rolar novamente"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isRolling ? 'animate-spin' : ''}`} />
        </button>

        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="p-1.5 rounded-xl text-[#a1a1aa] hover:text-white hover:bg-white/10 transition-colors"
          title="Maximizar janela"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="p-1.5 rounded-xl text-[#a1a1aa] hover:text-red-400 hover:bg-white/10 transition-colors"
          title="Fechar bandeja"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Header Drag Handler
  const handleHeaderPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const initialMouseX = e.clientX;
    const initialMouseY = e.clientY;

    const currentX = position?.x ?? (window.innerWidth - 760) / 2;
    const currentY = position?.y ?? (window.innerHeight - 560) / 2;

    const onPointerMove = (moveEv: PointerEvent) => {
      const deltaX = moveEv.clientX - initialMouseX;
      const deltaY = moveEv.clientY - initialMouseY;
      setPosition({
        x: Math.max(10, Math.min(window.innerWidth - 200, currentX + deltaX)),
        y: Math.max(10, Math.min(window.innerHeight - 100, currentY + deltaY)),
      });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const stylePosition = position
    ? { left: `${position.x}px`, top: `${position.y}px` }
    : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };

  return (
    <div
      ref={windowRef}
      style={stylePosition}
      className="fixed z-[160] w-[760px] max-w-[95vw] h-[540px] max-h-[85vh] flex flex-col rounded-2xl bg-[#141417]/98 border border-[#323238] shadow-[0_12px_40px_rgba(0,0,0,0.7)] backdrop-blur-md overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Barra de Título / Cabeçalho da Janela */}
      <div
        onPointerDown={handleHeaderPointerDown}
        className="flex items-center justify-between px-4 py-2.5 bg-[#18181b] border-b border-[#27272a] cursor-grab active:cursor-grabbing select-none"
      >
        {/* Identificação e Abas */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pr-3 border-r border-[#27272a]">
            <Dices className="w-4 h-4 text-[#8257e5]" />
            <span className="font-bold text-xs uppercase tracking-wider text-[#e4e4e7]">
              Bandeja
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('tray')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'tray'
                  ? 'bg-[#8257e5] text-white shadow-sm'
                  : 'text-[#a1a1aa] hover:text-white hover:bg-[#202024]'
              }`}
            >
              <Dices className="w-3.5 h-3.5" />
              <span>Bandeja</span>
              {dice.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30">
                  {dice.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-[#8257e5] text-white shadow-sm'
                  : 'text-[#a1a1aa] hover:text-white hover:bg-[#202024]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Histórico</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'rules'
                  ? 'bg-[#8257e5] text-white shadow-sm'
                  : 'text-[#a1a1aa] hover:text-white hover:bg-[#202024]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Regras</span>
            </button>
          </div>
        </div>

        {/* Controles de Janela (Minimizar / Fechar) */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="p-1.5 rounded-lg text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-all"
            title="Minimizar janela"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-[#a1a1aa] hover:text-red-400 hover:bg-[#27272a] transition-all"
            title="Fechar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Conteúdo da Janela */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'tray' && (
          <>
            <DiceTrayToolbar />
            <DiceTrayCanvas />
          </>
        )}
        {activeTab === 'history' && <DiceTrayHistory />}
        {activeTab === 'rules' && <DiceTrayRulesConfig />}
      </div>
    </div>
  );
}

